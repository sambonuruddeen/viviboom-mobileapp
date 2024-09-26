import { Ionicons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import Colors from 'rn-viviboom/constants/Colors';
import { EventType } from 'rn-viviboom/enums/EventType';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackParamList, RootTabParamList } from 'rn-viviboom/navigation/types';
import NotificationReduxActions from 'rn-viviboom/redux/notification/NotificationReduxActions';
import WalletReduxActions from 'rn-viviboom/redux/wallet/WalletReduxActions';
import { useChatContext } from 'rn-viviboom/screens/stack/chat/context/ChatContext';

import UserProfileTopBanner, { userProfileTopBannerHeight } from './UserProfileTopBanner';

interface UserProfileProps {
  user: User;
  navigation: CompositeNavigationProp<BottomTabNavigationProp<RootTabParamList, 'ProfileTabScreen'>, NativeStackNavigationProp<RootStackParamList>>;
}

export default function UserProfile({ user, navigation }: UserProfileProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isFocused = useIsFocused();
  const notificationsAll = useReduxStateSelector((state) => state?.notification?.all);
  const loggedInUser = useReduxStateSelector((state) => state.account);
  const isRootEnv = loggedInUser.institutionId === 1;
  const wallet = useReduxStateSelector((state) => state.wallet?.[user?.id]?.wallet);
  const isRewardEnabled = !!loggedInUser?.branch?.allowVivicoinRewards && !!loggedInUser?.institution?.isRewardEnabled;
  const { chatClient } = useChatContext();

  const branchId = loggedInUser.branch.id;

  const unseenNotificationCount = useMemo(() => {
    if (isRootEnv) return 0;
    let count = 0;
    // eslint-disable-next-line no-plusplus
    notificationsAll?.forEach((elem) => !elem.seen && count++);
    return Math.min(count, 99);
  }, [isRootEnv, notificationsAll]);

  useEffect(() => {
    if (isFocused) {
      NotificationReduxActions.fetch();
      WalletReduxActions.fetch();
    }
  }, [isFocused]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingTop: userProfileTopBannerHeight + 18 }} showsVerticalScrollIndicator={false}>
        <MyText style={styles.panelTitle}>{t(isRootEnv ? 'VIVINAUT Control Panel' : 'VIVIBOOM Control Panel')}</MyText>
        <View style={{ ...styles.pannelContainer, backgroundColor: Colors[colorScheme].background }}>
          <View style={styles.memberInfo}>
            <TouchableOpacity style={styles.memberStat} onPress={() => navigation.navigate('MemberScreen', { preloadedData: user, tab: 1 })}>
              <MyText style={{ ...styles.memberStatText, color: Colors[colorScheme].text }}>{user?.badgeCount || 0}</MyText>
              <MyText style={{ ...styles.memberStatTitle, color: Colors[colorScheme].textSecondary }}>Badges</MyText>
            </TouchableOpacity>
            <View style={styles.verticalDivider} />
            <TouchableOpacity style={styles.memberStat} onPress={() => navigation.navigate('MemberScreen', { preloadedData: user, tab: 1 })}>
              <MyText style={{ ...styles.memberStatText, color: Colors[colorScheme].text }}>{user?.challengeCount || 0}</MyText>
              <MyText style={{ ...styles.memberStatTitle, color: Colors[colorScheme].textSecondary }}>Challenges</MyText>
            </TouchableOpacity>
            <View style={styles.verticalDivider} />
            <TouchableOpacity style={styles.memberStat} onPress={() => navigation.navigate('MemberScreen', { preloadedData: user, tab: 3 })}>
              <MyText style={{ ...styles.memberStatText, color: Colors[colorScheme].text }}>{user?.projectCount || 0}</MyText>
              <MyText style={{ ...styles.memberStatTitle, color: Colors[colorScheme].textSecondary }}>Projects</MyText>
            </TouchableOpacity>
            {isRewardEnabled && (
              <>
                <View style={styles.verticalDivider} />
                <TouchableOpacity style={styles.memberStat} onPress={() => navigation.navigate('EWalletScreen')}>
                  <MyText style={{ ...styles.memberStatText, color: Colors[colorScheme].text }}>{wallet?.balance || 0}</MyText>
                  <MyText style={{ ...styles.memberStatTitle, color: Colors[colorScheme].textSecondary }}>Vivicoins</MyText>
                </TouchableOpacity>
              </>
            )}
          </View>
          <View style={styles.panelItems}>
            {isRewardEnabled && (
              <View style={styles.panelItemContainer}>
                <TouchableWithoutFeedback onPress={() => navigation.navigate('EWalletScreen')}>
                  <View style={[styles.panelItem, { backgroundColor: Colors[colorScheme].tintShadow }]}>
                    <Ionicons name="ios-card-outline" size={28} color={Colors[colorScheme].tint} />
                  </View>
                </TouchableWithoutFeedback>
                <MyText style={styles.panelItemText}>{t('My Wallet')}</MyText>
              </View>
            )}
            {loggedInUser?.institution?.isVaultEnabled && (
              <View style={styles.panelItemContainer}>
                <TouchableWithoutFeedback onPress={() => navigation.navigate('GameListScreen')}>
                  <View style={[styles.panelItem, { backgroundColor: Colors[colorScheme].tintShadow }]}>
                    <Ionicons name="ios-game-controller-outline" size={28} color={Colors[colorScheme].tint} />
                  </View>
                </TouchableWithoutFeedback>
                <MyText style={styles.panelItemText}>{t('Vivivault')}</MyText>
              </View>
            )}
            {isRootEnv ? (
              <View style={styles.panelItemContainer}>
                <TouchableWithoutFeedback onPress={() => navigation.navigate('StarterCriteriaScreen')}>
                  <View style={[styles.panelItem, { backgroundColor: Colors[colorScheme].tintShadow }]}>
                    <Ionicons name="ios-rocket-outline" size={28} color={Colors[colorScheme].tint} />
                  </View>
                </TouchableWithoutFeedback>
                <MyText style={styles.panelItemText}>{t('My Status')}</MyText>
              </View>
            ) : (
              <View style={styles.panelItemContainer}>
                <TouchableWithoutFeedback onPress={() => navigation.navigate('NotificationListScreen')}>
                  <View style={[styles.panelItem, { backgroundColor: Colors[colorScheme].tintShadow }]}>
                    <Ionicons name="ios-notifications-outline" size={28} color={Colors[colorScheme].tint} />
                    {unseenNotificationCount > 0 && (
                      <View style={[styles.notificationCount, { backgroundColor: Colors[colorScheme].error }]}>
                        <MyText style={styles.notificationCountText}>{unseenNotificationCount}</MyText>
                      </View>
                    )}
                  </View>
                </TouchableWithoutFeedback>
                <MyText style={styles.panelItemText}>{t('Notifications')}</MyText>
              </View>
            )}
            <View style={styles.panelItemContainer}>
              <TouchableWithoutFeedback
                style={[styles.panelItem, { backgroundColor: Colors[colorScheme].tintShadow }]}
                onPress={() => navigation.navigate('MyBookingScreen')}
              >
                <View style={[styles.panelItem, { backgroundColor: Colors[colorScheme].tintShadow }]}>
                  <Ionicons name="ios-book-outline" size={26} color={Colors[colorScheme].tint} />
                </View>
              </TouchableWithoutFeedback>
              <MyText style={styles.panelItemText}>{t('My Bookings')}</MyText>
            </View>
          </View>
        </View>
        <MyText style={styles.panelTitle}>Quick Access</MyText>
        <View style={{ ...styles.otherList, backgroundColor: Colors[colorScheme].background }}>
          <TouchableOpacity
            style={{ ...styles.othersCardContainer, backgroundColor: Colors[colorScheme].background }}
            onPress={() => navigation.navigate('MemberScreen', { preloadedData: user })}
          >
            <Ionicons name="ios-person-outline" size={18} color={Colors[colorScheme].text} />
            <MyText style={styles.othersCardText}>{t('My profile')}</MyText>
            <Ionicons style={styles.forwardArrow} name="ios-chevron-forward-outline" size={18} color={Colors[colorScheme].textSecondary} />
          </TouchableOpacity>
          {user?.staffRoles?.length > 0 && (
            <TouchableOpacity
              style={{ ...styles.othersCardContainer, backgroundColor: Colors[colorScheme].background }}
              onPress={() => Linking.openURL('https://admin.viviboom.co')}
            >
              <Ionicons name="ios-terminal-outline" size={18} color={Colors[colorScheme].text} />
              <MyText style={styles.othersCardText}>{t('Access Admin Panel')}</MyText>
              <Ionicons style={styles.forwardArrow} name="ios-chevron-forward-outline" size={18} color={Colors[colorScheme].textSecondary} />
            </TouchableOpacity>
          )}
          {isRewardEnabled && !!wallet?.id && (
            <>
              <TouchableOpacity
                style={{ ...styles.othersCardContainer, backgroundColor: Colors[colorScheme].background }}
                onPress={() => navigation.navigate('RewardScreen')}
              >
                <Ionicons name="ios-gift-outline" size={18} color={Colors[colorScheme].text} />
                <MyText style={styles.othersCardText}>{t('Claim reward')}</MyText>
                <Ionicons style={styles.forwardArrow} name="ios-chevron-forward-outline" size={18} color={Colors[colorScheme].textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ ...styles.othersCardContainer, backgroundColor: Colors[colorScheme].background }}
                onPress={() => navigation.navigate('RecipientListScreen')}
              >
                <Ionicons name="ios-wallet-outline" size={18} color={Colors[colorScheme].text} />
                <MyText style={styles.othersCardText}>{t('Make transfer')}</MyText>
                <Ionicons style={styles.forwardArrow} name="ios-chevron-forward-outline" size={18} color={Colors[colorScheme].textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ ...styles.othersCardContainer, backgroundColor: Colors[colorScheme].background }}
                onPress={() => navigation.navigate('MyQRScreen')}
              >
                <Ionicons name="ios-qr-code-outline" size={18} color={Colors[colorScheme].text} />
                <MyText style={styles.othersCardText}>{t('My QR')}</MyText>
                <Ionicons style={styles.forwardArrow} name="ios-chevron-forward-outline" size={18} color={Colors[colorScheme].textSecondary} />
              </TouchableOpacity>
            </>
          )}
          {loggedInUser?.institution?.isVaultEnabled && (
            <TouchableOpacity
              style={{ ...styles.othersCardContainer, backgroundColor: Colors[colorScheme].background }}
              onPress={() => navigation.navigate('BLEScreen')}
            >
              <Ionicons name="ios-cube-outline" size={18} color={Colors[colorScheme].text} />
              <MyText style={styles.othersCardText}>{t('Unlock Vivivault')}</MyText>
              <Ionicons style={styles.forwardArrow} name="ios-chevron-forward-outline" size={18} color={Colors[colorScheme].textSecondary} />
            </TouchableOpacity>
          )}
          {loggedInUser?.institution?.isBuilderPalEnabled && (
            <TouchableOpacity
              style={{ ...styles.othersCardContainer, backgroundColor: Colors[colorScheme].background }}
              onPress={() => navigation.navigate('BuilderPalRoot', { screen: 'BuilderPalChatScreen', initial: false })}
            >
              <Ionicons name="ios-rocket-outline" size={18} color={Colors[colorScheme].text} />
              <MyText style={styles.othersCardText}>{t('Chat with BuilderPal')}</MyText>
              <Ionicons style={styles.forwardArrow} name="ios-chevron-forward-outline" size={18} color={Colors[colorScheme].textSecondary} />
            </TouchableOpacity>
          )}
          {!!chatClient && (
            <TouchableOpacity
              style={{ ...styles.othersCardContainer, backgroundColor: Colors[colorScheme].background }}
              onPress={() => navigation.navigate('Chat', { screen: 'NewDirectMessagingScreen', initial: false })}
            >
              <Ionicons name="ios-chatbubbles-outline" size={18} color={Colors[colorScheme].text} />
              <MyText style={styles.othersCardText}>{t('Talk to mentor')}</MyText>
              <Ionicons style={styles.forwardArrow} name="ios-chevron-forward-outline" size={18} color={Colors[colorScheme].textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={{ ...styles.othersCardContainer, backgroundColor: Colors[colorScheme].background }}
            onPress={() => navigation.navigate('EventListScreen', { type: EventType.WORKSHOP, branchId })}
          >
            <Ionicons name="ios-today-outline" size={18} color={Colors[colorScheme].text} />
            <MyText style={styles.othersCardText}>{t('Explore workshops')}</MyText>
            <Ionicons style={styles.forwardArrow} name="ios-chevron-forward-outline" size={18} color={Colors[colorScheme].textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ ...styles.othersCardContainer, backgroundColor: Colors[colorScheme].background }}
            onPress={() => navigation.navigate('NotificationListScreen')}
          >
            <Ionicons name="ios-notifications-outline" size={18} color={Colors[colorScheme].text} />
            <MyText style={styles.othersCardText}>{t('My Notifications')}</MyText>
            <Ionicons style={styles.forwardArrow} name="ios-chevron-forward-outline" size={18} color={Colors[colorScheme].textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ ...styles.othersCardContainer, backgroundColor: Colors[colorScheme].background }}
            onPress={() => navigation.navigate('SettingScreen')}
          >
            <Ionicons name="ios-settings-outline" size={18} color={Colors[colorScheme].text} />
            <MyText style={styles.othersCardText}>{t('Settings')}</MyText>
            <Ionicons style={styles.forwardArrow} name="ios-chevron-forward-outline" size={18} color={Colors[colorScheme].textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
      <View style={styles.profileBannerContainer}>
        <UserProfileTopBanner user={user} isEdit={false} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  profileBannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  panelTitle: {
    marginHorizontal: 12,
    marginVertical: 16,
    fontSize: 16,
  },
  pannelContainer: {
    width: '100%',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 8,
  },
  panelItems: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    marginVertical: 18,
    justifyContent: 'space-between',
    alignContent: 'center',
  },
  panelItemContainer: {
    alignItems: 'center',
    flex: 1,
  },
  panelItem: {
    width: 50,
    height: 50,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelItemText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '400',
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    marginVertical: 18,
  },
  memberStat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  memberStatText: {
    fontSize: 18,
  },
  memberStatTitle: {
    marginTop: 4,
    fontWeight: '400',
    fontSize: 13,
  },
  verticalDivider: {
    height: '50%',
    borderColor: '#ccc',
    borderRightWidth: 1.5,
  },
  otherList: {
    width: '100%',
    paddingHorizontal: 18,
  },
  othersCardContainer: {
    height: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  othersCardText: {
    marginLeft: 18,
    fontWeight: '400',
  },
  forwardArrow: {
    position: 'absolute',
    right: 0,
  },
  notificationCount: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 7,
    paddingHorizontal: 4,
    paddingVertical: Platform.OS === 'ios' ? 2 : 0,
  },
  notificationCountText: {
    color: '#fff',
    fontSize: 11,
    position: 'relative',
    top: Platform.OS === 'ios' ? 0.5 : -0.7,
  },
});
