import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ImageRequireSource, StyleSheet, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import BuilderPalApi from 'rn-viviboom/apis/viviboom/BuilderPalApi';
import DefaultAdvancedPicture from 'rn-viviboom/assets/images/chat-project-advanced.png';
import DefaultBeginnerPicture from 'rn-viviboom/assets/images/chat-project-beginner.png';
import DefaultIntermediatePicture from 'rn-viviboom/assets/images/chat-project-intermediate.png';
import Clock from 'rn-viviboom/assets/images/icon-clock.png';
import StarOutline from 'rn-viviboom/assets/images/icon-star-outline.png';
import Star from 'rn-viviboom/assets/images/icon-star.png';
import Colors from 'rn-viviboom/constants/Colors';
import MyText from 'rn-viviboom/hoc/MyText';
import MyTooltip from 'rn-viviboom/hoc/MyTooltip';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { BuilderPalStackParamList } from 'rn-viviboom/navigation/types';
import { calculateDayHourMinutes } from 'rn-viviboom/utils/TimeUtil';

const DefaultAdvancedPictureTyped = DefaultAdvancedPicture as ImageRequireSource;
const DefaultBeginnerPictureTyped = DefaultBeginnerPicture as ImageRequireSource;
const DefaultIntermediatePictureTyped = DefaultIntermediatePicture as ImageRequireSource;

const difficultyLevels = {
  BEGINNER: {
    stars: [Star, StarOutline, StarOutline],
    label: 'Beginner',
    defaultBackgroundImage: DefaultBeginnerPictureTyped,
  },
  INTERMEDIATE: {
    stars: [Star, Star, StarOutline],
    label: 'Intermediate',
    defaultBackgroundImage: DefaultIntermediatePictureTyped,
  },
  ADVANCED: {
    stars: [Star, Star, Star],
    label: 'Advanced',
    defaultBackgroundImage: DefaultAdvancedPictureTyped,
  },
};

interface IProps {
  project: ChatProject;
  showTutorial?: boolean;
  showNextTutorial?: () => void;
  hideSaveButton?: boolean;
}

const BuilderPalProjectItem = memo(({ project, showTutorial, showNextTutorial, hideSaveButton }: IProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'challenges' });
  const colorScheme = useColorScheme();
  const navigation = useNavigation<NativeStackNavigationProp<BuilderPalStackParamList, 'BuilderPalChatScreen'>>();
  const account = useReduxStateSelector((s) => s?.account);
  const [isUserSaved, setUserSaved] = useState(project?.isSaved);

  const saveToggle = async () => {
    try {
      await BuilderPalApi.patchProject({
        authToken: account.authToken,
        chatId: project.chatId,
        projectId: project?.id,
        isSaved: !isUserSaved,
      });
      if (!isUserSaved) Toast.show({ text1: 'Project Added to Favorites!', type: 'success' });
      setUserSaved((b) => !b);
    } catch (err) {
      console.error(err);
    }
  };

  const timeToComplete = useMemo(() => {
    const { day, hour, minute } = calculateDayHourMinutes(project?.timeToComplete || 0);
    return [day > 0 ? t('d', { count: day }) : null, hour > 0 ? t('hr', { count: hour }) : null, minute > 0 ? t('min', { count: minute }) : null]
      .filter(Boolean)
      .join(' ');
  }, [project?.timeToComplete, t]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('BuilderPalProjectScreen', { chatId: project?.chatId, chatProjectId: project?.id })}
      activeOpacity={1}
    >
      <View style={styles.projectImage}>
        <Image style={styles.projectImage} source={difficultyLevels[project?.difficulty]?.defaultBackgroundImage} />
      </View>
      <View style={styles.projectDetails}>
        <MyText style={styles.name}>{project?.title}</MyText>
        <MyText style={styles.desc} numberOfLines={3}>
          {project?.description}
        </MyText>
      </View>
      <View style={styles.projectInfo}>
        {!!project.difficulty && (
          <View style={{ flexDirection: 'row' }}>
            {difficultyLevels[project.difficulty].stars.map((star, index) => (
              <Image key={`star-${index}`} style={[styles.logo]} source={star} />
            ))}
          </View>
        )}

        {project?.timeToComplete && (
          <View style={styles.timeContainer}>
            {project?.timeToComplete && (
              <>
                <Image style={styles.logo} source={Clock} />
                <MyText style={{ ...styles.descriptionText, color: Colors[colorScheme].text }}>{timeToComplete}</MyText>
              </>
            )}
          </View>
        )}
      </View>
      {!hideSaveButton && (
        <TouchableOpacity style={styles.likeButton} onPress={saveToggle}>
          <MyTooltip isVisible={showTutorial} text="Save the Project as Favorite" placement="bottom" onClose={showNextTutorial}>
            <Ionicons name={isUserSaved ? 'ios-heart' : 'ios-heart-outline'} size={24} color="rgb(248,48,95)" />
          </MyTooltip>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
});

export default BuilderPalProjectItem;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  projectImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  projectDetails: {
    paddingHorizontal: 18,
    marginTop: 18,
  },
  name: {
    marginBottom: 18,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
  },
  desc: {
    marginBottom: 18,
    color: '#666',
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 22,
  },
  timeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  logo: {
    width: 18,
    height: 18,
  },
  descriptionText: {
    fontWeight: '400',
    fontSize: 15,
    marginLeft: 6,
  },
  projectInfo: {
    paddingHorizontal: 18,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    height: 56,
  },
  likeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
  },
});
