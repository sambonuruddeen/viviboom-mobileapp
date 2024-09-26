import { useActionSheet } from '@expo/react-native-action-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Platform, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import Colors from 'rn-viviboom/constants/Colors';
import Config from 'rn-viviboom/constants/Config';
import Layout from 'rn-viviboom/constants/Layout';
import MyText from 'rn-viviboom/hoc/MyText';
import MyTooltip from 'rn-viviboom/hoc/MyTooltip';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import CreateProjectReduxActions from 'rn-viviboom/redux/createProject/CreateProjectReduxActions';
import OnboardingReduxActions from 'rn-viviboom/redux/onboarding/OnboardingReduxActions';

import { useChatContext } from '../chat/context/ChatContext';
import { backgroundHeight, headerHeight } from './constants';

const heightUpperLimit = backgroundHeight - headerHeight;
const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

interface ProjectHeaderProps {
  badge: Badge;
  onBackPressed: () => void;
  animatedOffset: Animated.Value;
}

export default function BadgeHeader({ badge, onBackPressed, animatedOffset }: ProjectHeaderProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'badges' });
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { showActionSheetWithOptions } = useActionSheet();
  const navigation = useNavigation();
  const { chatClient } = useChatContext();

  const [showHint, setShowHint] = useState<string>();
  const onboarding = useReduxStateSelector((state) => state.onboarding);

  useEffect(() => {
    if (!onboarding?.chatWithBadgeChallengeCreator) setTimeout(() => setShowHint('chatWithBadgeChallengeCreator'), 1500);
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
            const badgeUrl = `${Config.MobileAppUrl}/badge/${badge?.id}`;
            const message = `Check out the badge ${badge?.name} on VIVIBOOM`;
            const result = await Share.share({
              message: Platform.OS === 'ios' ? message : badgeUrl,
              url: badgeUrl,
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
    CreateProjectReduxActions.setProject({ badges: [badge], isCompleted: true });
    navigation.navigate('AddProjectMediaScreen');
  };

  const onClickChat = async () => {
    if (+chatClient.user.id === badge.createdByUserId) {
      navigation.navigate('Chat');
    } else {
      const members = [chatClient.user.id, `${badge.createdByUserId}`];

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
          <TouchableOpacity onPress={onBackPressed}>
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
            {badge?.name}
          </MyText>
        </Animated.View>
        <View style={styles.rightButton}>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={onSubmitProject} style={styles.actionButton}>
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
              <TouchableOpacity onPress={onClickChat} disabled={!chatClient} style={styles.actionButton}>
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
          </View>
          <TouchableOpacity onPress={onPressMore} style={styles.actionButton}>
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
    marginRight: 15,
  },
});
