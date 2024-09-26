import draftToHtml from 'draftjs-to-html';
import { DateTime } from 'luxon';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorSchemeName, Dimensions, StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

import Colors from 'rn-viviboom/constants/Colors';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

import ProjectMediaCarousel from './ProjectMediaCarousel';

const screen = Dimensions.get('screen');

interface ProjectSectionProps {
  project: Project;
  projectSection?: Project | ProjectSection;
  isRootProject?: boolean;
}

export default function ProjectSection({ project, projectSection, isRootProject }: ProjectSectionProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const colorScheme = useColorScheme();

  // web view height
  const [webViewHeight, setWebViewHeight] = useState(0);

  const onWebViewMessage = (event: WebViewMessageEvent) => {
    setWebViewHeight(Number(event.nativeEvent.data));
  };

  const html = useMemo(() => {
    let contentHtml = '<div/>';
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      if (projectSection?.content) contentHtml = getHtmlForContent(draftToHtml(JSON.parse(projectSection?.content)), colorScheme);
    } catch (err) {
      console.warn(err);
    }
    return contentHtml;
  }, [colorScheme, projectSection?.content]);

  return (
    <View style={styles.container}>
      {!isRootProject && <MyText style={styles.title}>Project Update on {getDateString(projectSection?.createdAt)}</MyText>}
      {/* - 36 to account for padding of project section */}
      {!isRootProject && <ProjectMediaCarousel project={project} projectSection={projectSection as ProjectSection} carouselWidth={screen.width - 36} />}
      <View style={[styles.content, { height: webViewHeight + 10 }]}>
        {!!projectSection?.content && (
          <WebView
            source={{ html }}
            onMessage={onWebViewMessage}
            injectedJavaScript={webViewScript}
            style={{
              backgroundColor: Colors[colorScheme].contentBackground,
              opacity: webViewHeight > 0 ? 1 : 0,
            }}
          />
        )}
      </View>
      {isRootProject && <MyText style={styles.lastUpdated}>Last updated on {getDateString(projectSection?.updatedAt)}</MyText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    fontSize: 16,
    marginVertical: 18,
  },
  content: {
    width: '100%',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(160, 160, 160, 0.5)',
  },
  lastUpdated: {
    fontSize: 10,
    fontWeight: '400',
    color: '#666',
    marginVertical: 18,
  },
});

const getDateString = (date: Date) => {
  let res = '-';
  try {
    res = DateTime.fromJSDate(new Date(date)).toLocaleString(DateTime.DATE_MED);
  } catch (err) {
    console.warn(err);
  }
  return res;
};

const webViewScript = `
  setTimeout(function() { 
    window.ReactNativeWebView.postMessage(document.body.scrollHeight); 
  }, 500);
  true; // note: this is required, or you'll sometimes get silent failures
`;

// image height is limited for better ux
// eslint-disable-next-line prettier/prettier
const getHtmlForContent = (content: string, colorScheme: ColorSchemeName) => `
<!DOCTYPE html>\n
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link
      href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <style type="text/css">
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        width: 100%;
        background-color: ${Colors[colorScheme].contentBackground};
        color: ${Colors[colorScheme].text};
        font-family: 'Rajdhani', sans-serif;
        overflow: hidden;
      }
      img {
        max-width: ${screen.width - 18}px;
        max-height: ${screen.height / 2}px;
        object-fit: contain;
      }
    </style>
  </head>
  <body>
    ${content}
  </body>
</html>
`;
