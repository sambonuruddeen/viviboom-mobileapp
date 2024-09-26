import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageRequireSource, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { RootStackParamList } from 'rn-viviboom/navigation/types';

const DefaultProfilePictureTyped = DefaultProfilePicture as ImageRequireSource;
const DEFAULT_PROFILE_IMAGE_SIZE = 128;
const COMPACT_AUTHOR_ITEM_CUTOFF = Layout.screen.width > 600 ? Layout.screen.width / 200 : 2;

interface AuthorBannerProps {
  project: Project;
  onAuthorPressed: () => void;
}

function AuthorItem({ author, compact }: { author: User; compact?: boolean }) {
  const colorScheme = useColorScheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (compact) {
    return (
      <TouchableOpacity style={styles.authorCompactItem} activeOpacity={0.7} onPress={() => navigation.push('MemberScreen', { preloadedData: author })}>
        <MyImage
          key={`project-author_${author?.id}`}
          uri={author?.profileImageUri}
          defaultSource={DefaultProfilePictureTyped}
          params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
          style={styles.profileImage}
        />
        <MyText style={styles.authorCompactItemName} numberOfLines={1}>
          {author?.name}
        </MyText>
        <View
          style={[styles.authorCompactItemRole, { borderColor: Colors[colorScheme].textSecondary, backgroundColor: Colors[colorScheme].contentBackground }]}
        >
          <MyText style={{ ...styles.authorCompactItemText, color: Colors[colorScheme].textSecondary }}>{author?.role}</MyText>
        </View>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity style={styles.authorItem} activeOpacity={0.7} onPress={() => navigation.push('MemberScreen', { preloadedData: author })}>
      <MyImage
        key={`project-author_${author?.id}`}
        uri={author?.profileImageUri}
        defaultSource={DefaultProfilePictureTyped}
        params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
        style={styles.profileImage}
      />
      <View style={styles.authorItemInfo}>
        <MyText style={styles.authorItemName}>{author?.name}</MyText>
        <View style={[styles.authorItemRole, { borderColor: Colors[colorScheme].textSecondary }]}>
          <MyText style={{ ...styles.authorItemText, color: Colors[colorScheme].textSecondary }}>{author?.role}</MyText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function AuthorBanner({ project, onAuthorPressed }: AuthorBannerProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const colorScheme = useColorScheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // for single author
  const isSingleAuthor = project?.authorUsers && project?.authorUsers?.length < 2;
  const author = project?.authorUsers?.[0];

  const dateString = useMemo(() => {
    let res = '-';
    try {
      res = DateTime.fromJSDate(new Date(project?.createdAt)).toLocaleString(DateTime.DATE_MED);
    } catch (err) {
      console.warn(err);
    }
    return res;
  }, [project?.createdAt]);

  if (isSingleAuthor) {
    return (
      <TouchableOpacity style={styles.projectAuthor} onPress={() => navigation.push('MemberScreen', { preloadedData: author })}>
        <View style={styles.authorLeft}>
          <MyImage
            key={`project-author_${author?.id}`}
            uri={author?.profileImageUri}
            defaultSource={DefaultProfilePictureTyped}
            params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
            style={styles.profileImage}
          />
          <View style={styles.authorInfo}>
            <MyText style={styles.authorName}>{author?.name}</MyText>
            <MyText style={styles.authorText}>{dateString}</MyText>
          </View>
        </View>
        <View style={styles.authorStats}>
          <View style={styles.statsContainer}>
            <Ionicons name="ios-ribbon-outline" size={20} color={Colors[colorScheme].text} />
            <MyText style={styles.statsText}>{getCountDisplay(author?.badgeCount)}</MyText>
          </View>
          <View style={styles.statsContainer}>
            <MaterialCommunityIcons name="puzzle-outline" size={20} color={Colors[colorScheme].textSecondary} />
            <MyText style={styles.statsText}>{getCountDisplay(author?.challengeCount)}</MyText>
          </View>
          <View style={styles.statsContainer}>
            <Ionicons name="ios-reader-outline" size={20} color={Colors[colorScheme].text} />
            <MyText style={styles.statsText}>{getCountDisplay(author?.projectCount)}</MyText>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.collaboration}>
      <TouchableOpacity activeOpacity={0.8} style={styles.collaborationTop} onPress={onAuthorPressed}>
        <MyText>
          {t('Authors')} ({project?.authorUsers?.length || 0})
        </MyText>
        <Ionicons name="ios-chevron-forward" size={16} color="#aaa" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.authors} horizontal>
        {project?.authorUsers?.map((v) => (
          <AuthorItem key={`author-item_${v?.id}`} author={v} compact={project?.authorUsers?.length > COMPACT_AUTHOR_ITEM_CUTOFF} />
        ))}
      </ScrollView>
    </View>
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
  authorText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '400',
    marginTop: 2,
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
  collaboration: {
    width: '100%',
  },
  collaborationTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
  },
  authors: {
    flexGrow: 1,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  authorItem: {
    flexDirection: 'row',
    marginRight: 30,
  },
  authorItemInfo: {
    justifyContent: 'center',
    marginHorizontal: 14,
    alignItems: 'flex-start',
  },
  authorItemName: {
    fontSize: 16,
    fontWeight: '400',
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  authorItemRole: {
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: '#666',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorItemText: {
    fontSize: 12,
    fontWeight: '400',
    textAlignVertical: 'center',
    textAlign: 'center',
    marginHorizontal: Platform.OS === 'ios' ? 4 : 5,
    marginTop: Platform.OS === 'ios' ? 4 : 1,
    marginBottom: 2,
  },
  authorCompactItem: {
    marginRight: 30,
    alignItems: 'center',
    width: 80,
  },
  authorCompactItemName: {
    width: '100%',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '400',
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  authorCompactItemRole: {
    position: 'absolute',
    top: 0,
    left: '50%',
    borderWidth: 0.5,
    borderColor: '#666',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorCompactItemText: {
    fontSize: 12,
    fontWeight: '400',
    textAlignVertical: 'center',
    textAlign: 'center',
    marginHorizontal: Platform.OS === 'ios' ? 4 : 5,
    marginTop: Platform.OS === 'ios' ? 4 : 1,
    marginBottom: 2,
  },
});

const getCountDisplay = (count?: number) => {
  if (count === 0) return '0';
  if (!count || count < 0) return '-';
  if (count > 99) return '99+';
  return count;
};
