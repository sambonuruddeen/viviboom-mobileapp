import { PermissionsAndroid, Platform } from 'react-native';

const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    ]);

    if (
      !granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ||
      !granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ||
      !granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN]
    ) {
      return false;
    }
  }
  return true;
};

export default {
  requestPermissions,
};
