import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { ImageRequireSource, StyleSheet, TouchableOpacity, View } from 'react-native';

import DefaultBadgePicture from 'rn-viviboom/assets/images/default-badge-picture.png';
import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import Coin from 'rn-viviboom/assets/images/v-coin.png';
import Logo from 'rn-viviboom/assets/images/vivita-logo.jpeg';
import Colors from 'rn-viviboom/constants/Colors';
import NotificationTypeEnum from 'rn-viviboom/enums/NotificationType';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { RootStackParamList } from 'rn-viviboom/navigation/types';

const notificationBadgeImageSize = { width: 128, suffix: 'png' };
const notificationProjectImageSize = { width: 128 };

const posWords = ['Awesome', 'Sweet', 'Nice', 'Good news', 'Excellent', 'Woo', 'Yeah', 'Yay', 'Hooray', 'Fantastic', 'Gnarly', 'Epic'];
const posMojis = ['😁', '🤩', '💪', '🚀', '🔥'];

const negWords = ['Bummer', 'Dang', 'Bad news', 'Bonkers'];
const negMojis = ['🤕', '🥴', '😵', '😖'];

const stripeHtmlRegex = /<[^>]*>/gim;

const commentNotificationTypes = [NotificationTypeEnum.COMMENT_LIKE, NotificationTypeEnum.COMMENT_REPLY, NotificationTypeEnum.PROJECT_COMMENT];

interface INotificationItemProps {
  notification: AppNotification;
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

export default function NotificationItem({ notification, navigation }: INotificationItemProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'notifications' });
  const colorScheme = useColorScheme();

  const onPressNotificationItem = () => {
    if (notification?.badge?.id) {
      const { isChallenge } = notification.badge;
      if (isChallenge) {
        navigation.navigate('ChallengeScreen', { preloadedData: notification.badge });
      } else {
        navigation.navigate('BadgeScreen', { preloadedData: notification.badge });
      }
    } else if (notification?.project?.id) {
      navigation.navigate('ProjectScreen', {
        preloadedData: notification.project,
        showCommentSection: commentNotificationTypes.includes(notification.type),
      });
    } else if (notification.type === NotificationTypeEnum.WALLET_ACTIVATION || notification.type === NotificationTypeEnum.TRANSACTION_RECEIVE) {
      navigation.navigate('EWalletScreen');
    }
  };

  const onPressImage = () => {
    if (notification?.badge) {
      const { isChallenge } = notification.badge;
      if (isChallenge) {
        navigation.navigate('ChallengeScreen', { preloadedData: notification.badge });
      } else {
        navigation.navigate('BadgeScreen', { preloadedData: notification.badge });
      }
    } else if (notification.actingUser) {
      navigation.navigate('MemberScreen', { preloadedData: notification.actingUser });
    }
  };

  const posWord = notification.id % posWords.length;
  const posMoji = notification.id % posMojis.length;
  const negWord = notification.id % negWords.length;
  const negMoji = notification.id % negMojis.length;

  let text: string = null;
  let imageUri: string;
  let defaultImage: number = Logo as ImageRequireSource;
  if (notification.badge) {
    imageUri = notification.badge?.imageUri;
    defaultImage = DefaultBadgePicture as ImageRequireSource;
  } else if (notification.actingUser) {
    imageUri = notification.actingUser?.profileImageUri;
    defaultImage = DefaultProfilePicture as ImageRequireSource;
  }
  switch (notification.type) {
    case NotificationTypeEnum.MESSAGE:
      text = notification.text ? notification.text : '';
      break;
    case NotificationTypeEnum.CHALLENGE_AWARD:
    case NotificationTypeEnum.BADGE_AWARD:
      text = `${t(posWords[posWord])}! ${posMojis[posMoji]} ${t(notification?.badge?.isChallenge ? 'newChallenge' : 'newBadge', {
        name: notification.badge?.name || '-',
      })}`;
      break;
    case NotificationTypeEnum.CHALLENGE_REMOVAL:
    case NotificationTypeEnum.BADGE_REMOVAL:
      text = `${t(negWords[negWord])}! ${negMojis[negMoji]} ${t(notification?.badge?.isChallenge ? 'lostChallenge' : 'lostBadge', {
        name: notification.badge?.name || '-',
      })}`;
      break;
    case NotificationTypeEnum.COMMENT_LIKE:
      text = `${t(posWords[posWord])}! ${posMojis[posMoji]} ${t('likeComment', { name: notification.actingUser?.name || '-' })}`;
      break;
    case NotificationTypeEnum.COMMENT_REPLY:
      text = `${t(posWords[posWord])}! ${posMojis[posMoji]} ${t('replyComment', { name: notification.actingUser?.name || '-' })}`;
      break;
    case NotificationTypeEnum.PROJECT_BADGE_APPROVAL:
      text = `${t(posWords[posWord])}! ${posMojis[posMoji]} ${t('badgeApprove', {
        projectName: notification.project?.name || '-',
        userName: notification.actingUser?.name || '-',
      })}`;
      break;
    case NotificationTypeEnum.PROJECT_BADGE_REJECTION:
      text = `${t(negWords[negWord])}! ${negMojis[negMoji]} ${t('badgeReject', { name: notification.project?.name || '-' })}`;
      break;
    case NotificationTypeEnum.PROJECT_COMMENT:
      text = `${t(posWords[posWord])}! ${posMojis[posMoji]} ${t('projectComment', {
        userName: notification.actingUser?.name || '-',
        projectName: notification.project?.name || '-',
      })}`;
      break;
    case NotificationTypeEnum.PROJECT_LIKE:
      text = `${t(posWords[posWord])}! ${posMojis[posMoji]} ${t('projectLike', {
        userName: notification.actingUser?.name || '-',
        projectName: notification.project?.name || '-',
      })}`;
      break;
    case NotificationTypeEnum.STARTER_CRITERIA:
      text = `${t(posWords[posWord])}! ${posMojis[posMoji]} ${t('starterCriteria')}`;
      break;
    case NotificationTypeEnum.WALLET_ACTIVATION:
      text = `${t(posWords[posWord])}! ${posMojis[posMoji]} ${t('walletActivation')}`;
      defaultImage = Coin as ImageRequireSource;
      break;
    case NotificationTypeEnum.TRANSACTION_RECEIVE:
      text = `${t(posWords[posWord])}! ${posMojis[posMoji]} ${notification.text}`;
      defaultImage = Coin as ImageRequireSource;
      break;
    default:
      break;
  }

  text = text?.replace(stripeHtmlRegex, '');

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: Colors[colorScheme].contentBackground }]}
      activeOpacity={1}
      onPress={onPressNotificationItem}
    >
      <View style={styles.innerContainer}>
        <TouchableOpacity activeOpacity={1} onPress={onPressImage}>
          <MyImage uri={imageUri} defaultSource={defaultImage} params={notificationBadgeImageSize} style={styles.badgeImage} imageFormat="png" />
        </TouchableOpacity>
        <View style={styles.textContainer}>
          <MyText style={styles.bodyText}>{text}</MyText>
          <MyText style={styles.timeText}>{DateTime.fromJSDate(new Date(notification.createdAt)).toLocaleString(DateTime.DATETIME_MED)}</MyText>
        </View>
        {!!notification?.project?.thumbnailUri && (
          <MyImage uri={notification?.project?.thumbnailUri} params={notificationProjectImageSize} style={styles.projectImage} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    minHeight: 86,
  },
  innerContainer: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(160, 160, 160, 0.2)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  badgeImage: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
    borderRadius: 31,
  },
  textContainer: {
    flex: 1,
    paddingLeft: 12,
  },
  projectImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginLeft: 10,
  },
  bodyText: {
    fontWeight: '400',
  },
  timeText: {
    fontWeight: '400',
    fontSize: 12,
    marginTop: 12,
    color: 'rgba(128, 128, 128, 1)',
  },
});
