import { nanoid } from 'nanoid';
// generate random id
const generateId = () => {
  return nanoid(8);
};

export { generateId };
