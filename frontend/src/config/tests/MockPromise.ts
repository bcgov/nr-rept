import { CancelablePromise } from '@/config/api/CancelablePromise';

// A mock version of CancelablePromise for use in tests.
// Always resolves with the provided content, supports cancel() API.
export class MockPromise<T> extends CancelablePromise<T> {
  constructor(content: T) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    super((resolve, _reject, _onCancel) => {
      // Always resolve immediately with the provided content
      setTimeout(() => resolve(content), 200);
    });
  }
}
