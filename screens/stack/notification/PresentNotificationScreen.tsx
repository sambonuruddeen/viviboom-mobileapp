import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageRequireSource, StyleSheet, TouchableWithoutFeedback } from 'react-native';

import Confetti from 'rn-viviboom/assets/animations/confetti.json';
import StarterBadgePicture from 'rn-viviboom/assets/images/launch.png';
import Layout from 'rn-viviboom/constants/Layout';
import NotificationTypeEnum from 'rn-viviboom/enums/NotificationType';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import { View } from 'rn-viviboom/hoc/Themed';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import NotificationReduxActions from 'rn-viviboom/redux/notification/NotificationReduxActions';

const StarterBadgePictureType = StarterBadgePicture as ImageRequireSource;

const notificationImageSize = { width: 512, suffix: 'png' };

export default function PresentNotificationScreen({ navigation }: RootStackScreenProps<'PresentNotificationScreen'>) {
  const lottieRef = useRef<LottieView>();

  const { t } = useTranslation();
  const notificationsUnpresented = useReduxStateSelector((state) => state?.notification?.unpresented);
  const [notifToPresent] = notificationsUnpresented;

  useEffect(() => {
    if (notifToPresent) lottieRef.current.play(0);
  }, [notifToPresent]);

  const onBackgroundPress = useCallback(async () => {
    await NotificationReduxActions.markSeen({ notificationIds: [notifToPresent?.id] });
    if (notificationsUnpresented?.length <= 1) {
      navigation.pop();
    }
  }, [navigation, notifToPresent, notificationsUnpresented]);

  let displayStr: string;
  if (notifToPresent?.badge && notifToPresent?.badge.name) {
    displayStr = t(notifToPresent?.badge?.isChallenge ? 'common.challengeCompleted' : 'common.badgeEarned', { name: notifToPresent?.badge.name });
  } else if (notifToPresent?.project && notifToPresent?.project.name) {
    displayStr = t('common.projectApproved', { name: notifToPresent?.project.name });
  } else if (notifToPresent?.type === NotificationTypeEnum.STARTER_CRITERIA) {
    displayStr = t('common.starterCriteriaCompletion');
  }

  // Strip html tags in case translation is copied over from web side
  if (displayStr) {
    const regex = /(<([^>]+)>)/gi;
    displayStr = displayStr.replace(regex, '');
  }

  return (
    <TouchableWithoutFeedback style={styles.container} onPress={onBackgroundPress}>
      <View style={styles.innerContainer}>
        <MyText style={styles.underLogoCaptionText}>{displayStr}</MyText>
        <MyImage
          uri={notifToPresent?.badge?.imageUri || notifToPresent?.project?.thumbnailUri}
          params={notificationImageSize}
          style={{ width: Math.min(Layout.screen.width / 2, 240), height: Math.min(Layout.screen.width / 2, 240), borderRadius: 18, resizeMode: 'contain' }}
          defaultSource={StarterBadgePictureType}
          imageFormat="png"
        />
        <LottieView ref={lottieRef} loop={false} style={styles.lottieAnimation} speed={2} source={Confetti} />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {},
  innerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  underLogoCaptionText: {
    marginBottom: 72,
    marginHorizontal: 18,
    color: '#000',
    fontSize: 28,
    textAlign: 'center',
  },
  lottieAnimation: {
    position: 'absolute',
    width: Layout.screen.width,
    height: Layout.screen.height,
  },
});
