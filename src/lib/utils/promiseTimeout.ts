/**
 * Runs a promise, but abort it if it takes too long.
 * @param promise The promise to resolve
 * @param maxTime The maximum time for the promise to resolve
 */
export async function promiseTimeout<T>(promise: Promise<T>, maxTime = 5000): Promise<void> {
  const maxTimeP = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Max time exceeded'));
    }, maxTime);
  });

  await Promise.race([promise, maxTimeP])
    .catch((error) => {
      throw error;
    });
}
