import { useActionSheet } from '@expo/react-native-action-sheet';
import { Ionicons } from '@expo/vector-icons';
import { CameraCapturedPicture } from 'expo-camera';
import { MediaTypeOptions } from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MyCamera from 'rn-viviboom/hoc/MyCamera';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import MyVideo from 'rn-viviboom/hoc/MyVideo';
import OverlayLoader from 'rn-viviboom/hoc/OverlayLoader';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import CreateProjectReduxActions from 'rn-viviboom/redux/createProject/CreateProjectReduxActions';

import MediaBottomSheet from './MediaBottomSheet';

const DEFAULT_PROJECT_IMAGE_SIZE = 1024;

const screen = Dimensions.get('screen');
const mediaWidth = screen.width - 2 * 12; // account for padding

const CarouselItem = ({ item, shouldPlay, toggleUI }: { item: MediaInfo; shouldPlay: boolean; toggleUI: () => void }) => (
  <View style={styles.carouselItem}>
    {item.type === 'video' ? (
      <MyVideo
        src={item.uri}
        style={{ borderRadius: 0, width: mediaWidth, height: screen.height }}
        shouldPlay={shouldPlay}
        onContainerPress={toggleUI}
        carouselMode
      />
    ) : (
      <GHTouchableOpacity style={styles.carouselItem} onPress={toggleUI} activeOpacity={1}>
        <MyImage uri={item.uri} key={item.uri} params={{ width: DEFAULT_PROJECT_IMAGE_SIZE }} style={{ width: mediaWidth }} />
      </GHTouchableOpacity>
    )}
  </View>
);

export default function MediaCarouselScreen({ navigation, route }: RootStackScreenProps<'MediaCarouselScreen'>) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const insets = useSafeAreaInsets();
  const { showActionSheetWithOptions } = useActionSheet();
  const carouselRef = useRef();

  const { id, videos, images, newItemIndex } = useReduxStateSelector((state) => state.createProject);
  const data = useMemo(() => [...(videos || []), ...(images || [])], [videos, images]);
  const progress = useSharedValue<number>(0);

  const [showUI, setShowUI] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isLoading, setLoading] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);

  const [preloadedData] = useState(route?.params?.preloadedData);

  const toggleUI = () => {
    setShowUI((show) => !show);
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const renderItem = (props) => <CarouselItem {...props} toggleUI={toggleUI} shouldPlay={props.index === carouselIndex ? undefined : false} />;

  // if navigated with preload data for the first time, this is a draft
  const isNewProject = useMemo(() => !preloadedData, []);

  const onBackPressed = () => {
    if (preloadedData?.isPublished) {
      // edit published project on back press, ask dont save or stay in page
      showActionSheetWithOptions(
        {
          message: 'Your changes to this project will be discarded if you leave this screen!',
          options: ['Cancel', 'Leave'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            CreateProjectReduxActions.clearAll();
            navigation.pop();
          }
        },
      );
    } else if (id) {
      showActionSheetWithOptions(
        {
          options: isNewProject ? ['Cancel', 'Save Draft', "Don't Save"] : ['Cancel', 'Save Draft', "Don't Save", 'Delete Draft'],
          destructiveButtonIndex: isNewProject ? 2 : [2, 3],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            // save draft
            setLoading(true);
            await CreateProjectReduxActions.saveMedia();
            await CreateProjectReduxActions.saveProject(false);
            setLoading(false);
            CreateProjectReduxActions.clearAll();
            navigation.navigate('AddProjectMediaScreen');
          } else if (buttonIndex === 2) {
            // delete project if new
            if (isNewProject) await CreateProjectReduxActions.deleteProject();
            CreateProjectReduxActions.clearAll();
            navigation.navigate('AddProjectMediaScreen');
          } else if (!isNewProject && buttonIndex === 3) {
            // delete draft
            await CreateProjectReduxActions.deleteProject();
            CreateProjectReduxActions.clearAll();
            navigation.navigate('AddProjectMediaScreen');
          }
        },
      );
    } else {
      CreateProjectReduxActions.clearAll();
      navigation.navigate('AddProjectMediaScreen');
    }
  };

  const onDeletePressed = useCallback(
    (index: number) => () => {
      const assetToDelete = data[index];
      if (index <= carouselIndex) {
        setCarouselIndex((v) => (v > 0 ? v - 1 : 0));
        if (index === carouselIndex) carouselRef.current?.prev(1);
      }
      CreateProjectReduxActions.toggleMedia(assetToDelete);
    },
    [data, carouselIndex],
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const goToSlide = useCallback(
    (index: number) => {
      carouselRef.current?.scrollTo({ count: index - carouselIndex });
      setCarouselIndex(index);
    },
    [carouselIndex],
  );

  const onPictureSaved = useCallback(async (picture: CameraCapturedPicture) => {
    await CreateProjectReduxActions.bulkAddMedia([{ ...picture, type: 'image' }]);
  }, []);

  const onVideoSaved = useCallback(async (video: { uri: string; width: number; height: number }) => {
    await CreateProjectReduxActions.bulkAddMedia([{ ...video, type: 'video' }]);
  }, []);

  const onLaunchSystemCamera = useCallback(async () => {
    await CreateProjectReduxActions.launchCamera({});
  }, []);

  const onLaunchMediaLibrary = useCallback(async () => {
    await CreateProjectReduxActions.launchMediaLibrary({ mediaTypes: MediaTypeOptions.All });
  }, []);

  // auto scroll to added media (only when new item index change)
  useEffect(() => {
    if (newItemIndex >= 0) goToSlide(newItemIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newItemIndex]);

  // load draft data if exists (only once)
  useEffect(() => {
    const init = async () => {
      if (preloadedData && preloadedData?.id) {
        setLoading(true);
        await CreateProjectReduxActions.loadProject(preloadedData?.id);
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <View style={styles.mediaCarousel}>
        <Carousel
          ref={carouselRef}
          width={screen.width}
          height={screen.height}
          data={data}
          renderItem={renderItem}
          onSnapToItem={setCarouselIndex}
          loop={false}
          onProgressChange={(_, value: number) => {
            progress.value = value;
          }}
        />
      </View>
      {!isLoading && !data.length && (
        <View style={styles.noMedia}>
          <MyText style={{ color: '#fff', fontWeight: '400', fontSize: 18, textAlign: 'center' }}>
            No media has been selected. Add an image or video to proceed!
          </MyText>
        </View>
      )}
      {showUI && (
        <View style={{ ...styles.headerContainer, paddingTop: insets.top, height: styles.headerContainer.height + insets.top }}>
          <View style={styles.backButton}>
            <TouchableOpacity onPress={onBackPressed}>
              <Ionicons name="ios-chevron-back-outline" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
          {!!data.length && (
            <TouchableOpacity style={styles.mediaPressable} activeOpacity={1} onPress={onDeletePressed(carouselIndex)}>
              <Ionicons name="ios-trash-outline" color="#fff" size={24} />
            </TouchableOpacity>
          )}
        </View>
      )}
      <MediaBottomSheet
        show={showUI}
        carouselIndex={carouselIndex}
        animValue={progress}
        goToSlide={goToSlide}
        onDeletePressed={onDeletePressed}
        onAddMedia={() => setShowPickerModal(true)}
      />
      <OverlayLoader show={isLoading} />
      <Modal visible={showPickerModal} transparent hardwareAccelerated animationType="slide" onRequestClose={() => setShowPickerModal(false)}>
        <View style={[styles.cameraContainer, { top: styles.cameraContainer.top + insets.top }]}>
          <MyCamera
            show={showPickerModal}
            handleClose={() => setShowPickerModal(false)}
            onPictureSaved={onPictureSaved}
            onVideoSaved={onVideoSaved}
            onLaunchMediaLibrary={onLaunchMediaLibrary}
            onLaunchSystemCamera={onLaunchSystemCamera}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 50,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 20,
    width: 70,
  },
  mediaCarousel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#000',
  },
  carouselContainer: {
    flex: 1,
  },
  carouselItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: {},
  mediaPressable: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 80,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMedia: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  cameraContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});
