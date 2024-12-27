
import {  PermissionsAndroid, Platform, ToastAndroid } from 'react-native';

const requestFilePermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);
  
        if (
          granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          ToastAndroid.show('Permissões concedidas!', ToastAndroid.LONG);
          return true;
        } else {
          ToastAndroid.show('Permissões negadas!', ToastAndroid.LONG);
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    } else {
      return true;
    }
  };

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Permissão para usar o microfone',
          message: 'Este aplicativo precisa acessar o microfone para reconhecimento de voz.',
          buttonNeutral: 'Perguntar depois',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Permitir',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        ToastAndroid.show('Permissão negada', ToastAndroid.LONG);
        return false;
      }
    }
    return true;
  };

  export { requestFilePermissions, requestMicrophonePermission}