import { IUser, IUserToken } from '@root/src/types/global.types';
import { getStorage, setStorage } from './helpers';

export const getUser = async () => {
  const user = await getStorage<IUser>({ key: 'USER', type: 'local' });

  if (!user) return null;
  return user;
};

export const setUser = async (user: IUser) => {
  return await setStorage({ key: 'USER', type: 'local', value: user });
};

export const getUserToken = async () => {
  const tokenInfo = await getStorage<IUserToken>({ key: 'USER_TOKEN', type: 'local' });

  if (!tokenInfo?.token || tokenInfo.expiresAt < Date.now()) return null;

  return tokenInfo.token;
};

export const setUserToken = async (tokenInfo: IUserToken) => {
  return await setStorage({ key: 'USER_TOKEN', type: 'local', value: tokenInfo });
};
