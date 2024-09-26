import StoreConfig from '../StoreConfig';
import { set } from './index';

interface ISave {
  firepit?: boolean;
  spaceSearch?: boolean;
  puzzle?: boolean;
  worldTravel?: boolean;
  finalQuest?: boolean;
}

const save = (data: ISave) => {
  const userId = StoreConfig.store.getState().account?.id;
  const VTHData = StoreConfig.store.getState().vivivaultTreasureHunt?.[userId] || {};

  StoreConfig.dispatchStore(set({ [userId]: { ...VTHData, ...data } }));
};

export default {
  save,
};
