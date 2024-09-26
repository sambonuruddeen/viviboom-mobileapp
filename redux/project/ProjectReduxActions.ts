import StoreConfig from '../StoreConfig';
import { set } from './index';

interface ISave {
  homeProjects?: Project[];
  draftProjects?: Project[];
  blockedProjectIds?: number[];
  searchHistory?: string[];
}

const getUserProjectData = () => {
  const userId = StoreConfig.store.getState().account?.id;
  return StoreConfig.store.getState().project?.[userId];
};

const save = (data: ISave) => {
  const userId = StoreConfig.store.getState().account?.id;
  const userProjectData = StoreConfig.store.getState().project?.[userId] || {};

  StoreConfig.dispatchStore(set({ [userId]: { ...userProjectData, ...data } }));
};

const MAX_HISTORY_COUNT = 10;

const addSearchHistory = (searchKeyword: string) => {
  const searchHistory = getUserProjectData()?.searchHistory || [];
  if (!searchHistory.includes(searchKeyword)) {
    save({ searchHistory: [searchKeyword, ...searchHistory.slice(0, MAX_HISTORY_COUNT - 1)] });
  } else {
    const newSearchHistory = searchHistory.filter((s) => s !== searchKeyword);
    save({ searchHistory: [searchKeyword, ...newSearchHistory.slice(0, MAX_HISTORY_COUNT - 1)] });
  }
};

const blockProject = (projectId: number) => {
  const blockedProjectIds = getUserProjectData()?.blockedProjectIds || [];
  if (!blockedProjectIds.includes(projectId)) {
    save({ blockedProjectIds: [projectId, ...blockedProjectIds] });
  }
};

export default {
  save,
  addSearchHistory,
  blockProject,
};
