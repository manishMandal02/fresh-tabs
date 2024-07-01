import { generateId } from '@root/src/utils';
import { getStorage, setStorage } from './helpers';
import { StorageKey } from '@root/src/constants/app';
import { IContainer, IContainerData } from '@root/src/types/global.types';

//info: space containers to isolate them so they don't share cookies and site storage with other spaces

// create container for space with optional data
export const createSpaceContainer = async (spaceId: string, data?: IContainerData) => {
  const newContainer: IContainer = {
    id: generateId(),
    spaceId,
    type: 'space',
    data: data.domain ? { [data.domain]: data } : {},
  };
  await setStorage({ type: 'local', key: StorageKey.spaceContainer(spaceId), value: newContainer });
};

// get domain data from space's container storage
export const getSpaceContainer = async (spaceId: string) => {
  return await getStorage<IContainer>({ type: 'local', key: StorageKey.spaceContainer(spaceId) });
};

// save domain/site data to space's container storage
export const saveSiteDataToSpaceContainer = async (spaceId: string, domain: string, data: IContainerData) => {
  const container = await getSpaceContainer(spaceId);
  container.data[domain] = data;
  await setStorage({ type: 'local', key: StorageKey.spaceContainer(spaceId), value: container });
};

//  remove domain data from space's container storage
export const removeSiteDataFromSpaceContainer = async (spaceId: string, domain: string) => {
  const container = await getSpaceContainer(spaceId);
  delete container.data[domain];
  await setStorage({ type: 'local', key: StorageKey.spaceContainer(spaceId), value: container });
};
