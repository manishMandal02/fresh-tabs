import { IDailySpaceTime, IDailySpaceTimeChunks } from '@root/src/pages/types/global.types';
import { logger } from '@root/src/pages/utils';
import { getDailySpaceTime, setDailySpaceTime } from '@root/src/services/chrome-storage/space-analytics';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';

// daily midnight alarm: merge daily time spent in spaces data
export const handleMergeDailySpaceTimeChunksAlarm = async () => {
  try {
    const dailySpaceTimeChunks = await getDailySpaceTime<IDailySpaceTimeChunks[]>(null);

    const spaces = await getAllSpaces();

    const now = new Date();

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
      const minutesSpent = (dailySpaceTimeChunks[i + 1].time - currentChunk.time) / 1000 / 60;

      chunksBySpace.find(space => space.spaceId === currentChunk.spaceId).minutes += minutesSpent;

      i++;
    }

    // remove space with no time spent
    chunksBySpace = chunksBySpace.filter(chunk => chunk.minutes > 0);

    const setDailySpaceTimePromises = [];

    for (const space of chunksBySpace) {
      const { spaceId, minutes } = space;
      const dailySpaceTime: IDailySpaceTime = {
        date: now,
        minutes: Math.round(minutes),
      };

      console.log('🚀 ~ handleMergeDailySpaceTimeChunksAlarm ~ dailySpaceTime:', dailySpaceTime);

      return;

      const dailySpaceTimeAll = await getDailySpaceTime(spaceId);
      setDailySpaceTimePromises.push(setDailySpaceTime(spaceId, [...(dailySpaceTimeAll || []), dailySpaceTime]));
    }
  } catch (error) {
    logger.error({
      error,
      msg: 'Error in handleMergeDailySpaceTimeChunksAlarm',
      fileTrace: 'pages/background/handler/alarm/handleMergeDailySpaceTimeChunksAlarm.ts:60 ~ catch block',
    });
  }
};
