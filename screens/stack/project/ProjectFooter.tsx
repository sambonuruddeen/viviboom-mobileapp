import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import CommentApi from 'rn-viviboom/apis/viviboom/CommentApi';
import ProjectApi from 'rn-viviboom/apis/viviboom/ProjectApi';
import Colors from 'rn-viviboom/constants/Colors';
import Config from 'rn-viviboom/constants/Config';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

interface ProjectFooterProps {
  project: Project;
  onShowAddCommentView: () => void;
  onShowCommentBottomSheet: () => void;
}

export default function ProjectFooter({ project, onShowAddCommentView, onShowCommentBottomSheet }: ProjectFooterProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const account = useReduxStateSelector((state) => state.account);

  const [isUserLiked, setUserLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  const authorName = useMemo(() => {
    if (project?.authorUsers?.length < 2) {
      return `${project?.authorUsers?.[0]?.name || ''}`;
    }
    if (project?.authorUsers?.length === 2) {
      return t('authors', { name1: project?.authorUsers?.[0]?.name, name2: project?.authorUsers?.[1]?.name });
    }
    return t('authorOthers', { name: project?.authorUsers?.[0]?.name });
  }, [project?.authorUsers, t]);

  const fetchComments = useCallback(async () => {
    if (!project?.id) return;
    try {
      const res = await CommentApi.getList({
        authToken: account?.authToken,
        projectId: project?.id,
        offset: 0,
        limit: 1,
      });
      setCommentCount(res.data?.count);
    } catch (err) {
      console.error(err);
    }
  }, [account?.authToken, project?.id]);

  const onLike = useCallback(async () => {
    try {
      const res = await ProjectApi.like({
        authToken: account?.authToken,
        projectId: project?.id,
        isLike: !isUserLiked,
      });
      setUserLiked(res.data?.isLike);
      setLikeCount((count) => count + (res.data?.isLike ? 1 : -1));
    } catch (err) {
      console.error(err);
    }
  }, [account, isUserLiked, project?.id]);

  const onComment = useCallback(() => {
    if (commentCount > 0) onShowCommentBottomSheet();
    else onShowAddCommentView();
  }, [commentCount, onShowAddCommentView, onShowCommentBottomSheet]);

  const onShare = useCallback(async () => {
    try {
      const projectUrl = `${Config.MobileAppUrl}/project/${project?.id}`;
      const message = `Check out ${project.name} by ${authorName} on VIVIBOOM`;
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
  }, [project]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    setLikeCount(project?.likes?.length || 0);
    setUserLiked(!!project?.likes?.find((l) => l.userId === account?.id));
  }, [account?.id, project]);

  return (
    <View
      style={{
        ...styles.container,
        backgroundColor: Colors[colorScheme].contentBackground,
        paddingBottom: insets.bottom,
        height: styles.container.height + insets.bottom,
      }}
    >
      <View style={styles.button}>
        <TouchableOpacity onPress={onLike} style={styles.buttonInner}>
          <Ionicons name={isUserLiked ? 'ios-heart' : 'ios-heart-outline'} size={26} color="rgb(248,48,95)" />
          <MyText style={{ color: 'rgb(248,48,95)', marginLeft: 8, fontSize: 15, fontWeight: '400' }}>{likeCount || 'Like'}</MyText>
        </TouchableOpacity>
      </View>
      <View style={styles.button}>
        <TouchableOpacity onPress={onComment} style={styles.buttonInner}>
          <Ionicons name="ios-chatbubble-outline" size={22} color={Colors[colorScheme].text} />
          <MyText style={{ marginLeft: 8, fontSize: 15, fontWeight: '400' }}>{commentCount || 'Comment'}</MyText>
        </TouchableOpacity>
      </View>
      <View style={styles.button}>
        <TouchableOpacity onPress={onShare} style={styles.buttonInner}>
          <Ionicons name="ios-share-social-outline" size={22} color={Colors[colorScheme].text} />
          <MyText style={{ marginLeft: 8, fontSize: 15, fontWeight: '400' }}>Share</MyText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(160, 160, 160, 0.2)',
  },
  button: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
