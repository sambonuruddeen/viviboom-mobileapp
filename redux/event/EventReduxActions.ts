import StoreConfig from '../StoreConfig';
import { set } from './index';

interface ISave {
  homeEvents?: MyEvent[];
  myBookings?: UserEventBooking[];
}

const save = (data: ISave) => {
  StoreConfig.dispatchStore(set(data));
};

export default {
  save,
};
