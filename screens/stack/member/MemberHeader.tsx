import { useActionSheet } from '@expo/react-native-action-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Animated, Platform, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import Colors from 'rn-viviboom/constants/Colors';
import Config from 'rn-viviboom/constants/Config';
import { ContentReportType } from 'rn-viviboom/enums/ContentReportType';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

import { useChatContext } from '../chat/context/ChatContext';
import { backgroundHeight, headerHeight } from './constants';

const heightUpperLimit = backgroundHeight - headerHeight;
const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

interface MemberHeaderProps {
  member: User;
  onBackPressed: () => void;
  animatedOffset: Animated.Value;
  isRootEnv: boolean;
}

export default function MemberHeader({ member, onBackPressed, animatedOffset, isRootEnv }: MemberHeaderProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { showActionSheetWithOptions } = useActionSheet();
  const { chatClient } = useChatContext();

  const onClickMore = () => {
    showActionSheetWithOptions(
      {
        options: ['Share', 'Report', 'Cancel'],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 2,
      },
      async (buttonIndex) => {
        if (buttonIndex === 0) {
          // share
          try {
            const memberUrl = `${Config.MobileAppUrl}/member/${member?.id}`;
            const message = `Check out the profile of ${isRootEnv ? 'VIVINAUT' : 'creator'} ${member?.name} on VIVIBOOM`;
            const result = await Share.share({
              message: Platform.OS === 'ios' ? message : memberUrl,
              url: memberUrl,
              title: message,
            });
            if (result.action === Share.sharedAction) {
              Toast.show({ text1: 'Yay! Profile shared successfully', type: 'success' });
            }
          } catch (error) {
            Toast.show({ text1: error?.message, type: 'error' });
          }
        } else if (buttonIndex === 1) {
          // report
          navigation.navigate('ReportModalScreen', { relevantId: member?.id, relevantType: ContentReportType.USER });
        }
      },
    );
  };

  const onClickChat = async () => {
    if (+chatClient.user.id === member.id) {
      navigation.navigate('Chat');
    } else {
      const members = [chatClient.user.id, `${member.id}`];

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
            flex: 1,
            opacity: animatedOffset.interpolate({
              inputRange: [heightUpperLimit - 30, heightUpperLimit],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
          }}
        >
          <MyText numberOfLines={1}>{member?.name}</MyText>
        </Animated.View>
        <View style={styles.rightButton}>
          {!!chatClient && (
            <TouchableOpacity style={styles.actionButton} disabled={!chatClient} onPress={onClickChat}>
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
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClickMore} style={styles.actionButton}>
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
});
