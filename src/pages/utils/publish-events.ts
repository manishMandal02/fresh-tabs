import { IMessageEvent } from '../types/global.types';
import { logger } from './logger';

// used to send message to side panel to update ui, if side panel is open
export const publishEvents = async (event: IMessageEvent): Promise<boolean> => {
  try {
    await chrome.runtime.sendMessage(event);

    return true;
  } catch (error) {
    // if errored because of the side-panel not opened then do nothing
    if (error instanceof Error && error.message.includes('Receiving end does not exist.')) return;

    logger.error({
      error,
      msg: 'Failed to send message to side panel',
      fileTrace: 'src/pages/background/index.ts:108 ~ sendMessageSidePanel() ~ catch block',
    });
    return false;
  }
};
