import { AlarmName } from '@root/src/constants/app';
import { UnionTypeFromObjectValues } from '@root/src/pages/types/utility.types';
import { naturalLanguageToDate } from '@root/src/pages/utils/date-time/naturalLanguageToDate';
import { logger } from '@root/src/pages/utils/logger';

type AlarmNameType = UnionTypeFromObjectValues<typeof AlarmName>;

const getMinutesToMidnight = () => {
  const midnight = naturalLanguageToDate('midnight');

  return (midnight - Date.now()) / 1000 / 60;
};

// get  alarm by name from chrome alarms
export const getAlarm = async (name: AlarmNameType) => {
  try {
    const alarm = await chrome.alarms.get(name);
    return alarm;
  } catch (error) {
    logger.error({
      error,
      msg: `Error getting  chrome.alarm: ${name}`,
      fileTrace: 'src/services/chrome-alarm/alarm.ts:13 ~ getAlarm() ~ catch block',
    });
    return null;
  }
};

type CreateAlarmProps = {
  name: AlarmNameType;
  triggerAfter: number;
  isRecurring?: boolean;
  shouldTriggerAtMidnight?: boolean;
};

// create an alarm
export const createAlarm = async ({
  name,
  triggerAfter,
  isRecurring = false,
  shouldTriggerAtMidnight = false,
}: CreateAlarmProps) => {
  // some recurring alarms like merge space history should trigger at midnight everyday
  // the delay in minutes set the time for first trigger then period in minutes runs this alarm after every 24hrs
  const delayInMinutes = !shouldTriggerAtMidnight ? triggerAfter : getMinutesToMidnight();

  const alarmOption: chrome.alarms.AlarmCreateInfo = { delayInMinutes };
  if (isRecurring) {
    alarmOption.periodInMinutes = triggerAfter;
  }

  try {
    await chrome.alarms.create(name, alarmOption);
    return true;
  } catch (error) {
    logger.error({
      error,
      msg: `Error creating alarm: ${name}`,
      fileTrace: 'src/services/chrome-alarm/alarm.ts:26 ~ createAlarm() ~ catch block',
    });
    return false;
  }
};

// delete alarm
export const deleteAlarm = async (name: AlarmNameType) => {
  try {
    return await chrome.alarms.clear(name);
  } catch (error) {
    logger.error({
      error,
      msg: `Error deleting alarm: ${name}`,
      fileTrace: 'src/services/chrome-alarm/alarm.ts:46 ~ deleteAlarm() ~ catch block',
    });
    return false;
  }
};
