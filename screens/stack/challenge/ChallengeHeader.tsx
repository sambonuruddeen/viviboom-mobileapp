import { useActionSheet } from '@expo/react-native-action-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Image, Platform, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import BuilderPalApi from 'rn-viviboom/apis/viviboom/BuilderPalApi';
import BuilderPal from 'rn-viviboom/assets/images/builderpal.png';
import Colors from 'rn-viviboom/constants/Colors';
import Config from 'rn-viviboom/constants/Config';
import Layout from 'rn-viviboom/constants/Layout';
import { BuilderPalChatType } from 'rn-viviboom/enums/BuilderPalChatType';
import MyText from 'rn-viviboom/hoc/MyText';
import MyTooltip from 'rn-viviboom/hoc/MyTooltip';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import CreateProjectReduxActions from 'rn-viviboom/redux/createProject/CreateProjectReduxActions';
import OnboardingReduxActions from 'rn-viviboom/redux/onboarding/OnboardingReduxActions';

import ChatInterface from '../builderPal/ChatInterface';
import { useChatContext } from '../chat/context/ChatContext';
import { backgroundHeight, headerHeight } from './constants';

const heightUpperLimit = backgroundHeight - headerHeight;
const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

interface ProjectHeaderProps {
  challenge: Badge;
  onBackPressed: () => void;
  animatedOffset: Animated.Value;
}

export default function ChallengeHeader({ challenge, onBackPressed, animatedOffset }: ProjectHeaderProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'challenges' });
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { showActionSheetWithOptions } = useActionSheet();
  const navigation = useNavigation();
  const { chatClient } = useChatContext();
  const account = useReduxStateSelector((state) => state.account);

  const [showHint, setShowHint] = useState<string>();
  const onboarding = useReduxStateSelector((state) => state.onboarding);

  const [guidanceChatId, setGuidanceChatId] = useState<number>();

  const bottomSheetRef = useRef<RBSheet>();

  useEffect(() => {
    if (!onboarding?.chatWithBadgeChallengeCreator) setTimeout(() => setShowHint('chatWithBadgeChallengeCreator'), 1500);
    if (!onboarding?.chatWithBadgeChallengeCreator) setTimeout(() => setShowHint('chatWithChallengeBuilderPal'), 1500);
  }, []);

  const onPressMore = () => {
    showActionSheetWithOptions(
      {
        options: ['Share', 'Cancel'],
        cancelButtonIndex: 1,
      },
      async (buttonIndex) => {
        if (buttonIndex === 0) {
          // share
          try {
            const challengeUrl = `${Config.MobileAppUrl}/challenge/${challenge?.id}`;
            const message = `Check out the challenge ${challenge?.name} on VIVIBOOM`;
            const result = await Share.share({
              message: Platform.OS === 'ios' ? message : challengeUrl,
              url: challengeUrl,
              title: message,
            });
            if (result.action === Share.sharedAction) {
              Toast.show({ text1: 'Yay! Badge shared successfully', type: 'success' });
            }
          } catch (error) {
            Toast.show({ text1: error?.message, type: 'error' });
          }
        }
      },
    );
  };

  const onSubmitProject = () => {
    CreateProjectReduxActions.clearAll();
    CreateProjectReduxActions.setProject({ badges: [challenge], isCompleted: true });
    navigation.navigate('AddProjectMediaScreen');
  };

  const onClickChat = async () => {
    if (+chatClient.user.id === challenge.createdByUserId) {
      navigation.navigate('Chat');
    } else {
      const members = [chatClient.user.id, `${challenge.createdByUserId}`];

      // Check if the channel already exists.
      const channels = await chatClient.queryChannels({
        distinct: true,
        members,
      });

      if (channels.length === 1) {
        navigation.navigate('Chat', { screen: 'ChannelScreen', params: { channelId: channels[0].id }, initial: false });
      } else {
        navigation.navigate('Chat', { screen: 'NewDirectMessagingScreen', initial: false });
      }
    }
  };

  const loadChat = useCallback(async () => {
    if (!challenge?.id) return;
    try {
      const res = await BuilderPalApi.post({ authToken: account.authToken, type: BuilderPalChatType.GUIDANCE_CHALLENGE, challengeId: challenge.id });
      setGuidanceChatId(res?.data?.chatId);
    } catch (err) {
      console.error(err.response?.data?.message || err.message);
    }
  }, [account.authToken, challenge.id]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  return (
    <>
      <Animated.View
        style={{
          ...styles.container,
          paddingTop: insets.top,
          height: styles.container.height + insets.top,
          backgroundColor: Colors[colorScheme].contentBackground,
          opacity: animatedOffset.interpolate({
            inputRange: [0, heightUpperLimit],
            outputRange: [0, 1],
            extrapolate: 'clamp',
          }),
        }}
      />
      <View style={{ ...styles.container, paddingTop: insets.top, height: styles.container.height + insets.top }}>
        <View style={styles.button}>
          <TouchableOpacity onPress={onBackPressed} activeOpacity={0.8}>
            <AnimatedIcon
              name="ios-chevron-back-outline"
              size={24}
              style={{
                color: animatedOffset.interpolate({
                  inputRange: [0, heightUpperLimit],
                  outputRange: ['#fff', Colors[colorScheme].text],
                  extrapolate: 'clamp',
                }),
              }}
            />
          </TouchableOpacity>
        </View>
        <Animated.View
          style={{
            opacity: animatedOffset.interpolate({
              inputRange: [heightUpperLimit - 30, heightUpperLimit],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
          }}
        >
          <MyText numberOfLines={1} style={styles.title}>
            {challenge?.name}
          </MyText>
        </Animated.View>
        <View style={styles.rightButton}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <TouchableOpacity onPress={onSubmitProject} style={styles.actionButton} activeOpacity={0.8}>
              <AnimatedIcon
                name="ios-create-outline"
                size={22}
                style={{
                  color: animatedOffset.interpolate({
                    inputRange: [0, heightUpperLimit],
                    outputRange: ['#fff', Colors[colorScheme].text],
                    extrapolate: 'clamp',
                  }),
                }}
              />
            </TouchableOpacity>
            {!!chatClient && (
              <TouchableOpacity onPress={onClickChat} disabled={!chatClient} style={styles.actionButton} activeOpacity={0.8}>
                <MyTooltip
                  isVisible={showHint === 'chatWithBadgeCreator'}
                  text="Talk to the Creator Here!"
                  placement="bottom"
                  onClose={() => {
                    OnboardingReduxActions.save({ chatWithBadgeChallengeCreator: true });
                    setShowHint('');
                  }}
                >
                  <AnimatedIcon
                    name="ios-chatbubble-outline"
                    size={22}
                    style={{
                      color: animatedOffset.interpolate({
                        inputRange: [0, heightUpperLimit],
                        outputRange: ['#fff', Colors[colorScheme].text],
                        extrapolate: 'clamp',
                      }),
                    }}
                  />
                </MyTooltip>
              </TouchableOpacity>
            )}
            {account?.institution?.isBuilderPalEnabled && (
              <TouchableOpacity onPress={() => bottomSheetRef.current?.open()} style={styles.actionButton} activeOpacity={0.8}>
                <MyTooltip
                  isVisible={showHint === 'chatWithChallengeBuilderPal'}
                  text="Talk to BuilderPal Here!"
                  placement="bottom"
                  onClose={() => {
                    OnboardingReduxActions.save({ chatWithBadgeChallengeCreator: true });
                    setShowHint('');
                  }}
                >
                  <Image source={BuilderPal} style={styles.builderPalIcon} />
                </MyTooltip>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={onPressMore} style={styles.actionButton} activeOpacity={0.8}>
            <AnimatedIcon
              name="ios-ellipsis-horizontal"
              size={24}
              style={{
                color: animatedOffset.interpolate({
                  inputRange: [0, heightUpperLimit],
                  outputRange: ['#fff', Colors[colorScheme].text],
                  extrapolate: 'clamp',
                }),
              }}
            />
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
    top: 0,
    left: 0,
    right: 0,
    height: headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    maxWidth: Layout.screen.width - 3 * 50,
  },
  button: {
    width: 50,
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightButton: {
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginRight: 18,
  },
  builderPalIcon: {
    width: 28,
    height: 28,
  },
  bottomSheetBackground: {
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
  },
});
