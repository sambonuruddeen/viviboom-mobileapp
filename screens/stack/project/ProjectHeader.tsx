import { useActionSheet } from '@expo/react-native-action-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, ImageRequireSource, Platform, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import ProjectApi from 'rn-viviboom/apis/viviboom/ProjectApi';
import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import Config from 'rn-viviboom/constants/Config';
import { ContentReportType } from 'rn-viviboom/enums/ContentReportType';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

const headerHeight = 40;
const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

const DefaultProfilePictureTyped = DefaultProfilePicture as ImageRequireSource;
const DEFAULT_PROFILE_IMAGE_SIZE = 128;

interface ProjectHeaderProps {
  project: Project;
  onBackPressed: () => void;
  onAuthorPressed: () => void;
  animatedOffset: Animated.Value;
  carouselHeight: number;
  authorOffset: number;
}

export default function ProjectHeader({ project, onBackPressed, onAuthorPressed, animatedOffset, carouselHeight, authorOffset }: ProjectHeaderProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { showActionSheetWithOptions } = useActionSheet();
  const navigation = useNavigation();
  const user = useReduxStateSelector((state) => state.account);

  const [showAuthor, setShowAuthor] = useState(false);

  const authorName = useMemo(() => {
    if (project?.authorUsers?.length < 2) {
      return `${project?.authorUsers?.[0]?.name || ''}`;
    }
    if (project?.authorUsers?.length === 2) {
      return t('authors', { name1: project?.authorUsers?.[0]?.name, name2: project?.authorUsers?.[1]?.name });
    }
    return t('authorOthers', { name: project?.authorUsers?.[0]?.name });
  }, [project?.authorUsers, t]);

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
            const projectUrl = `${Config.MobileAppUrl}/project/${project?.id}`;
            const message = `Check out ${project?.name} by ${authorName} on VIVIBOOM`;
            const result = await Share.share({
              message: Platform.OS === 'ios' ? message : projectUrl,
              url: projectUrl,
              title: message,
            });
            if (result.action === Share.sharedAction) {
              Toast.show({ text1: 'Yay! Project shared successfully', type: 'success' });
            }
          } catch (error) {
            Toast.show({ text1: error?.message, type: 'error' });
          }
        } else if (buttonIndex === 1) {
          // report
          navigation.navigate('ReportModalScreen', { relevantId: project?.id, relevantType: ContentReportType.PROJECT });
        }
      },
    );
  };

  const onDelete = () => {
    Alert.alert('Delete Project', t('deleteProject'), [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      { text: 'OK', onPress: deleteProject, style: 'destructive' },
    ]);
  };

  const onEdit = () => {
    navigation.navigate('MediaCarouselScreen', { preloadedData: project });
  };

  const deleteProject = async () => {
    try {
      await ProjectApi.deleteProject({ authToken: user?.authToken, projectId: project?.id });
      Toast.show({ text1: t('Project Deleted!') });
      navigation.pop();
    } catch (err) {
      Toast.show({ text1: err?.response?.data?.message, type: 'error' });
    }
  };

  const heightUpperLimit = useMemo(() => Math.max(carouselHeight - insets.top - headerHeight, 0), [carouselHeight, insets.top]);

  useEffect(() => {
    animatedOffset.addListener(({ value }) => {
      if (value > authorOffset) setShowAuthor(true);
      else setShowAuthor(false);
      return () => {
        animatedOffset.removeAllListeners();
      };
    });
  }, [animatedOffset, authorOffset]);

  return (
    <>
      <LinearGradient
        style={{ ...styles.gradient, height: styles.gradient.height + insets.top }}
        colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.1)', 'transparent']}
        locations={[0, 0.5, 1]}
      />
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
        <TouchableOpacity style={[styles.projectAuthor, { display: showAuthor ? undefined : 'none' }]} onPress={onAuthorPressed}>
          <View style={styles.authorLeft}>
            <View style={styles.avatarContainer}>
              {project?.authorUsers?.length < 2 ? (
                <MyImage
                  key={`project-header-author_${project?.authorUsers?.[0]?.id}`}
                  uri={project?.authorUsers?.[0]?.profileImageUri}
                  defaultSource={DefaultProfilePictureTyped}
                  params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
                  style={styles.profileImage}
                />
              ) : (
                <>
                  <MyImage
                    style={[styles.secondAvatar, { borderColor: Colors[colorScheme].background }]}
                    uri={project?.authorUsers?.[1]?.profileImageUri}
                    defaultSource={DefaultProfilePictureTyped}
                    params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
                  />
                  <MyImage
                    style={[styles.firstAvatar, { borderColor: Colors[colorScheme].background }]}
                    uri={project?.authorUsers?.[0]?.profileImageUri}
                    defaultSource={DefaultProfilePictureTyped}
                    params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
                  />
                </>
              )}
            </View>
            <View style={styles.authorInfo}>
              <TouchableOpacity onPress={() => navigation.push('MemberScreen', { preloadedData: project?.authorUsers?.[0] })} activeOpacity={0.8}>
                <MyText style={styles.nameText}>{project?.authorUsers?.[0]?.name}</MyText>
              </TouchableOpacity>
              {project?.authorUsers?.length > 1 && (
                <>
                  <MyText style={styles.text}>and</MyText>
                  <TouchableOpacity
                    onPress={() => {
                      if (project?.authorUsers?.length === 2) navigation.push('MemberScreen', { preloadedData: project?.authorUsers?.[1] });
                      else onAuthorPressed();
                    }}
                    activeOpacity={0.8}
                  >
                    <MyText style={styles.nameText}>{project?.authorUsers?.length > 2 ? 'others' : project?.authorUsers?.[1]?.name}</MyText>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.rightButton}>
          {!!project?.authorUsers?.find((au) => au.id === user.id) && (
            <>
              <TouchableOpacity style={styles.authorButton} onPress={onDelete}>
                <AnimatedIcon
                  name="ios-trash-outline"
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
              <TouchableOpacity style={styles.authorButton} onPress={onEdit}>
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
            </>
          )}
          <TouchableOpacity style={styles.authorButton} onPress={onClickMore}>
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
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: headerHeight * 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
  authorButton: {
    marginRight: 18,
  },
  projectAuthor: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: { width: 32, height: 32 },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 18,
  },
  firstAvatar: {
    position: 'absolute',
    width: 23,
    height: 23,
    borderRadius: 25,
    backgroundColor: '#000',
    left: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: '#fff',
  },
  secondAvatar: {
    position: 'absolute',
    width: 23,
    height: 23,
    borderRadius: 25,
    backgroundColor: '#000',
    top: 0,
    right: 0,
    borderWidth: 1,
    borderColor: '#fff',
  },
  authorInfo: {
    justifyContent: 'center',
    marginHorizontal: 10,
    flexDirection: 'row',
  },
  text: { marginRight: 4, fontSize: 15, fontWeight: '400' },
  nameText: { marginRight: 4, fontSize: 15 },
});
