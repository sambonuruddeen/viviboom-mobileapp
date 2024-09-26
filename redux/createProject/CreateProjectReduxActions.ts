/* eslint-disable no-restricted-syntax */

/* eslint-disable no-await-in-loop */
import { isDevice } from 'expo-device';
import * as FileSystem from 'expo-file-system';
import { ImagePickerAsset, ImagePickerOptions } from 'expo-image-picker';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import Toast from 'react-native-toast-message';
import { v4 as uuid } from 'uuid';

import ProjectApi from 'rn-viviboom/apis/viviboom/ProjectApi';
import Config from 'rn-viviboom/constants/Config';
import { ProjectAuthorRoleType } from 'rn-viviboom/enums/ProjectAuthorRoleType';
import CacheManager from 'rn-viviboom/hoc/CacheManager';

import StoreConfig from '../StoreConfig';
import { set } from './index';

export const IMAGE_UPLOAD_LIMIT = 10;
export const VIDEO_UPLOAD_LIMIT = 5;

// utility/helper functions
function getMimeType(asset: MediaInfo) {
  const suffix = asset.uri.substring(asset.uri.lastIndexOf('.') + 1);
  switch (suffix) {
    case 'jpg':
      return 'image/jpg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'mp4':
      return 'video/mp4';
    case 'mov':
      return 'video/quicktime';
    case '3gp':
      return 'video/3gpp';
    default:
      return `${asset.type}/${suffix}`;
  }
}

// user selected assets
interface ISetMedia {
  videos?: MediaInfo[];
  images?: MediaInfo[];
  prevVideos?: MediaInfo[];
  prevImages?: MediaInfo[];

  authorUserId?: number;
  name?: string;
  description?: string;
  thumbnailUri?: string;
  isCompleted?: boolean;
  content?: string;
  files?: Array<ProjectFile>;
  badges?: Array<Badge>;
  projectCategories?: Array<ProjectCategory>;
  categories?: Array<ProjectCategory>;
  authorUsers?: Array<User>;
  prevBadges?: Array<Badge>;
  prevProjectCategories?: Array<ProjectCategory>;
  prevAuthorUsers?: Array<User>;
}

const setProject = (data: ISetMedia) => {
  StoreConfig.dispatchStore(set(data));
};

// this method is to set media after an async event where the original states might be modified
const mergeMedia = (type: 'videos' | 'images', mergeFunction: (currentMediaState: MediaInfo[]) => MediaInfo[]) => {
  const { videos, images } = StoreConfig.store.getState().createProject;

  if (type === 'videos') setProject({ videos: mergeFunction(videos) });
  if (type === 'images') setProject({ images: mergeFunction(images) });
};

const setSavingMedia = (isSavingMedia: boolean) => {
  StoreConfig.dispatchStore(set({ isSavingMedia }));
};

const setNewItemIndexById = (id: string) => {
  const { videos = [], images = [] } = StoreConfig.store.getState().createProject;
  const data = [...videos, ...images];
  StoreConfig.dispatchStore(set({ newItemIndex: data.findIndex((a) => a.id === id) }));
};

const clearAll = () => {
  const { account } = StoreConfig.store.getState();
  const initialAuthor = { ...account, role: ProjectAuthorRoleType.MAKER };
  StoreConfig.dispatchStore(
    set({
      id: undefined,
      videos: [],
      images: [],
      isSavingMedia: false,
      newItemIndex: 0,
      prevVideos: [],
      prevImages: [],
      name: '',
      description: '',
      thumbnailUri: '',
      isCompleted: false,
      content: '',
      files: [],
      badges: [],
      projectCategories: [],
      authorUsers: [initialAuthor],
      prevBadges: [],
      prevProjectCategories: [],
      prevAuthorUsers: [initialAuthor],
    }),
  );
};

const toggleMedia = (asset: MediaInfo) => {
  const { videos, images } = StoreConfig.store.getState().createProject;

  if (asset.type === 'video') {
    if (videos.find((a) => a.id === asset.id)) {
      setProject({ videos: videos.filter((a) => a.id !== asset.id) });
    } else if (videos.length < VIDEO_UPLOAD_LIMIT) {
      setProject({ videos: videos.concat(asset) });
    }
  }
  if (asset.type === 'image') {
    if (images.find((a) => a.id === asset.id)) {
      setProject({ images: images.filter((a) => a.id !== asset.id) });
    } else if (images.length < IMAGE_UPLOAD_LIMIT) {
      setProject({ images: images.concat(asset) });
    }
  }
};

const editMedia = (asset: MediaInfo) => {
  const { videos, images } = StoreConfig.store.getState().createProject;

  if (asset.type === 'video') {
    const index = videos.findIndex((a) => a.id === asset.id);
    if (index >= 0) {
      const newVideos = [...videos];
      newVideos[index] = asset;
      setProject({ videos: newVideos });
    }
  }
  if (asset.type === 'image') {
    const index = images.findIndex((a) => a.id === asset.id);
    if (index >= 0) {
      const newImages = [...images];
      newImages[index] = asset;
      setProject({ images: newImages });
    }
  }
};

const bulkAddMedia = async (assets: ImagePickerAsset[]) => {
  if (!assets?.length) return;
  const { videos, images } = StoreConfig.store.getState().createProject;

  // assign id to all assets
  const newAssets = assets.map((a) => ({ ...a, id: uuid() }));

  let newVideos = newAssets.filter((m) => m.type === 'video');
  let newImages = newAssets.filter((m) => m.type === 'image');
  if (newVideos.length > 0) {
    if (videos.length + newVideos.length > VIDEO_UPLOAD_LIMIT) {
      newVideos = newVideos.slice(0, VIDEO_UPLOAD_LIMIT - videos.length);
    }
    const promises = newVideos.map(async (asset) => {
      const res = await VideoThumbnails.getThumbnailAsync(asset.uri, { quality: 0.1 });
      return { ...asset, localThumbnailUri: res.uri };
    });

    const data = await Promise.all(promises);
    setProject({ videos: videos.concat(...data) });
  }
  if (newImages.length > 0) {
    if (images.length + newImages.length > IMAGE_UPLOAD_LIMIT) {
      newImages = newImages.slice(0, IMAGE_UPLOAD_LIMIT - images.length);
    }
    setProject({ images: images.concat(...newImages) });
  }
  setNewItemIndexById(newAssets[newAssets.length - 1].id);
};

// sync with server: including upload, delete, update
const saveMedia = async (progressCallback?: (numberOfMediaSaved: number, numberOfMediaToSave: number) => void) => {
  const { authToken } = StoreConfig.store.getState().account;
  const { id, videos, images, prevVideos, prevImages, isSavingMedia } = StoreConfig.store.getState().createProject;
  if (!id || isSavingMedia) return;
  setSavingMedia(true);

  let numberOfMediaSaved = 0;
  try {
    // count all operations upfront
    const deletedVideos = prevVideos?.filter((prevVid) => !videos.find((vid) => vid.id === prevVid.id)) || [];
    // videos for now cannot be modified, so is commented out at the moment
    // const modifiedVideos = videos.filter((vid) => prevVideos.find((prevVid) => vid.id === prevVid.id && vid.uri !== prevVid.uri));
    const addedVideos = videos?.filter((vid) => !prevVideos?.find((prevVid) => vid.id === prevVid.id)) || [];

    const deletedImages = prevImages?.filter((prevImg) => !images.find((img) => img.id === prevImg.id)) || [];
    const modifiedImages = images?.filter((img) => prevImages.find((prevImg) => img.id === prevImg.id && img.uri !== prevImg.uri)) || [];
    const addedImages = images?.filter((vid) => !prevImages?.find((prevImg) => vid.id === prevImg.id)) || [];

    const numberOfMediaToSave = deletedVideos.length + addedVideos.length + deletedImages.length + modifiedImages.length + addedImages.length;
    if (progressCallback) progressCallback(numberOfMediaSaved, numberOfMediaToSave);

    // UPDATE IMAGES

    // settle delete and modified first
    const imagePromises = [
      ...deletedImages.map(async (img) => {
        await ProjectApi.deleteProjectImage({ authToken, projectId: id, imageId: img.id });
        numberOfMediaSaved += 1;
        if (progressCallback) progressCallback(numberOfMediaSaved, numberOfMediaToSave);
      }),
      ...modifiedImages.map(async (img) => {
        await ProjectApi.putProjectImage({
          authToken,
          projectId: id,
          imageId: img.id,
          file: { uri: img.uri, name: `project-${id}-image-${img.id}`, type: getMimeType(img) },
        });
        numberOfMediaSaved += 1;
        if (progressCallback) progressCallback(numberOfMediaSaved, numberOfMediaToSave);
      }),
    ];

    await Promise.all(imagePromises);

    // then settle new images with reordering, hence must be sequential
    let insertOrder = (prevImages?.length || 0) + 1;
    const oldImages = [...(images || [])];
    const oldId2NewImage: { [id: string]: MediaInfo } = {};
    for (const img of addedImages) {
      const res = await ProjectApi.postProjectImage({
        authToken,
        projectId: id,
        file: { uri: img.uri, name: `project-${id}-image-${id}`, type: getMimeType(img) },
        insertOrder,
      });
      oldId2NewImage[img.id] = { ...res.data?.projectImage, ...img, id: res.data?.projectImage.id };
      insertOrder += 1;
      numberOfMediaSaved += 1;
      if (progressCallback) progressCallback(numberOfMediaSaved, numberOfMediaToSave);
    }

    // rerender by setting the current state to not modified, and new ids if it is a new image (merge with current state)
    mergeMedia('images', (currentImages) => currentImages.map((curImg) => oldId2NewImage[curImg.id] || curImg));
    // prev states must use the stale states to update, because thats where the server states at
    setProject({ prevImages: oldImages.map((img) => oldId2NewImage[img.id] || img) });

    // UPDATE VIDEOS

    // settle delete and modified first
    const videoPromises = [
      ...deletedVideos.map(async (vid) => {
        await ProjectApi.deleteProjectVideo({ authToken, projectId: id, videoId: vid.id });
        numberOfMediaSaved += 1;
        if (progressCallback) progressCallback(numberOfMediaSaved, numberOfMediaToSave);
      }),
      // video cannot be modified at the moment
    ];

    await Promise.all(videoPromises);

    // then settle new videos with reordering, hence must be sequential
    insertOrder = (prevVideos?.length || 0) + 1;
    const oldVideos = [...(videos || [])];
    const oldId2NewVideo: { [id: string]: MediaInfo } = {};
    for (const vid of addedVideos) {
      const res = await ProjectApi.postProjectVideo({
        authToken,
        projectId: id,
        file: { uri: vid.uri, name: `project-${id}-video-${vid.id}`, type: getMimeType(vid) },
        insertOrder,
      });
      oldId2NewVideo[vid.id] = { ...res.data?.projectVideo, ...vid, id: res.data?.projectVideo.id };
      insertOrder += 1;
      numberOfMediaSaved += 1;
      if (progressCallback) progressCallback(numberOfMediaSaved, numberOfMediaToSave);
    }

    // rerender by setting the current state to not modified, and new ids if it is a new video (merge with current state)
    mergeMedia('videos', (currentVideos) => currentVideos.map((curVid) => oldId2NewVideo[curVid.id] || curVid));
    // prev states must use the stale states to update, because thats where the server states at
    setProject({ prevVideos: oldVideos.map((vid) => oldId2NewVideo[vid.id] || vid) });
  } catch (err) {
    console.warn(err);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.warn(err?.response?.data?.message || err);
    Toast.show({ text1: err.toString(), type: 'error' });
  }
  setSavingMedia(false);
};

// Project Data
const loadProject = async (id: number) => {
  const { authToken } = StoreConfig.store.getState().account;
  StoreConfig.dispatchStore(set({ id, newItemIndex: 0 }));
  try {
    const res = await ProjectApi.get({ authToken, projectId: id, verboseAttributes: ['files', 'categories', 'badges'] });
    const fetchedProject = res.data?.project;
    const mediaVideos = fetchedProject.videos ? fetchedProject.videos.map((v): MediaInfo => ({ ...v, type: 'video' })) : [];
    // prefetch images for editting images with cache uri
    const mediaImagesPromises = (fetchedProject.images || []).map(async (v): Promise<MediaInfo> => {
      const cacheUri = `${FileSystem.cacheDirectory}${uuid()}.png`;
      await CacheManager.fetchFromUrlAndCache({
        uri: v.uri,
        fileUri: cacheUri,
        requestOptions: { headers: { 'auth-token': authToken } },
        callback: null,
      });
      return { ...v, type: 'image', uri: cacheUri };
    });
    const mediaImages = await Promise.all(mediaImagesPromises);
    setProject({
      authorUserId: fetchedProject.authorUserId,
      name: fetchedProject.name || '',
      description: fetchedProject.description || '',
      isCompleted: fetchedProject.isCompleted,
      content: fetchedProject.content ? extractContent(fetchedProject.content) : '',
      images: mediaImages,
      videos: mediaVideos,
      thumbnailUri: fetchedProject.thumbnailUri,
      files: fetchedProject.files || [],
      badges: fetchedProject.badges || [],
      projectCategories: fetchedProject.categories || [],
      authorUsers: fetchedProject.authorUsers || [],

      prevImages: mediaImages,
      prevVideos: mediaVideos,
      prevBadges: fetchedProject.badges || [],
      prevProjectCategories: fetchedProject.categories || [],
      prevAuthorUsers: fetchedProject.authorUsers || [],
    });
  } catch (err) {
    console.error(err);
  }
};

const createProject = async () => {
  const { authToken, id } = StoreConfig.store.getState().account;
  try {
    const res = await ProjectApi.post({ authToken });
    StoreConfig.dispatchStore(set({ id: res.data.projectId, authorUserId: id }));
  } catch (err) {
    console.error(err);
  }
};

const saveProject = async (isPublished: boolean) => {
  const { authToken } = StoreConfig.store.getState().account;
  const {
    id,
    videos,
    images,
    name,
    description,
    thumbnailUri,
    content,
    isCompleted,
    prevBadges,
    badges,
    prevProjectCategories,
    projectCategories,
    prevAuthorUsers,
    authorUsers,
  } = StoreConfig.store.getState().createProject;
  try {
    if (!id) return;

    // patching
    const reqBody = {
      authToken,
      projectId: id,
      name,
      description,
      thumbnailUri: undefined,
      content: decorateContent(content),
      isCompleted,
      badges: getArrayForUpdate(prevBadges || [], badges || []),
      projectCategories: getArrayForUpdate(prevProjectCategories || [], projectCategories || []),
      authorUsers: getArrayForUpdateWithEdit(prevAuthorUsers || [], authorUsers || []),
      isPublished: undefined,
    };

    if (thumbnailUri) reqBody.thumbnailUri = thumbnailUri;

    if (isPublished) {
      reqBody.isPublished = isPublished;
      if (!reqBody.thumbnailUri) {
        reqBody.thumbnailUri =
          videos.length > 0
            ? `${Config.ApiBaseUrl}/v2/project/${id}/video/${videos[0].id}/thumbnail`
            : `${Config.ApiBaseUrl}/v2/project/${id}/image/${images?.[0].id}`;
      }
    }

    await ProjectApi.patch(reqBody);
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.error(err?.response?.data?.message || err?.message);
  }
};

const deleteProject = async () => {
  const { authToken } = StoreConfig.store.getState().account;
  const { id } = StoreConfig.store.getState().createProject;
  try {
    await ProjectApi.deleteProject({ authToken, projectId: id });
    StoreConfig.dispatchStore(set({ id: undefined }));
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    console.error(err?.response?.data?.message || err?.message);
  }
};

// for image picker actions
const launchCamera = async (options: ImagePickerOptions) => {
  const permissionResponse = await ImagePicker.requestCameraPermissionsAsync();
  if (!permissionResponse.granted) {
    return;
  }
  try {
    const mediaDetails = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      videoMaxDuration: 60,
      ...options,
    });

    if (!mediaDetails.canceled) {
      await bulkAddMedia(mediaDetails.assets);
    }
  } catch (err) {
    // simulator has no camera
    console.warn(err);
  }
};

const launchMediaLibrary = async (options: ImagePickerOptions) => {
  const permissionResponse = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResponse.granted) {
    return;
  }
  try {
    const mediaDetails = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: isDevice,
      orderedSelection: true,
      selectionLimit: 10,
      ...options,
    });

    if (!mediaDetails.canceled) {
      await bulkAddMedia(mediaDetails.assets);
    }
  } catch (err) {
    console.warn(err);
  }
};

export default {
  setProject,
  clearAll,
  toggleMedia,
  editMedia,
  bulkAddMedia,
  setSavingMedia,
  loadProject,
  saveMedia,
  createProject,
  saveProject,
  deleteProject,

  launchCamera,
  launchMediaLibrary,
};

// format plain content to editor.js json object (without styles)
// eslint-disable-next-line prettier/prettier
const decorateContent = (content: string) => (content ? `{"blocks":[{"key":"${uuid().slice(0, 5)}","text":"${content}","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}` : '');

// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
const extractContent = (content: string): string => {
  let res = '';
  try {
    res = JSON.parse(content)?.blocks?.[0]?.text || '';
  } catch (err) {
    /* empty */
  }
  return res;
};

const getArrayForUpdate = (prevArr: Array<{ id: number }>, arr: Array<{ id: number }>) => [
  // new items
  ...arr.filter((item1) => !prevArr.find((item2) => item1.id === item2.id)).map((item) => ({ id: item.id })),
  // deleted items
  ...prevArr.filter((item1) => !arr.find((item2) => item1.id === item2.id)).map((item) => ({ id: item.id, isDelete: true })),
];

const getArrayForUpdateWithEdit = (prevArr: Array<User>, arr: Array<User>) => [
  // new items
  ...arr.filter((item1) => !prevArr.find((item2) => item1.id === item2.id)).map((item) => ({ id: item.id, role: item.role })),
  // edit items
  ...arr.filter((item1) => prevArr.find((item2) => item1.id === item2.id && item1.role !== item2.role)).map((item) => ({ id: item.id, role: item.role })),
  // deleted items
  ...prevArr.filter((item1) => !arr.find((item2) => item1.id === item2.id)).map((item) => ({ id: item.id, isDelete: true })),
];
