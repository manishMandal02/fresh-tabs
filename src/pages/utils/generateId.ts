// generate random id
const generateId = () => {
  return Math.floor(Math.random() * Date.now()).toString(16);
};

export { generateId };
