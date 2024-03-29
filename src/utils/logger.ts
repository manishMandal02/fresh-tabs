type ErrorLoggerParams = {
  msg: string;
  error: Error;
  fileTrace?: string;
};

export const logger = {
  /**
   * Global INFO logger for background script
   * @param msg log message
   * @param fileTrace file trace of the log
   */
  info: (msg: string) => {
    // log error
    console.log(`FreshTabs:LOGGER:INFO ℹ️ ~ ${msg}`);
  },

  /**
   * Global INFO error for background script
   * @param msg log message
   * @param fileTrace file trace of the log
   * @param error error object
   */
  error: ({ msg, fileTrace, error }: ErrorLoggerParams) => {
    // log error
    console.log(`FreshTabs:LOGGER:ERROR ❌ ~ ${msg}  \n  ${fileTrace ? `📁 File: ${fileTrace}` : ''} \n`, error);
  },
};
