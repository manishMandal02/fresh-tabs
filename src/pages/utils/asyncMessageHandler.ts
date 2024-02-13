type Listener<T, Y> = (request: T, sender: chrome.runtime.MessageSender) => Promise<Y>;

const asyncMessageHandler =
  <T, Y>(listener: Listener<T, Y>) =>
  (request: T, sender: chrome.runtime.MessageSender, sendResponse) => {
    // the listener(...) might return a non-promise result (not an async function), so we wrap it with Promise.resolve()
    Promise.resolve(listener(request, sender)).then(sendResponse);
    // return true to indicate you want to send a response asynchronously
    return true;
  };

export { asyncMessageHandler };
