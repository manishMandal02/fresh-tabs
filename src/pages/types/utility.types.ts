export type UnionTypeFromObjectValues<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => string ? ReturnType<T[K]> : T[K];
}[keyof T];
