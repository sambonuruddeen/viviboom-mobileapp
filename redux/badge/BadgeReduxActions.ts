import StoreConfig from '../StoreConfig';
import { set } from './index';

const saveBadges = (badges: Badge[]) => {
  StoreConfig.dispatchStore(set({ badges }));
};

const saveChallenges = (challenges: Badge[]) => {
  StoreConfig.dispatchStore(set({ challenges }));
};

const saveRandomizerItems = (randomizerItems: Badge[]) => {
  StoreConfig.dispatchStore(set({ randomizerItems }));
};

const saveStarterBadges = (starterBadges: Badge[]) => {
  StoreConfig.dispatchStore(set({ starterBadges }));
};

const saveStarterChallenges = (starterChallenges: Badge[]) => {
  StoreConfig.dispatchStore(set({ starterChallenges }));
};

const saveBadgeCategories = (badgeCategories: BadgeCategory[]) => {
  StoreConfig.dispatchStore(set({ badgeCategories }));
};

export default {
  saveBadges,
  saveChallenges,
  saveRandomizerItems,
  saveStarterBadges,
  saveStarterChallenges,
  saveBadgeCategories,
};
