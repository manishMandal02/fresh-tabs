import { StorageKeys } from '@root/src/constants/app';
import { getStorage, setStorage } from './helpers';
import { IAppSettings } from '@root/src/pages/types/global.types';

// get settings from chrome sync storage
export const getAppSettings = async () => {
  const settings = await getStorage<IAppSettings>({ type: 'sync', key: StorageKeys.SETTINGS });

  if (!settings) return null;

  return settings;
};

// get settings from chrome sync storage
export const saveSettings = async (settings: IAppSettings) =>
  await setStorage({ type: 'sync', key: StorageKeys.SETTINGS, value: settings });
