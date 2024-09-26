import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import BuilderPalApi from 'rn-viviboom/apis/viviboom/BuilderPalApi';
import BuilderPalImage from 'rn-viviboom/assets/images/minichatavatar.png';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import { BuilderPalChatType } from 'rn-viviboom/enums/BuilderPalChatType';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { BuilderPalStackScreenProps } from 'rn-viviboom/navigation/types';

import ChatInterface from './ChatInterface';

export default function BuilderPalChatScreen({ navigation, route }: BuilderPalStackScreenProps<'BuilderPalChatScreen'>) {
  const { t } = useTranslation('translation');
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const user = useReduxStateSelector((state) => state.account);

  const [chat, setChat] = useState<Chat>();

  const [showModal, setShowModal] = useState(false);

  const loadChat = useCallback(async () => {
    try {
      let chatId = route.params?.chatId;
      if (!chatId) {
        const res = await BuilderPalApi.post({ authToken: user.authToken, type: BuilderPalChatType.DISCOVERY });
        chatId = res?.data?.chatId;
        setShowModal(true);
      }
      const chatResults = await BuilderPalApi.get({ authToken: user.authToken, chatId });
      setChat(chatResults.data.chat);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      Toast.show({ type: 'error', text1: err.response?.data?.message || err.message });
    }
  }, [route.params?.chatId, user.authToken]);

  const loadNewChat = useCallback(async () => {
    try {
      const res = await BuilderPalApi.post({ authToken: user.authToken, type: BuilderPalChatType.DISCOVERY });
      const chatResults = await BuilderPalApi.get({ authToken: user.authToken, chatId: res?.data?.chatId });
      setChat(chatResults.data.chat);
      setShowModal(true);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      Toast.show({ type: 'error', text1: err.response?.data?.message || err.message });
    }
  }, [user.authToken]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].background, paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { backgroundColor: Colors[colorScheme].contentBackground, paddingTop: insets.top, height: insets.top + 60 }]}>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.settingBtn} onPress={() => navigation.pop()}>
            <Ionicons name="ios-chevron-back-outline" size={28} color={Colors[colorScheme].text} />
          </TouchableOpacity>
          <View style={styles.status}>
            <View style={styles.statusAvatar}>
              <View style={styles.onlineDot} />
              <MyImage style={styles.avatarImage} defaultSource={BuilderPalImage} />
            </View>
            <View style={styles.statusRight}>
              <MyText style={styles.statusTitle}>{t('BuilderPal')}</MyText>
              <View style={styles.onlineContainer}>
                <MyText style={styles.onlineText}>{t('Online')}</MyText>
              </View>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.topButton} onPress={loadNewChat}>
            <Ionicons name="ios-refresh-outline" size={24} color={Colors[colorScheme].text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topButton} onPress={() => setShowModal(true)}>
            <Ionicons name="ios-bulb-outline" size={24} color={Colors[colorScheme].text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topButton} onPress={() => navigation.navigate('BuilderPalHomeScreen')}>
            <Ionicons name="ios-home-outline" size={24} color={Colors[colorScheme].text} />
          </TouchableOpacity>
        </View>
      </View>
      <ChatInterface chatId={chat?.id} showModal={showModal} handleModalClose={() => setShowModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowRadius: 0.5,
    elevation: 2,
  },
  settingBtn: {
    marginHorizontal: 8,
    marginTop: 6,
  },
  topButton: {
    marginRight: 24,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  statusAvatar: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  onlineDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: 'rgb(29, 243, 119)',
    left: -4,
    borderRadius: 3,
  },
  avatarImage: {
    width: 32,
    height: 32,
  },
  statusTitle: {
    fontSize: 16,
  },
  onlineContainer: {
    backgroundColor: 'rgb(29, 243, 119)',
    height: 18,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginTop: 3,
    justifyContent: 'center',
    alignItem: 'center',
    paddingTop: Platform.OS === 'ios' ? 2 : 0,
  },
  onlineText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusRight: {
    alignItems: 'flex-start',
  },
  animContainer: {
    alignItems: 'center',
    width: Layout.screen.width,
    height: Layout.screen.width,
    padding: 36,
    position: 'relative',
    left: -8,
  },
});
