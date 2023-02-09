/**
 * @credits This function is taken from the andMix function, appearing in the Skyra project bot.
 * https://github.com/skyra-project/skyra/blob/v7/projects/bot/src/lib/util/common/comparators.ts#L79
 *
 * SPDX-License-Identifier: Apache-2.0
 */

type BooleanFn<T extends unknown[], R extends boolean = boolean> = (...args: T) => R;

export default function andMix<
  T extends unknown[],
  R extends boolean,
>(...fns: ReadonlyArray<BooleanFn<T, R>>): BooleanFn<T, R> {
  if (fns.length === 0)
    throw new Error('You must input at least one function.');

  return (...args) => {
    let ret!: R;
    for (const fn of fns) {
      ret = fn(...args);
      if (!ret)
        break;
    }

    return ret;
  };
}
