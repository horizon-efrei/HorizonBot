export default async function promiseTimeout<T>(promise: Promise<T>, maxTime = 5000): Promise<void> {
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
