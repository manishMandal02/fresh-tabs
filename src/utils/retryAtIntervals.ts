import { logger } from './logger';
import { wait } from './wait';

interface RetryAtIntervalParams<T> {
  retries: number;
  interval: number;
  callback: (() => Promise<T>) | (() => T);
}

// retry a logic for certain interval with certain number of retries until it succeeds
export const retryAtIntervals = async <T>({ retries, interval, callback }: RetryAtIntervalParams<T>) => {
  let retry = 0;

  let success = false;

  while (retry < retries) {
    try {
      const callbackSuccess = await callback();

      // stop the loop, if the callback is successful
      if (callbackSuccess) {
        success = true;
        break;
      }
    } catch (error) {
      logger.error({
        error,
        msg: `error in retryAtIntervals for ${callback}`,
        fileTrace: 'src/pages/utils/retryAtIntervals.ts:30 ~ retryAtIntervals() ~ catch block',
      });
      continue;
    } finally {
      // wait and then retry again
      await wait(interval);
      retry++;
    }
  }
  return success;
};
