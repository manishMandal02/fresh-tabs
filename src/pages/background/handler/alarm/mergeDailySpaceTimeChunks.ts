import { StorageKey } from '@root/src/constants/app';
import { IDailySpaceTime, IDailySpaceTimeChunks } from '@root/src/types/global.types';
import { logger } from '@root/src/utils';
import { getISODate } from '@root/src/utils/date-time/getISODate';
import { getDailySpaceTime, setDailySpaceTime } from '@root/src/services/chrome-storage/space-analytics';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';

// daily midnight alarm: merge daily time spent in spaces data
export const handleMergeDailySpaceTimeChunksAlarm = async () => {
  try {
    const dailySpaceTimeChunks = await getDailySpaceTime<IDailySpaceTimeChunks[]>(null);

    if (dailySpaceTimeChunks.length < 1) return;

    const spaces = await getAllSpaces();

    const today = new Date();

    today.setDate(today.getDate() - 1);

    // filter chunks by space and calculate minutes spent from chunks
    let chunksBySpace: { spaceId: string; minutes: number }[] = spaces.map(space => ({
      spaceId: space.id,
      minutes: 0,
    }));

    for (let i = 0; i < dailySpaceTimeChunks.length; i++) {
      const currentChunk = dailySpaceTimeChunks[i];

      if (!currentChunk.spaceId || !currentChunk?.time) continue;

      // calculate time spend
      // find the time difference  between window focused & unfocused milliseconds
      //  divide it by 1000 to get seconds and then divide it by 60 to get minutes
      const minutesSpent = (dailySpaceTimeChunks[i + 1]?.time - currentChunk.time) / 1000 / 60;

      chunksBySpace.find(space => space.spaceId === currentChunk.spaceId).minutes += minutesSpent;
    }

    // remove space with no time spent
    chunksBySpace = chunksBySpace.filter(chunk => Math.round(chunk.minutes) > 0);

    const setDailySpaceTimePromises = [];

    for (const space of chunksBySpace) {
      const { spaceId, minutes } = space;
      const dailySpaceTime: IDailySpaceTime = {
        date: getISODate(today),
        minutes: Math.round(minutes),
      };

      const dailySpaceTimeAll = await getDailySpaceTime<IDailySpaceTime[]>(spaceId);

      // check if today's time usage is set already
      if (dailySpaceTimeAll?.length > 0 && dailySpaceTimeAll.some(time => getISODate(time.date) === getISODate(today)))
        continue;

      setDailySpaceTimePromises.push(setDailySpaceTime(spaceId, [...(dailySpaceTimeAll || []), dailySpaceTime]));
    }

    setDailySpaceTimePromises.length > 0 && (await Promise.all(setDailySpaceTimePromises));

    // clear todays space time data
    await chrome.storage.local.remove(StorageKey.DAILY_SPACE_TIME_CHUNKS);
  } catch (error) {
    logger.error({
      error,
      msg: 'Error in handleMergeDailySpaceTimeChunksAlarm',
      fileTrace: 'pages/background/handler/alarm/handleMergeDailySpaceTimeChunksAlarm.ts:60 ~ catch block',
    });
  }
};
