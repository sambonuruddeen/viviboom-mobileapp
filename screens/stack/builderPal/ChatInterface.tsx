import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import BuilderPalApi from 'rn-viviboom/apis/viviboom/BuilderPalApi';
import BuilderPalAnim from 'rn-viviboom/assets/animations/builder-pal.json';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import { BuilderPalChatType } from 'rn-viviboom/enums/BuilderPalChatType';
import { BuilderPalRoleType } from 'rn-viviboom/enums/BuilderPalRoleType';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import ChatSuggestions from './ChatSuggestions';

const modalWidth = Math.min(Layout.screen.width - 2 * 18, 500);

const guidingQuestions = [
  { key: 'standard', content: 'I know what to built but need help', type: BuilderPalChatType.DISCOVERY },
  { key: 'guiding', content: "I don't know what I want to build", type: BuilderPalChatType.GUIDING },
  { key: 'conversational', content: 'I just want to talk to you casually', type: BuilderPalChatType.CONVERSATIONAL },
];

const DEFAULT_MESSAGE_REQUEST_COUNT = 20;

interface ChatInterfaceProps {
  chatId: number;
  hidePrompt?: boolean;
  showModal?: boolean;
  handleModalClose?: () => void;
}

export default function ChatInterface({ chatId, hidePrompt, showModal, handleModalClose }: ChatInterfaceProps) {
  const { t } = useTranslation('translation');
  const colorScheme = useColorScheme();
  const user = useReduxStateSelector((state) => state.account);

  const lottieRef = useRef<LottieView>();

  const [messages, setMessages] = useState<MyMessage[]>([]);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  const [isEndOfMessages, setIsEndOfMessages] = useState(false);

  const hasStartChat = messages.length > 1;

  const [streaming, setStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const fetchMessages = useCallback(
    async (hardRefresh = false) => {
      if (!chatId) return;
      if (isFetchingMessages) return;
      if (!hardRefresh && isEndOfMessages) return;
      setIsFetchingMessages(true);

      const requestParams = {
        authToken: user?.authToken,
        chatId,
        limit: DEFAULT_MESSAGE_REQUEST_COUNT,
        offset: hardRefresh ? 0 : messages.length,
      };

      try {
        const res = await BuilderPalApi.getMessages(requestParams);
        if (hardRefresh) {
          setMessages(res.data.messages);
        } else {
          setMessages([...messages, ...res.data.messages]);
        }

        // check if end of list
        if (res.data.messages.length < DEFAULT_MESSAGE_REQUEST_COUNT) {
          setIsEndOfMessages(true);
        }
      } catch (err) {
        console.error(err);
      }
      setIsFetchingMessages(false);
    },
    [chatId, isFetchingMessages, isEndOfMessages, user?.authToken, messages],
  );

  const sendMessage = async (content: string, type?: string, audio?: { uri: string; name: string; type: string }, duration?: number) => {
    if (!user.authToken || (!content && !audio) || !chatId) return;
    setMessages([
      {
        id: `assistant-message_${messages.length + 1}`,
        content: '',
        role: BuilderPalRoleType.ASSISTANT,
      },
      {
        id: `user-message_${messages.length}`,
        content,
        role: BuilderPalRoleType.USER,
        uri: audio ? audio.uri : undefined,
        duration,
      },
      ...messages,
    ]);
    try {
      setStreaming(true);
      const res = await BuilderPalApi.postMessage({
        authToken: user.authToken,
        chatId,
        text: content,
        type,
        file: audio,
      });
      const streamReader = res.body.getReader();
      setMessages((prev) => [{ ...prev[0], streamReader }, ...prev.slice(1)]);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      Toast.show({ type: 'error', text1: err.response?.data?.message || err.message });
    }
  };

  const onClickPromptQuestion = (question: typeof guidingQuestions[0]) => () => {
    sendMessage(question.content, question.type);
    handleModalClose();
  };

  useEffect(() => {
    fetchMessages(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // initial animation
  useEffect(() => {
    lottieRef.current?.play(0);
  }, []);

  const flatListRenderItem = ({ item }) => <ChatMessage message={item} setLoading={setStreaming} />;

  return (
    <>
      <View style={styles.listContainer}>
        <FlatList
          inverted
          data={messages}
          renderItem={flatListRenderItem}
          onEndReached={() => fetchMessages(false)}
          refreshing={isFetchingMessages}
          keyExtractor={(item) => `builderPal-message_${item.id}`}
          contentContainerStyle={{ paddingBottom: 36 }} // this is actually the top padding due to inverted list
        />
      </View>
      {!streaming && !isRecording && !hidePrompt && <ChatSuggestions chatId={chatId} hasStartChat={hasStartChat} sendMessage={sendMessage} />}
      <ChatInput chatId={chatId} isRecording={isRecording} setIsRecording={setIsRecording} sendMessage={sendMessage} />
      {!hidePrompt && (
        <Modal visible={showModal} hardwareAccelerated animationType={'slide'} onRequestClose={handleModalClose} transparent>
          <View style={styles.centeredView}>
            <View style={[styles.modalContentContainer, { backgroundColor: Colors[colorScheme].secondaryBackground }]}>
              <View style={styles.animContainer}>
                <LottieView ref={lottieRef} source={BuilderPalAnim} style={styles.landingAnim} loop />
              </View>
              <MyText style={styles.guidingTitle}>{t("Let's make something together! Do you have an idea you want to bring to life?")}</MyText>
              {guidingQuestions.map((q) => (
                <MyButton key={q.key} style={styles.guidingQuestion} onPress={onClickPromptQuestion(q)} labelStyle={styles.questionText} mode="outlined">
                  {t(q.content)}
                </MyButton>
              ))}
              <TouchableOpacity style={styles.otherButton} onPress={handleModalClose} activeOpacity={0.8}>
                <MyText style={{ ...styles.otherButtonText, color: Colors[colorScheme].textSecondary }}>{t('Or, simply jump to the chat')}</MyText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={handleModalClose} activeOpacity={0.8}>
                <Ionicons name="ios-close-outline" size={30} color={Colors[colorScheme].text} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  // modal
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: modalWidth,
    padding: 18,
  },
  animContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: modalWidth * 0.75,
    height: modalWidth * 0.75,
  },
  landingAnim: {
    width: modalWidth * 0.75,
    height: modalWidth * 0.75,
  },
  guidingTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 12,
  },
  guidingQuestion: {
    width: '100%',
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 0,
  },
  questionText: {
    marginHorizontal: 0,
    fontSize: 13,
  },
  otherButton: {
    marginTop: 16,
    marginBottom: 4,
  },
  otherButtonText: {
    fontWeight: '400',
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },
});
