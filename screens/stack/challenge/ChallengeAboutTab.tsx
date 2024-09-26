import draftToHtml from 'draftjs-to-html';
import { forwardRef, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, ColorSchemeName, Dimensions, Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

import About from 'rn-viviboom/assets/images/icon-about.png';
import Questions from 'rn-viviboom/assets/images/icon-question.png';
import Steps from 'rn-viviboom/assets/images/icon-steps.png';
import Tips from 'rn-viviboom/assets/images/icon-tips.png';
import Tools from 'rn-viviboom/assets/images/icon-tools.png';
import Colors from 'rn-viviboom/constants/Colors';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

import { backgroundHeight, tabBarHeight } from './constants';

const screen = Dimensions.get('screen');

const AboutTab = forwardRef<ScrollView, { challenge: Badge; scrollY: Animated.Value; onScrollEnd:() => void }>(({ challenge, scrollY, onScrollEnd }, ref) => {
  const { t } = useTranslation('translation', { keyPrefix: 'challenges' });
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [contentWebViewHeight, setContentWebViewHeight] = useState({
    material: screen.height / 2,
    step: screen.height / 2,
    tip: screen.height / 2,
    question: screen.height / 2,
  });
  const [isWebViewLoaded, setWebViewLoaded] = useState({
    material: false,
    step: false,
    tip: false,
    question: false,
  });

  const onWebViewMessage = (key: string) => (event: WebViewMessageEvent) => {
    const value = event?.nativeEvent?.data;
    if (value) setContentWebViewHeight((prevHeight) => ({ ...prevHeight, [key]: +value }));
    setWebViewLoaded((prevLoaded) => ({ ...prevLoaded, [key]: true }));
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const materialHtml = useMemo(() => convertContentToHtml(challenge?.materialContent), [challenge?.materialContent]);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const stepHtml = useMemo(() => convertContentToHtml(challenge?.content), [challenge?.content]);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const tipHtml = useMemo(() => convertContentToHtml(challenge?.tipContent), [challenge?.tipContent]);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const questionHtml = useMemo(() => convertContentToHtml(challenge?.questionContent), [challenge?.questionContent]);

  const paddingTop = useMemo(() => backgroundHeight + tabBarHeight + insets.top, [insets]);

  const isLoading = useMemo(
    () =>
      (!!challenge?.materialContent && !isWebViewLoaded.material) ||
      (!!challenge?.content && !isWebViewLoaded.step) ||
      (!!challenge?.tipContent && !isWebViewLoaded.tip) ||
      (!!challenge?.questionContent && !isWebViewLoaded.question),
    [challenge, isWebViewLoaded],
  );

  return (
    <View style={{ height: '100%' }}>
      <Animated.ScrollView
        contentContainerStyle={{ width: '100%', paddingTop, marginTop: 10, marginLeft: 5 }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        showsVerticalScrollIndicator={false}
        onScrollEndDrag={onScrollEnd}
        onMomentumScrollEnd={onScrollEnd}
        ref={ref}
      >
        {!!challenge?.description && (
          <View style={[styles.content]}>
            <View style={styles.subtitle}>
              <Image style={styles.logo} source={About} />
              <MyText style={styles.headerText}>{t('About this challenge')}</MyText>
            </View>
            <MyText style={styles.descriptionText}>{challenge?.description}</MyText>
          </View>
        )}
        {isLoading && <ActivityIndicator size={24} style={{ margin: 18 }} />}
        {!!challenge?.materialContent && (
          <View style={[styles.content, { opacity: isWebViewLoaded.material ? 1 : 0 }]}>
            <View style={styles.subtitle}>
              <Image style={styles.logo} source={Tools} />
              <MyText style={styles.headerText}>{t('Required tools and materials')}</MyText>
            </View>
            <WebView
              style={{
                height: Math.max(calculateEstimatedHeight(materialHtml), contentWebViewHeight.material),
                backgroundColor: Colors[colorScheme].contentBackground,
              }}
              source={{ html: decorateHtml(materialHtml, colorScheme) }}
              automaticallyAdjustContentInsets={false}
              scrollEnabled={false}
              onMessage={onWebViewMessage('material')}
              injectedJavaScript={webViewScript}
            />
          </View>
        )}
        {!!challenge?.content && (
          <View style={[styles.content, { opacity: isWebViewLoaded.step ? 1 : 0 }]}>
            <View style={styles.subtitle}>
              <Image style={styles.logo} source={Steps} />
              <MyText style={styles.headerText}>{t('Steps to complete this challenge')}</MyText>
            </View>
            <WebView
              style={{
                height: Math.max(calculateEstimatedHeight(stepHtml), contentWebViewHeight.step),
                backgroundColor: Colors[colorScheme].contentBackground,
              }}
              source={{ html: decorateHtml(stepHtml, colorScheme) }}
              automaticallyAdjustContentInsets={false}
              scrollEnabled={false}
              onMessage={onWebViewMessage('step')}
              injectedJavaScript={webViewScript}
            />
          </View>
        )}
        {!!challenge?.tipContent && (
          <View style={[styles.content, { opacity: isWebViewLoaded.tip ? 1 : 0 }]}>
            <View style={styles.subtitle}>
              <Image style={styles.logo} source={Tips} />
              <MyText style={styles.headerText}>{t('Useful tips')}</MyText>
            </View>
            <WebView
              style={{
                height: Math.max(calculateEstimatedHeight(tipHtml), contentWebViewHeight.tip),
                backgroundColor: Colors[colorScheme].contentBackground,
              }}
              source={{ html: decorateHtml(tipHtml, colorScheme) }}
              automaticallyAdjustContentInsets={false}
              scrollEnabled={false}
              onMessage={onWebViewMessage('tip')}
              injectedJavaScript={webViewScript}
            />
          </View>
        )}
        {!!challenge?.questionContent && (
          <View style={[styles.content, { opacity: isWebViewLoaded.question ? 1 : 0 }]}>
            <View style={styles.subtitle}>
              <Image style={styles.logo} source={Questions} />
              <MyText style={styles.headerText}>{t('Commonly asked questions')}</MyText>
            </View>
            <WebView
              style={{
                height: Math.max(calculateEstimatedHeight(questionHtml), contentWebViewHeight.question),
                backgroundColor: Colors[colorScheme].contentBackground,
              }}
              source={{ html: decorateHtml(questionHtml, colorScheme) }}
              automaticallyAdjustContentInsets={false}
              scrollEnabled={false}
              onMessage={onWebViewMessage('question')}
              injectedJavaScript={webViewScript}
            />
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
});

export default AboutTab;

const styles = StyleSheet.create({
  content: {
    width: '100%',
    padding: 14,
  },
  headerText: {
    fontWeight: '600',
    fontSize: 18,
    paddingHorizontal: 10,
  },
  descriptionText: {
    fontWeight: '300',
    fontSize: 16,
    lineHeight: 30,
  },
  subtitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 30,
    height: 30,
  },
});

const webViewScript = `
  setTimeout(function() { 
    window.ReactNativeWebView.postMessage(document.body.scrollHeight); 
  }, 500);
  true; // note: this is required, or you'll sometimes get silent failures
`;

const convertContentToHtml = (content: string) => {
  let contentHtml = '<div/>';
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (content) contentHtml = draftToHtml(JSON.parse(content));
  } catch (err) {
    console.warn(err);
  }
  return contentHtml;
};

// image height is limited for better ux
// eslint-disable-next-line prettier/prettier
const decorateHtml = (html: string, colorScheme: ColorSchemeName) => `
  <!DOCTYPE html>\n
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link
        href="https://fonts.googleapis.com/css?family=Titillium Web"
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
          font-family: 'Titillium Web';
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
      ${html}
    </body>
  </html>
`;

const calculateEstimatedHeight = (contentHTML: string) => {
  let totalHeight = 0;
  let totalLineHeight = 0;
  let totalImgHeight = 0;
  let totalVidHeight = 0;

  if (contentHTML.match(/(<li)|(<ul)|(<br)/g) !== null) {
    totalLineHeight = contentHTML.match(/(<li)|(<ul)|(<br)/g).length * 14 * 1.15;
  }
  if (contentHTML.match(/<p>(.*?)<\/p>/g) !== null) {
    const textArray = contentHTML.match(/<p>(.*?)<\/p>/g).map((v) => v.replace(/<\/?p>/g, ''));
    for (let i = 0; i < textArray.length; i += 1) {
      if (textArray[i].length > 0) {
        totalLineHeight += Math.ceil(textArray[i].length / screen.width) * 14 * 1.15 + 50;
      } else {
        totalLineHeight += 1 * 14 * 1.15;
      }
    }
  }
  if (contentHTML.match(/(<iframe)/g) !== null) {
    totalVidHeight = contentHTML.match(/(<iframe)/g).length * (screen.height / 3);
  }
  if (contentHTML.match(/<img [^>]*src="[^"]*"[^>]*>/gm) !== null) {
    totalImgHeight = (contentHTML.match(/<img [^>]*src="[^"]*"[^>]*>/gm).length * screen.height) / 2;
  }
  totalHeight = totalLineHeight + totalImgHeight + totalVidHeight + 40;

  return totalHeight;
};
