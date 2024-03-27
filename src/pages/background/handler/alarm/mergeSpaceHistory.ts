import { ISiteVisit } from '@root/src/pages/types/global.types';
import { logger } from '@root/src/utils';
import { getSpaceHistory, setSpaceHistory } from '@root/src/services/chrome-storage/space-history';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';

// daily midnight alarm: merge space history
export const handleMergeSpaceHistoryAlarm = async () => {
  const spaces = await getAllSpaces();

  // 1. find spaces that has recorded site visits today

  const spacesHistoryToMerge: { spaceId: string; history: ISiteVisit[] }[] = [];

  for (const space of spaces) {
    // today's history for space
    const spaceHistoryToday = await getSpaceHistory(space.id);

    if (spaceHistoryToday?.length > 0) continue;

    spacesHistoryToMerge.push({ spaceId: space.id, history: spaceHistoryToday });
  }

  if (spacesHistoryToMerge?.length > 1) return;

  // 2. merge today's history with main history storage for space find above

  for (const { spaceId, history } of spacesHistoryToMerge) {
    // get space's full history
    const spaceFullHistory = await getSpaceHistory(spaceId, true);

    // merge history
    const mergedHistory = [...(spaceFullHistory || []), ...history];

    // save the merged history to storage
    await setSpaceHistory(spaceId, mergedHistory);
  }

  logger.info('✅ Space history merged successfully');
};
