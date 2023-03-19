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
    deleteAll(...values: T[]): this;
    every<S extends T>(predicate: (value: T, _: T, set: Set<T>) => value is S, thisArg?: any): this is Set<S>;
    every(predicate: (value: T, _: T, set: Set<T>) => unknown, thisArg?: any): boolean;
    filter<S extends T>(predicate: (value: T, _: T, set: Set<T>) => value is S, thisArg?: any): Set<S>;
    filter(predicate: (value: T, _: T, set: Set<T>) => unknown, thisArg?: any): Set<T>;
    find<S extends T>(predicate: (this: void, value: T, _: T, set: Set<T>) => value is S, thisArg?: any): S | undefined;
    find(predicate: (value: T, _: T, set: Set<T>) => unknown, thisArg?: any): T | undefined;
    join(separator?: string): string;
    map<U>(callbackfn: (value: T, _: T, set: Set<T>) => U, thisArg?: any): Set<U>;
    reduce(callbackfn: (previousValue: T, currentValue: T, _: T, set: Set<T>) => T, initialValue: T): T;
    reduce(callbackfn: (previousValue: T, currentValue: T, _: T, set: Set<T>) => T): T;
    reduce<U>(callbackfn: (previousValue: U, currentValue: T, _: T, set: Set<T>) => U, initialValue: U): U;
    some(predicate: (value: T, _: T, set: Set<T>) => unknown, thisArg?: any): boolean;
  }

  // Define the new core-js map-upsert polyfill
  interface Map<K, V> {
    emplace(key: K, handlers: {
      insert?(key: K, map: Map<K, V>): V;
      update?(existing: V, key: K, map: Map<K, V>): V;
    }): V;
  }

  // Define the new core-js iterator-helpers polyfill
  interface Iterator<T> {
    map<U>(callbackfn: (value: T, index: number) => U): Iterator<U>;
    filter<S extends T>(predicate: (value: T, index: number) => value is S): Iterator<S>;
    filter(predicate: (value: T, index: number) => unknown): Iterator<T>;
    take(limit: number): Iterator<T>;
    drop(limit: number): Iterator<T>;
    flatMap<U>(callbackfn: (value: T, index: number) => U): Iterator<U>;
    reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number) => T, initialValue?: T): T;
    reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number) => U, initialValue: U): U;
    toArray(): T[];
    forEach(callbackfn: (value: T, index: number) => void): void;
    every<S extends T>(predicate: (value: T, index: number) => value is S): this is Iterator<S>;
    every(predicate: (value: T, index: number) => unknown): boolean;
    some(predicate: (value: T, index: number) => unknown): boolean;
    find<S extends T>(predicate: (this: void, value: T, index: number) => value is S): S | undefined;
    find(predicate: (value: T, index: number) => unknown): T | undefined;
    from(iteratorLike: Iterable<T>): Iterator<T>;
  }

  interface IterableIterator<T> {
    map<U>(callbackfn: (value: T, index: number) => U): IterableIterator<U>;
    filter<S extends T>(predicate: (value: T, index: number) => value is S): IterableIterator<S>;
    filter(predicate: (value: T, index: number) => unknown): IterableIterator<T>;
    take(limit: number): IterableIterator<T>;
    drop(limit: number): IterableIterator<T>;
    flatMap<U>(callbackfn: (value: T, index: number) => U): IterableIterator<U>;
    reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number) => T, initialValue?: T): T;
    reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number) => U, initialValue: U): U;
    toArray(): T[];
    forEach(callbackfn: (value: T, index: number) => void): void;
    every<S extends T>(predicate: (value: T, index: number) => value is S): this is IterableIterator<S>;
    every(predicate: (value: T, index: number) => unknown): boolean;
    some(predicate: (value: T, index: number) => unknown): boolean;
    find<S extends T>(predicate: (this: void, value: T, index: number) => value is S): S | undefined;
    find(predicate: (value: T, index: number) => unknown): T | undefined;
    from(iteratorLike: Iterable<T>): IterableIterator<T>;
  }
}
