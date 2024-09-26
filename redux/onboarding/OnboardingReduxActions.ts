import StoreConfig from '../StoreConfig';
import { set } from './index';

interface ISave {
  landing?: boolean;
  createProject?: boolean;
  badge?: boolean;
  event?: boolean;
  profile?: boolean;
  completeProject?: boolean;
  projectBadge?: boolean;
  chatWithBadgeChallengeCreator?: boolean;
  chatWithChallengeBuilderPal?: boolean;
  builderPalHome?: boolean;
  projectComment?: boolean;
}

const save = (data: ISave) => {
  StoreConfig.dispatchStore(set(data));
};

export default {
  save,
};
