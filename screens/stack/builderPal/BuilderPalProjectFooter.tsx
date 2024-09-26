import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import BuilderPalApi from 'rn-viviboom/apis/viviboom/BuilderPalApi';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import { BuilderPalChatType } from 'rn-viviboom/enums/BuilderPalChatType';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

import ChatInterface from './ChatInterface';

interface BuilderPalProjectFooterProps {
  project: ChatProject;
}

export default function BuilderPalProjectFooter({ project }: BuilderPalProjectFooterProps) {
  const { t } = useTranslation('translation');
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const account = useReduxStateSelector((state) => state.account);

  const [isUserSaved, setUserSaved] = useState<boolean>(false);

  const [guidanceChatId, setGuidanceChatId] = useState<number>();

  const bottomSheetRef = useRef<RBSheet>();

  const saveToggle = async () => {
    try {
      await BuilderPalApi.patchProject({
        authToken: account.authToken,
        chatId: project?.chatId,
        projectId: project?.id,
        isSaved: !isUserSaved,
      });
      if (!isUserSaved) Toast.show({ text1: 'Project Added to Favorites!', type: 'success' });
      setUserSaved((b) => !b);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      Toast.show({ type: 'error', text1: err.message });
      console.error(err);
    }
  };

  const loadGuidanceChat = useCallback(async () => {
    if (!project?.id) return;
    const guidanceChatResult = await BuilderPalApi.post({
      authToken: account.authToken,
      type: BuilderPalChatType.GUIDANCE,
      chatProjectId: project.id,
    });
    setGuidanceChatId(guidanceChatResult.data?.chatId);
  }, [account.authToken, project?.id]);

  useEffect(() => {
    setUserSaved(!!project?.isSaved);
  }, [project?.isSaved]);

  useEffect(() => {
    if (project?.guidanceChatId) {
      setGuidanceChatId(project?.guidanceChatId);
    } else {
      loadGuidanceChat();
    }
  }, [loadGuidanceChat, project?.guidanceChatId]);

  return (
    <>
      <View
        style={{
          ...styles.container,
          backgroundColor: Colors[colorScheme].background,
          paddingBottom: insets.bottom,
          height: styles.container.height + insets.bottom,
        }}
      >
        <View style={styles.button}>
          <TouchableOpacity onPress={saveToggle} style={styles.buttonInner}>
            <Ionicons name={isUserSaved ? 'ios-heart' : 'ios-heart-outline'} size={26} color="rgb(248,48,95)" />
            <MyText style={{ color: 'rgb(248,48,95)', marginLeft: 8, fontSize: 15, fontWeight: '400' }}>
              {t(isUserSaved ? 'Marked as Favorite' : 'Add to Favorite!')}
            </MyText>
          </TouchableOpacity>
        </View>
        <View style={styles.button}>
          <TouchableOpacity onPress={() => bottomSheetRef.current?.open()} style={styles.buttonInner}>
            <Ionicons name="ios-chatbubble-outline" size={22} color={Colors[colorScheme].text} />
            <MyText style={{ marginLeft: 8, fontSize: 15, fontWeight: '400' }}>{t('Chat')}</MyText>
          </TouchableOpacity>
        </View>
      </View>
      <RBSheet
        ref={bottomSheetRef}
        height={Layout.screen.height * 0.5}
        closeOnDragDown
        dragFromTopOnly
        customStyles={{
          container: [styles.bottomSheetBackground, { backgroundColor: Colors[colorScheme].background }],
          wrapper: { marginBottom: insets.bottom },
        }}
      >
        <ChatInterface chatId={guidanceChatId} hidePrompt />
      </RBSheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(160, 160, 160, 0.3)',
  },
  button: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetBackground: {
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
  },
});
