import * as FileSystem from 'expo-file-system';

export const CACHE_FOLDER = `${FileSystem.cacheDirectory}images/`;

const cachePruneTriggerLimit = 1024 * 1024 * 100; // Maximum size of image file cache in bytes
const cacheLock: Record<string, Record<string, boolean>> = {};

// add from local file to cache
const addToCache = async (file: string, key: string) => {
  await FileSystem.copyAsync({
    from: file,
    to: `${CACHE_FOLDER}${key}`,
  });
  const uri = await getCachedUri(key);
  return uri;
};

// get cache file uri
const getCachedUri = async (key: string) => {
  const uri = await FileSystem.getContentUriAsync(`${CACHE_FOLDER}${key}`);
  return uri;
};

const createCacheFolder = async () => {
  const metadata = await FileSystem.getInfoAsync(CACHE_FOLDER);
  if (!metadata.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_FOLDER, { intermediates: true });
  }
};

createCacheFolder();

const fetchFromUrlAndCache = async ({
  uri,
  fileUri,
  requestOptions,
  callback,
}: {
  uri: string;
  fileUri: string;
  requestOptions: FileSystem.DownloadOptions;
  callback?: FileSystem.FileSystemNetworkTaskProgressCallback<FileSystem.DownloadProgressData>;
}) => {
  // Use the cached image if it exists. Node: the following line is actually slow, for now we just replace the cache if cache exists, but ideally
  // this function shouldn't be called if cache already exists

  // const metadata = await FileSystem.getInfoAsync(fileUri);
  // if (metadata.exists && metadata?.size) return true;

  const downloadResumable = FileSystem.createDownloadResumable(uri, fileUri, requestOptions, callback);
  try {
    const response = await downloadResumable.downloadAsync();
    if (response.status !== 200) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true }); // delete file locally if it was not downloaded properly
      return false;
    }
  } catch (err) {
    console.log(uri, err, 'in cache manager');
    return false;
  }
  return true;
};

const lockCacheFile = (fileName: string, componentId: string) => {
  // If file is already locked, add additional component lock, else create initial file lock.
  if (cacheLock[fileName]) {
    cacheLock[fileName][componentId] = true;
  } else {
    const componentDict = {};
    componentDict[componentId] = true;
    cacheLock[fileName] = componentDict;
  }
};

const unlockCacheFile = (fileName: string, componentId: string) => {
  // Delete component lock on cache file
  if (cacheLock[fileName]) {
    delete cacheLock[fileName][componentId];
  }

  // If no further component locks remain on cache file, delete filename property from cacheLock dictionary.
  if (cacheLock[fileName] && Object.keys(cacheLock[fileName]).length === 0) {
    delete cacheLock[fileName];
  }
};

const pruneCache = async () => {
  const cachePath = CACHE_FOLDER;
  // If cache directory does not exist yet there's no need for pruning.
  const dirInfo = await FileSystem.getInfoAsync(cachePath);
  if (!dirInfo.exists) return;

  const cacheFilenames = await FileSystem.readDirectoryAsync(cachePath);

  const currentCacheSize = dirInfo.size;

  // Prune cache if current cache size is too big.
  if (currentCacheSize > cachePruneTriggerLimit) {
    let overflowSize = currentCacheSize - cachePruneTriggerLimit;

    // Keep deleting cached files so long as the current cache size is larger than the size required to trigger cache pruning, or until
    // all cache files have been evaluated.
    while (overflowSize > 0 && cacheFilenames.length) {
      const filenameToPrune = cacheFilenames.shift();
      // Only prune unlocked files from cache
      if (!cacheLock[filenameToPrune]) {
        // eslint-disable-next-line no-await-in-loop
        const fileToPrune = await FileSystem.getInfoAsync(`${cachePath}${filenameToPrune}`);
        overflowSize -= fileToPrune.size;
        // eslint-disable-next-line no-await-in-loop
        await FileSystem.deleteAsync(`${cachePath}${filenameToPrune}`, { idempotent: true });
      }
    }
  }
};

export default {
  addToCache,
  createCacheFolder,
  fetchFromUrlAndCache,
  getCachedUri,
  lockCacheFile,
  unlockCacheFile,
  pruneCache,
};
