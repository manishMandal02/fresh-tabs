import { IMessageEventSidePanel, IMessageEventContentScript } from '../types/global.types';
import { logger } from './logger';

// used to send message to side panel to update ui, if side panel is open
export const publishEvents = async <T = boolean>(
  event: IMessageEventSidePanel | IMessageEventContentScript,
): Promise<T> => {
  try {
    const res = await chrome.runtime.sendMessage(event);

    return res;
  } catch (error) {
    // if errored because of the side-panel not opened then do nothing
    logger.error({
      error,
      msg: 'Failed to send message to side panel',
      fileTrace: 'src/pages/background/index.ts:17 ~ publishEvents() ~ catch block',
    });
    return false as T;
  }
};

export const publishEventsTab = async (tabId: number, event: IMessageEventContentScript) => {
  try {
    await chrome.tabs.sendMessage(tabId, event);
    return true;
  } catch (error) {
    logger.error({
      error,
      msg: 'Failed to send message to active tab',
      fileTrace: 'src/pages/background/index.ts:31 ~ publishEventsTab() ~ catch block',
    });
  }
  return false;
};
