import { AlarmName } from '@root/src/constants/app';
import { logger } from '@root/src/pages/utils/logger';

// get  alarm by name from chrome alarms
export const getAlarm = async (name: AlarmName) => {
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
// create an alarm
export const createAlarm = async (name: AlarmName, triggerAt: number, isRecurring = false) => {
  let alarmOption: chrome.alarms.AlarmCreateInfo = { delayInMinutes: triggerAt };
  if (isRecurring) {
    alarmOption = { periodInMinutes: triggerAt };
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
export const deleteAlarm = async (name: AlarmName) => {
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
