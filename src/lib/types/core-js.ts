/* eslint-disable @typescript-eslint/no-explicit-any */

export {};

type Resolver<T> = (item: T) => unknown;
type Indexer<T> = number | symbol | keyof T;
type ValueResolver<T> = Indexer<T> | Resolver<T>;

declare global {
  // Define the core-js "Array#uniqueBy" polyfill
  interface Array<T> {
    uniqueBy(valueResolver?: ValueResolver<T>): T[];
  }

  // Define the new core-js collection-methods polyfill
  interface Set<T> {
    addAll(...values: T[]): this;
    filter(predicate: (value: T, value2: T, set: Set<T>) => unknown, thisArg?: any): Set<T>;
    filter<S extends T>(predicate: (value: T, value2: T, set: Set<T>) => value is S, thisArg?: any): Set<S>;
    map<U>(callbackfn: (value: T, value2: T, set: Set<T>) => U, thisArg?: any): Set<U>;
    join(separator?: string): string;
  }
}
