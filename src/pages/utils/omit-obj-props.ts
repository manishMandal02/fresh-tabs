// TODO - remove - not used currently
// returns a new object with removed properties
export const omitObjProps = <T = Record<string, unknown>>(obj: T, ...keys: [keyof T]): T => {
  // @ts-expect-error: Argument of type string is not assignable to parameter of type keyof T
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
};
