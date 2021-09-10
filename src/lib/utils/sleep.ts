/**
 * Waits a given amount of time.
 * @param ms The number of milliseconds to wait
 */
export default async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
