import StoreConfig from '../StoreConfig';
import { clear, set } from './index';

const save = (data: Institution) => {
  StoreConfig.dispatchStore(set(data));
};

const clearInstitution = () => {
  StoreConfig.dispatchStore(clear());
};

export default {
  save,
  clearInstitution,
};
