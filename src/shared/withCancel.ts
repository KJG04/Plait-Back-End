function withCancel<T>(
  asyncIterator: AsyncIterator<T | undefined>,
  onCancel: () => void,
): AsyncIterator<T | undefined> {
  return {
    ...asyncIterator,
    async return() {
      await onCancel();
      return asyncIterator.return
        ? asyncIterator.return()
        : Promise.resolve({ value: undefined, done: true });
    },
  };
}

export default withCancel;
