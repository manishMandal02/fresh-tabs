import { getStorage, setStorage } from './helpers';
import { IAppSettings } from '@root/src/pages/types/global.types';

// get settings from chrome sync storage
export const getAppSettings = async () => {
  const settings = await getStorage<IAppSettings>({ type: 'sync', key: 'SETTINGS' });

  if (!settings) return null;

  return settings;
};

// get settings from chrome sync storage
export const saveSettings = async (settings: IAppSettings) =>
  await setStorage({ type: 'sync', key: 'SETTINGS', value: settings });
