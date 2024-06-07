import { getSpaceHistory, setSpaceHistory } from '@root/src/services/chrome-storage/space-history';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import { logger } from '@root/src/utils';

const SPACE_HISTORY_VALIDITY_DAYS = 30;

export const removeOlderSpaceHistory = async () => {
  try {
    const spaces = await getAllSpaces();

    if (spaces?.length < 1) throw new Error('No spaces found');

    for (const space of spaces) {
      const history = await getSpaceHistory(space.id, true);

      // do nothing is fewer than 20 recorded site visit
      if (history.length < 20) continue;

      const date30DaysAgo = new Date();

      date30DaysAgo.setDate(date30DaysAgo.getDate() - SPACE_HISTORY_VALIDITY_DAYS);

      // do nothing if no older site visits present
      if (!history.some(h => h.timestamp < date30DaysAgo.getTime())) continue;

      // filter out older visits
      const updatedSpaceHistory = history.filter(h => h.timestamp > date30DaysAgo.getTime());

      // update storage
      await setSpaceHistory(space.id, updatedSpaceHistory);
    }
    return true;
  } catch (error) {
    logger.error({
      error,
      msg: 'Error deleting older space history.',
      fileTrace: 'background/handler/alarm/removeOlderSpaceHistory/removeOlderSpaceHistory():33 ~ catch block',
    });
    return false;
  }
};
