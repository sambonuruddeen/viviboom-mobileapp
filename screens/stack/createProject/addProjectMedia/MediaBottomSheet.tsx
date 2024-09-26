import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { Extrapolate, abs, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Layout from 'rn-viviboom/constants/Layout';
import { ImageManipulator } from 'rn-viviboom/hoc/ImageCropper';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import CreateProjectReduxActions, { IMAGE_UPLOAD_LIMIT, VIDEO_UPLOAD_LIMIT } from 'rn-viviboom/redux/createProject/CreateProjectReduxActions';

const DEFAULT_PROJECT_IMAGE_SIZE = 128;
interface MediaBottomSheetProps {
  show: boolean;
  carouselIndex: number;
  animValue: Animated.SharedValue<number>;
  goToSlide: (index: number) => void;
  onDeletePressed: (index: number) => () => void;
  onAddMedia: () => void;
}

interface PreviewItemProps {
  index: number;
  item: MediaInfo;
  onPress: () => void;
  onDelete: () => void;
  animValue: Animated.SharedValue<number>;
}

const PreviewItem = memo(({ index, item, onPress, onDelete, animValue }: PreviewItemProps) => {
  const animStyle = useAnimatedStyle(() => {
    const inputRange = [index - 1, index, index + 1];
    const outputRange = [0, 1, 0];

    return {
      opacity: interpolate(animValue?.value, inputRange, outputRange, Extrapolate.CLAMP),
    };
  }, [index, animValue]);

  return (
    <Pressable key={`selected-image_${item.id}`} style={styles.previewImageContainer} onPress={onPress}>
      <MyImage
        uri={item.type === 'video' ? item.localThumbnailUri || item.thumbnailUri : item.uri}
        params={{ width: DEFAULT_PROJECT_IMAGE_SIZE }}
        key={item.uri}
        style={styles.previewImage}
      />
      <Animated.View style={[StyleSheet.absoluteFill, styles.selectedPreviewImage, animStyle]} />
      <Pressable style={styles.closePressable} onPress={onDelete}>
        <View style={styles.closeIcon}>
          <Ionicons name="ios-close-sharp" size={15} color="#fff" />
        </View>
      </Pressable>
    </Pressable>
  );
});

export default function MediaBottomSheet({ show, carouselIndex, animValue, goToSlide, onDeletePressed, onAddMedia }: MediaBottomSheetProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const snapPoints = useMemo(() => [insets.bottom + Layout.bottomNavigatorBarHeight + 150], [insets]);

  const bottomSheetRef = useRef<BottomSheet>();
  const scrollRef = useRef<ScrollView>();

  const { videos = [], images = [] } = useReduxStateSelector((state) => state.createProject);
  const [isEditorVisible, setIsEditorVisible] = useState(false);

  const mediaToEdit = useMemo(
    () => (videos?.length && carouselIndex < videos.length ? videos[carouselIndex] : images[carouselIndex - (videos?.length || 0)]),
    [images, carouselIndex, videos],
  );

  const onEditPressed = useCallback(() => {
    if (mediaToEdit?.type === 'image') setIsEditorVisible(true);
  }, [mediaToEdit?.type]);

  const onImageFinishEdit = useCallback(
    ({ uri }: { uri: string }) => {
      CreateProjectReduxActions.editMedia({ ...mediaToEdit, uri });
    },
    [mediaToEdit],
  );

  useEffect(() => {
    const itemWidth = 72;
    const scrollX = itemWidth * carouselIndex + (!videos?.length || carouselIndex < videos.length ? 0 : itemWidth);
    scrollRef.current?.scrollTo({ x: scrollX });
  }, [carouselIndex, videos?.length]);

  useEffect(() => {
    if (show) bottomSheetRef.current?.expand();
    else bottomSheetRef.current?.close();
  }, [show]);

  return (
    <>
      <BottomSheet
        index={show ? 0 : -1}
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={false}
        backgroundStyle={styles.bottomSheetBackground}
        handleComponent={null}
      >
        <View style={{ paddingBottom: insets.bottom + Layout.bottomNavigatorBarHeight }}>
          <View style={styles.selectedMediaTopRow}>
            <View style={styles.limits}>
              <MyText style={{ color: '#aaa', fontSize: 12, fontWeight: '400' }}>Media Limit</MyText>
              <MyText style={{ color: '#fff', fontSize: 16, fontWeight: '400' }}>
                {videos?.length || 0}/{VIDEO_UPLOAD_LIMIT} videos, {images.length}/{IMAGE_UPLOAD_LIMIT} images
              </MyText>
            </View>
            <View style={styles.topRowButtons}>
              {mediaToEdit?.type === 'image' && (
                <MyButton
                  style={styles.editButton}
                  labelStyle={{ fontSize: 13, color: '#fff', fontWeight: '600', marginVertical: 0 }}
                  mode="contained"
                  compact
                  onPress={onEditPressed}
                >
                  Edit
                </MyButton>
              )}
              {(!!videos?.length || !!images?.length) && (
                <MyButton
                  style={styles.nextButton}
                  labelStyle={{ fontSize: 13, color: '#fff', marginVertical: 0 }}
                  compact
                  onPress={() => navigation.navigate('CreateProjectScreen')}
                >
                  Next
                </MyButton>
              )}
            </View>
          </View>
          <ScrollView horizontal contentContainerStyle={styles.selectedMediaPreview} ref={scrollRef}>
            {!!videos?.length && (
              <View style={styles.previewContaienr}>
                <MyText style={{ color: '#fff', marginHorizontal: 6 }}>Videos ({videos.length})</MyText>
                <View style={styles.previewRoll}>
                  {videos.map((vid, index) => (
                    <PreviewItem
                      key={`selected-video_${vid.id}`}
                      item={vid}
                      index={index}
                      animValue={animValue}
                      onPress={() => goToSlide(index)}
                      onDelete={onDeletePressed(index)}
                    />
                  ))}
                  <TouchableOpacity style={styles.addMediaContainer} onPress={onAddMedia}>
                    <Ionicons name="ios-add-sharp" size={36} color="#ddd" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {!!videos?.length && !!images?.length && <View style={styles.verticalSeparator} />}
            {!!images?.length && (
              <View style={styles.previewContaienr}>
                <MyText style={{ color: '#fff', marginHorizontal: 6 }}>Images ({images.length})</MyText>
                <View style={styles.previewRoll}>
                  {images.map((img, index) => (
                    <PreviewItem
                      key={`selected-image_${img.id}`}
                      item={img}
                      index={index + videos.length}
                      animValue={animValue}
                      onPress={() => goToSlide(videos.length + index)}
                      onDelete={onDeletePressed(index + videos.length)}
                    />
                  ))}
                  <TouchableOpacity style={styles.addMediaContainer} onPress={onAddMedia}>
                    <Ionicons name="ios-add-sharp" size={36} color="#ddd" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {!videos?.length && !images?.length && (
              <View style={styles.previewContaienr}>
                <MyText>Add an image or video here</MyText>
                <View style={styles.previewRoll}>
                  <TouchableOpacity style={styles.noItemAddMedia} onPress={onAddMedia}>
                    <Ionicons name="ios-add-sharp" size={36} color="#ddd" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </BottomSheet>
      {mediaToEdit?.type === 'image' && (
        <ImageManipulator
          isVisible={isEditorVisible}
          photo={{ uri: mediaToEdit?.uri }}
          onToggleModal={() => setIsEditorVisible(false)}
          onPictureChoosed={onImageFinishEdit}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#000',
    borderRadius: 0,
    borderColor: '#fff',
    opacity: 0.9,
  },
  selectedMediaPreview: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  selectedMediaTopRow: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  limits: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  topRowButtons: {
    flexDirection: 'row',
  },
  editButton: {
    height: 36,
    width: 70,
    paddingVertical: 0,
    borderWidth: 1,
    backgroundColor: '#000',
    marginRight: 12,
    borderRadius: 18,
    borderColor: '#fff',
    justifyContent: 'center',
  },
  nextButton: {
    height: 36,
    width: 70,
    paddingVertical: 0,
    backgroundColor: '#7353ff',
    borderRadius: 18,
    justifyContent: 'center',
  },
  previewContaienr: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  previewRoll: {
    flexDirection: 'row',
  },
  previewImageContainer: {
    width: 60,
    height: 60,
    margin: 6,
  },
  addMediaContainer: {
    width: 60,
    height: 60,
    margin: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingLeft: 3,
  },
  noItemAddMedia: {
    width: 60,
    height: 60,
    margin: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingLeft: 3,
  },
  previewImage: {
    borderRadius: 12,
    width: '100%',
    height: '100%',
  },
  selectedPreviewImage: {
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#7353ff',
  },
  closePressable: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
  },
  closeIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    backgroundColor: '#000',
    opacity: 0.6,
    borderBottomLeftRadius: 9,
    borderTopRightRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalSeparator: {
    height: 52,
    width: 2,
    marginHorizontal: 12,
    marginTop: 25,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fff',
  },
});
