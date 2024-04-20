import { logger } from '@root/src/utils';
import { getStorage, setStorage } from './helpers';
import { StorageKey } from '@root/src/constants/app';
import { IGroup } from '@root/src/types/global.types';

export const getGroups = async (spaceId: string) => {
  try {
    const groups = await getStorage<IGroup[]>({ key: StorageKey.groups(spaceId), type: 'local' });

    return groups;
  } catch (error) {
    logger.error({
      error,
      msg: 'Error getting groups.',
      fileTrace: ` ${'src/services/chrome-storage/groups.ts:15 getGroups() ~ catch block'}`,
    });
    return null;
  }
};

export const setGroupsToSpace = async (spaceId: string, groups: IGroup[]) => {
  try {
    return await setStorage({ key: StorageKey.groups(spaceId), type: 'local', value: groups });
  } catch (error) {
    logger.error({
      error,
      msg: 'Error setting groups.',
      fileTrace: ` ${'src/services/chrome-storage/groups.ts:28 setGroupsToSpace() ~ catch block'}`,
    });
    return false;
  }
};

export const getGroup = async (spaceId: string, groupId: number) => {
  try {
    const allGroups = await getGroups(spaceId);

    const group = allGroups.find(group => group.id === groupId);
    if (!group?.id) throw new Error('Group not found.');
    return group;
  } catch (error) {
    logger.error({
      error,
      msg: `Error getting group groupId: ${groupId}.`,
      fileTrace: ` ${'src/services/chrome-storage/groups.ts:41 getGroup() ~ catch block'}`,
    });
    return null;
  }
};

export const addGroup = async (spaceId: string, newGroup: IGroup) => {
  try {
    const allGroups = await getGroups(spaceId);

    await setGroupsToSpace(spaceId, [...allGroups, newGroup]);

    return true;
  } catch (error) {
    logger.error({
      error,
      msg: `Error adding new group groupId: ${newGroup.id}.`,
      fileTrace: ` ${'src/services/chrome-storage/groups.ts:41 getGroup() ~ catch block'}`,
    });
    return CSSFontFeatureValuesRule;
  }
};

export const updateGroup = async (spaceId: string, group: IGroup) => {
  try {
    const allGroups = await getGroups(spaceId);

    const groupToUpdateIndex = allGroups.findIndex(g => g.id === group.id);

    if (groupToUpdateIndex === -1) throw new Error('Group not found.');

    allGroups.splice(groupToUpdateIndex, 1, group);

    await setGroupsToSpace(spaceId, allGroups);

    return true;
  } catch (error) {
    logger.error({
      error,
      msg: `Error updating group groupId: ${group.id}.`,
      fileTrace: ` ${'src/services/chrome-storage/groups.ts:65 updateGroup() ~ catch block'}`,
    });
    return false;
  }
};

export const removeGroup = async (spaceId: string, groupId: number) => {
  try {
    const allGroups = await getGroups(spaceId);

    const groupToDeleteIndex = allGroups.findIndex(g => g.id === groupId);

    if (groupToDeleteIndex === -1) throw new Error('Group not found.');

    allGroups.splice(groupToDeleteIndex, 1);

    await setGroupsToSpace(spaceId, allGroups);

    return true;
  } catch (error) {
    logger.error({
      error,
      msg: `Error deleting group groupId: ${groupId}.`,
      fileTrace: ` ${'src/services/chrome-storage/groups.ts:65 updateGroup() ~ catch block'}`,
    });
    return false;
  }
};
