import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CommentApi from 'rn-viviboom/apis/viviboom/CommentApi';
import Colors from 'rn-viviboom/constants/Colors';
import { CommentOrderType } from 'rn-viviboom/enums/CommentOrderType';
import CommentListItem from 'rn-viviboom/hoc/CommentListItem';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackParamList } from 'rn-viviboom/navigation/types';

import AddCommentView from './AddCommentView';

const DEFAULT_LIMIT = 9;

interface CommentBottomSheetProps {
  show: boolean;
  handleClose: () => void;
  projectId: number;
  reloadData?: () => void;
}

export default function CommentBottomSheet({ show, handleClose, projectId, reloadData }: CommentBottomSheetProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const user = useReduxStateSelector((state) => state?.account);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'ProjectScreen', undefined>>();
  const isFocus = useIsFocused();

  const snapPoints = useMemo(() => ['75%'], []);
  const bottomSheetRef = useRef<BottomSheet>();

  // control add comment view mounted
  const [showAddCommentView, setShowAddCommentView] = useState(show);
  // control add comment view focus
  const [focusAddCommentView, setFocusAddCommentView] = useState(show);
  const [replyToComment, setReplyToComment] = useState<ProjectComment>(null);

  // flat list states
  const [isFetchingComments, setIsFetchingComments] = useState(false);
  const [isEndOfComments, setIsEndOfComments] = useState(false);
  const [comments, setComments] = useState<ProjectComment[]>([]);

  // bottom sheet methods
  const renderBackdrop: React.FC<BottomSheetBackdropProps> = useCallback(
    (props) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1}>
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            setShowAddCommentView(false);
          }}
          style={{ flex: 1 }}
        />
      </BottomSheetBackdrop>
    ),
    [],
  );

  const onClose = useCallback(() => {
    handleClose();
    setShowAddCommentView(false);
  }, [handleClose]);

  const onAddReply = useCallback(
    ({ commentPressed }: { commentPressed?: ProjectComment }) => () => {
      if (commentPressed) setReplyToComment(commentPressed);
      else setReplyToComment(null);
      setFocusAddCommentView(true);
    },
    [],
  );

  useEffect(() => {
    if (show) {
      setShowAddCommentView(true);
      fetchComments(true);
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [show]);

  // flat list methods
  useEffect(() => {
    if (isFocus) fetchComments(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocus]);

  // API calls
  const fetchComments = useCallback(
    async (hardRefresh = false) => {
      if (isFetchingComments) return;
      if (!hardRefresh && isEndOfComments) return;
      setIsFetchingComments(true);

      const requestParams = {
        authToken: user?.authToken,
        projectId,
        isRootCommentsOnly: true,
        offset: hardRefresh ? 0 : comments.length,
        order: CommentOrderType.LATEST,
        limit: DEFAULT_LIMIT,
      };

      try {
        const res = await CommentApi.getList(requestParams);
        if (hardRefresh) {
          setComments(res.data.comments);
        } else {
          setComments([...comments, ...res.data.comments]);
        }

        // check if end of list
        if (res.data.comments.length < DEFAULT_LIMIT) {
          setIsEndOfComments(true);
        }
      } catch (err) {
        console.error(err);
      }

      setIsFetchingComments(false);
    },
    [isFetchingComments, isEndOfComments, user?.authToken, projectId, comments],
  );

  const onPressShowAll = useCallback(
    (item: ProjectComment) => () => {
      navigation.navigate('CommentScreen', { preloadedData: item });
    },
    [navigation],
  );

  const flatListRenderItem = useCallback(
    ({ item }) => (
      <CommentListItem
        preloadedData={item}
        showChildComment
        onPress={onPressShowAll(item)}
        onPressMainComment={onAddReply({ commentPressed: item })}
        onShowAll={onPressShowAll(item)}
        reloadData={() => {
          fetchComments(true);
          reloadData();
        }}
      />
    ),
    [fetchComments, onAddReply, onPressShowAll, reloadData],
  );

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onClose={onClose}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: Colors[colorScheme].contentBackground }}
      >
        <BottomSheetFlatList
          ListFooterComponent={!isEndOfComments ? null : <MyText style={styles.noItemFoundText}>Yay! You have seen it all!</MyText>}
          data={comments}
          renderItem={flatListRenderItem}
          onEndReached={() => fetchComments(false)}
          refreshing={isFetchingComments}
          keyExtractor={(item) => `project_${projectId}-comment_${item.id}`}
          contentContainerStyle={styles.container}
        />
        <View style={{ height: insets.bottom }} />
      </BottomSheet>
      {show && showAddCommentView && (
        <AddCommentView
          show={focusAddCommentView}
          handleClose={() => {
            setFocusAddCommentView(false);
            setReplyToComment(null);
          }}
          keepMounted
          focusOnShow
          projectId={projectId}
          replyToComment={replyToComment}
          reloadData={() => fetchComments(true)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({

  container: {
    paddingHorizontal: 18,
  },
  noItemFoundText: {
    textAlign: 'center',
    margin: 20,
  },
});
