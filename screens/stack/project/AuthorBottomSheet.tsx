import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageRequireSource, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import MyBottomSheetBackdrop from 'rn-viviboom/hoc/MyBottomSheetBackdrop';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { RootStackParamList } from 'rn-viviboom/navigation/types';

const DefaultProfilePictureTyped = DefaultProfilePicture as ImageRequireSource;
const DEFAULT_PROFILE_IMAGE_SIZE = 128;

interface AuthorBottomSheetProps {
  show: boolean;
  handleClose: () => void;
  project: Project;
}

export default function AuthorBottomSheet({ show, project, handleClose }: AuthorBottomSheetProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const colorScheme = useColorScheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // author bottom sheet
  const snapPoints = useMemo(() => ['50%'], []);
  const bottomSheetRef = useRef<BottomSheet>();

  useEffect(() => {
    if (show) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [show]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={MyBottomSheetBackdrop}
      backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: Colors[colorScheme].contentBackground }]}
      onClose={handleClose}
    >
      <View style={styles.contentTopRow}>
        <MyText style={{ fontSize: 16, padding: 6 }}>{t('Team of Creators')}</MyText>
      </View>
      <ScrollView style={styles.scroll}>
        {project?.authorUsers?.map((v) => (
          <TouchableOpacity
            key={`authorDetail_${v.id}`}
            style={styles.projectAuthor}
            onPress={() => {
              bottomSheetRef.current?.close();
              navigation.push('MemberScreen', { preloadedData: v });
            }}
          >
            <View style={styles.authorLeft}>
              <MyImage
                key={`project-author_${v?.id}`}
                uri={v?.profileImageUri}
                defaultSource={DefaultProfilePictureTyped}
                params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
                style={styles.profileImage}
              />
              <View style={styles.authorInfo}>
                <MyText style={styles.authorName}>{v?.name}</MyText>
                <MyText style={styles.authorRole}>{v?.role}</MyText>
              </View>
            </View>
            <View style={styles.authorStats}>
              <View style={styles.statsContainer}>
                <Ionicons name="ios-ribbon-outline" size={20} color={Colors[colorScheme].text} />
                <MyText style={styles.statsText}>{getCountDisplay(v?.badgeCount)}</MyText>
              </View>
              <View style={styles.statsContainer}>
                <MaterialCommunityIcons name="puzzle-outline" size={20} color={Colors[colorScheme].textSecondary} />
                <MyText style={styles.statsText}>{getCountDisplay(v?.challengeCount)}</MyText>
              </View>
              <View style={styles.statsContainer}>
                <Ionicons name="ios-reader-outline" size={20} color={Colors[colorScheme].text} />
                <MyText style={styles.statsText}>{getCountDisplay(v?.projectCount)}</MyText>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  projectAuthor: {
    width: '100%',
    height: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  authorInfo: {
    justifyContent: 'center',
    marginHorizontal: 14,
  },
  authorName: {
    fontSize: 20,
    fontWeight: '400',
  },
  authorStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsContainer: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: 3,
  },
  statsText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '400',
  },
  bottomSheetBackground: {
    borderRadius: 8,
  },
  contentTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginHorizontal: 12,
    marginBottom: 6,
  },
  scroll: {
    flex: 1,
    marginHorizontal: 12,
  },
  authorRole: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
    marginTop: 3,
  },
});

const getCountDisplay = (count?: number) => {
  if (count === 0) return '0';
  if (!count || count < 0) return '-';
  if (count > 99) return '99+';
  return count;
};
