import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import defaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

import MyImage from './MyImage';
import MyText from './MyText';

const DEFAULT_PROFILE_IMAGE_SIZE = 128;

interface IProps {
  id?: number;
  preloadedData: User;
}

type Nav = {
  navigate: (value: string, object: { userId: number }) => void;
};

export default function RecipientListItem({ id, preloadedData }: IProps) {
  const navigation = useNavigation<Nav>();
  const colorScheme = useColorScheme();
  const [walletOwner, setWalletOwner] = useState<User>(preloadedData);

  return (
    <TouchableOpacity
      key={id}
      style={{ ...styles.walletOwnerContainer, backgroundColor: Colors[colorScheme].background }}
      onPress={() => {
        navigation.navigate('TransactionScreen', { userId: walletOwner.id });
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ ...styles.avatarContainer, backgroundColor: Colors[colorScheme].background }}>
          <MyImage
            style={styles.avatar}
            uri={walletOwner.profileImageUri}
            params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
            defaultSource={defaultProfilePicture}
          />
        </View>
        <View style={{ flexDirection: 'column', marginLeft: 12 }}>
          <MyText style={styles.walletOwnerUsername}>{walletOwner.username}</MyText>
          <MyText style={styles.walletOwnerName}>{walletOwner.name}</MyText>
        </View>
      </View>
      <Ionicons name="ios-chevron-forward" size={18} color={Colors[colorScheme].textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  walletOwnerContainer: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 8,
    borderRadius: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  walletOwnerUsername: {
    fontSize: 18,
  },
  walletOwnerName: {
    fontSize: 12,
    fontWeight: '400',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 46,
  },
});
