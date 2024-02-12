export const debounce = (mainFunction: () => Promise<void>, delay = 300) => {
  let timer;

  // Return an anonymous function that takes in any number of arguments
  return function () {
    // Clear the previous timer to prevent the execution of 'mainFunction'
    clearTimeout(timer);

    // Set a new timer that will execute 'mainFunction' after the specified delay
    timer = setTimeout(() => {
      mainFunction();
    }, delay);
  };
};
