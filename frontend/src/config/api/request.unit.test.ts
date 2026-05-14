import FormData from 'form-data';
import { describe, it, expect, vi } from 'vitest';

import type { OnCancel } from './CancelablePromise';
import * as requestModule from './request';
import { ApiError, type APIConfig, type ApiRequestOptions, type HttpMethod } from './types';

import type { AxiosInstance, AxiosResponse } from 'axios';

const validConfig: APIConfig = {
  BASE: 'http://api',
  VERSION: 'v1',
  WITH_CREDENTIALS: false,
  CREDENTIALS: 'omit',
};
const validOptions: ApiRequestOptions = {
  method: 'GET' as HttpMethod,
  url: '/foo',
};
const fullAxiosResponse = {
  data: 'data',
  status: 200,
  statusText: 'OK',
  headers: { foo: 'bar' },
  config: {},
} as unknown as AxiosResponse;

const onCancelMock = (() => {}) as unknown as OnCancel;

const makeAxiosMock = (
  request: ReturnType<typeof vi.fn> = vi.fn(),
): AxiosInstance =>
  ({
    request,
    CancelToken: { source: () => ({ token: 1, cancel: vi.fn() }) },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  }) as unknown as AxiosInstance;

describe('isDefined', () => {
  it('returns true for non-null/undefined', () => {
    expect(requestModule.isDefined(1)).toBe(true);
    expect(requestModule.isDefined('a')).toBe(true);
    expect(requestModule.isDefined({})).toBe(true);
  });
  it('returns false for null/undefined', () => {
    expect(requestModule.isDefined(null)).toBe(false);
    expect(requestModule.isDefined(undefined)).toBe(false);
  });
});

describe('isString', () => {
  it('returns true for strings', () => {
    expect(requestModule.isString('abc')).toBe(true);
  });
  it('returns false for non-strings', () => {
    expect(requestModule.isString(123)).toBe(false);
    expect(requestModule.isString({})).toBe(false);
  });
});

describe('isStringWithValue', () => {
  it('returns true for non-empty strings', () => {
    expect(requestModule.isStringWithValue('abc')).toBe(true);
  });
  it('returns false for empty string or non-string', () => {
    expect(requestModule.isStringWithValue('')).toBe(false);
    expect(requestModule.isStringWithValue(123)).toBe(false);
  });
});

describe('isBlob', () => {
  it('returns false for non-blob objects', () => {
    expect(requestModule.isBlob({})).toBe(false);
    expect(requestModule.isBlob('blob')).toBe(false);
  });
});

describe('isFormData', () => {
  it('returns true for FormData', () => {
    expect(requestModule.isFormData(new FormData())).toBe(true);
  });
  it('returns false for non-FormData', () => {
    expect(requestModule.isFormData({})).toBe(false);
  });
});

describe('isSuccess', () => {
  it('returns true for 2xx', () => {
    expect(requestModule.isSuccess(200)).toBe(true);
    expect(requestModule.isSuccess(299)).toBe(true);
  });
  it('returns false for non-2xx', () => {
    expect(requestModule.isSuccess(199)).toBe(false);
    expect(requestModule.isSuccess(300)).toBe(false);
  });
});

describe('base64', () => {
  it('encodes string to base64', () => {
    expect(requestModule.base64('abc')).toBe(Buffer.from('abc').toString('base64'));
  });
});

describe('getQueryString', () => {
  it('returns empty string for empty params', () => {
    expect(requestModule.getQueryString({})).toBe('');
  });
  it('returns query string for flat object', () => {
    expect(requestModule.getQueryString({ a: 1, b: 'x' })).toContain('a=1');
    expect(requestModule.getQueryString({ a: 1, b: 'x' })).toContain('b=x');
  });
  it('handles arrays and nested objects', () => {
    const qs = requestModule.getQueryString({ a: [1, 2], b: { c: 3 } });
    expect(qs).toContain('a=1');
    expect(qs).toContain('a=2');
    expect(qs).toContain('b%5Bc%5D=3');
  });
});

describe('getFormData', () => {
  it('returns undefined if no formData', () => {
    expect(requestModule.getFormData(validOptions)).toBeUndefined();
  });
  it('returns FormData if formData present', () => {
    const fd = requestModule.getFormData({ ...validOptions, formData: { a: 'b' } });
    expect(fd).toBeInstanceOf(FormData);
  });
});

describe('getFormData edge cases', () => {
  it('handles array values', () => {
    const fd = requestModule.getFormData({ ...validOptions, formData: { a: ['x', 'y'] } });
    expect(fd).toBeInstanceOf(FormData);
  });
  it('handles object values', () => {
    const fd = requestModule.getFormData({ ...validOptions, formData: { a: { b: 1 } } });
    expect(fd).toBeInstanceOf(FormData);
  });
});

describe('getHeaders edge cases', () => {
  it('adds Bearer token if present', async () => {
    const config = { ...validConfig, TOKEN: 'tok' };
    const headers = await requestModule.getHeaders(config, validOptions);
    expect(headers['Authorization']).toBe('Bearer tok');
  });
  it('adds Basic auth if username/password present', async () => {
    const config = { ...validConfig, USERNAME: 'u', PASSWORD: 'p' };
    const headers = await requestModule.getHeaders(config, validOptions);
    expect(headers['Authorization']).toContain('Basic');
  });
  it('sets Content-Type for mediaType', async () => {
    const options = { ...validOptions, body: 'x', mediaType: 'foo/bar' };
    const headers = await requestModule.getHeaders(validConfig, options);
    expect(headers['Content-Type']).toBe('foo/bar');
  });
  it('sets Content-Type for string body', async () => {
    const options = { ...validOptions, body: 'x' };
    const headers = await requestModule.getHeaders(validConfig, options);
    expect(headers['Content-Type']).toBe('text/plain');
  });
});

describe('sendRequest', () => {
  it('calls axiosClient.request and returns response', async () => {
    const axiosClient = makeAxiosMock(vi.fn().mockResolvedValue(fullAxiosResponse));
    const res = await requestModule.sendRequest(
      validConfig,
      validOptions,
      'url',
      undefined,
      undefined,
      {},
      onCancelMock,
      axiosClient,
    );
    expect(res).toBe(fullAxiosResponse);
  });
  it('returns error response if axios throws with response', async () => {
    const error = { response: fullAxiosResponse };
    const axiosClient = makeAxiosMock(vi.fn().mockRejectedValue(error));
    const res = await requestModule.sendRequest(
      validConfig,
      validOptions,
      'url',
      undefined,
      undefined,
      {},
      onCancelMock,
      axiosClient,
    );
    expect(res).toBe(fullAxiosResponse);
  });
  it('throws if axios throws without response', async () => {
    const axiosClient = makeAxiosMock(vi.fn().mockRejectedValue(new Error('fail')));
    await expect(
      requestModule.sendRequest(
        validConfig,
        validOptions,
        'url',
        undefined,
        undefined,
        {},
        onCancelMock,
        axiosClient,
      ),
    ).rejects.toThrow('fail');
  });
});

describe('request (CancelablePromise)', () => {
  it('resolves with response body', async () => {
    const axiosClient = makeAxiosMock(
      vi.fn().mockResolvedValue({ ...fullAxiosResponse, data: 'abc' }),
    );
    const p = requestModule.request(validConfig, validOptions, axiosClient);
    await expect(p).resolves.toBe('abc');
  });
  it('rejects on error', async () => {
    const axiosClient = makeAxiosMock(vi.fn().mockRejectedValue(new Error('fail')));
    const p = requestModule.request(validConfig, validOptions, axiosClient);
    await expect(p).rejects.toThrow('fail');
  });
  it('does not resolve if onCancel.isCancelled', async () => {
    const axiosClient = makeAxiosMock();
    const options = { ...validOptions };
    const CancelablePromise = Object.getPrototypeOf(requestModule.request).constructor;
    const orig = CancelablePromise.prototype.then;
    CancelablePromise.prototype.then = function (
      this: { cancel: () => void },
      onFulfilled: unknown,
      onRejected: unknown,
    ) {
      setTimeout(() => this.cancel(), 10);
      return orig.call(this, onFulfilled, onRejected);
    };
    const p = requestModule.request(validConfig, options, axiosClient);
    await expect(p).rejects.toThrow();
    CancelablePromise.prototype.then = orig;
  });
});

describe('private getUrl via request', () => {
  it('replaces {api-version} and path params', async () => {
    const config = { ...validConfig, VERSION: 'v2', BASE: 'http://b' };
    const options = { ...validOptions, url: '/foo/{id}/{api-version}', path: { id: 42 } };
    const axiosClient = makeAxiosMock(vi.fn().mockResolvedValue(fullAxiosResponse));
    await requestModule.request(config, options, axiosClient);
    expect(axiosClient.request).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'http://b/foo/42/v2' }),
    );
  });
  it('appends query string', async () => {
    const config = { ...validConfig };
    const options = { ...validOptions, url: '/foo', query: { a: 1 } };
    const axiosClient = makeAxiosMock(vi.fn().mockResolvedValue(fullAxiosResponse));
    await requestModule.request(config, options, axiosClient);
    expect(axiosClient.request).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining('?a=1') }),
    );
  });
});

describe('resolve', () => {
  it('resolves value if not function', async () => {
    expect(await requestModule.resolve(validOptions, 'x')).toBe('x');
  });
  it('resolves function if resolver is function', async () => {
    const fn = vi.fn().mockResolvedValue('y');
    expect(await requestModule.resolve(validOptions, fn)).toBe('y');
  });
});

describe('getHeaders', () => {
  it('returns headers with defaults', async () => {
    const config: APIConfig = { BASE: '', VERSION: '', WITH_CREDENTIALS: false, CREDENTIALS: 'omit' };
    const headers = await requestModule.getHeaders(config, validOptions);
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Accept']).toBe('application/json');
  });
});

describe('getRequestBody', () => {
  it('returns body if present', () => {
    expect(requestModule.getRequestBody({ ...validOptions, body: 123 })).toBe(123);
  });
  it('returns undefined if no body', () => {
    expect(requestModule.getRequestBody(validOptions)).toBeUndefined();
  });
});

describe('getResponseHeader', () => {
  it('returns header if present and string', () => {
    const res = { ...fullAxiosResponse, headers: { foo: 'bar' } } as unknown as AxiosResponse;
    expect(requestModule.getResponseHeader(res, 'foo')).toBe('bar');
  });
  it('returns undefined if not present', () => {
    const res = { ...fullAxiosResponse, headers: {} } as unknown as AxiosResponse;
    expect(requestModule.getResponseHeader(res, 'foo')).toBeUndefined();
  });
});

describe('getResponseBody', () => {
  it('returns data if status not 204', () => {
    const res = { ...fullAxiosResponse, status: 200, data: 123 } as unknown as AxiosResponse;
    expect(requestModule.getResponseBody(res)).toBe(123);
  });
  it('returns undefined if status 204', () => {
    const response = {
      ...fullAxiosResponse,
      data: undefined,
      status: 204,
      statusText: '',
      headers: {},
    } as unknown as AxiosResponse;
    expect(requestModule.getResponseBody(response)).toBeUndefined();
  });
});

describe('catchErrorCodes', () => {
  it('throws ApiError for known error code', () => {
    const result = { status: 400, ok: false, url: '', statusText: '', body: '' };
    expect(() => requestModule.catchErrorCodes(validOptions, result)).toThrow(ApiError);
  });
  it('throws ApiError for unknown error', () => {
    const result = { status: 418, ok: false, url: '', statusText: '', body: '' };
    expect(() => requestModule.catchErrorCodes(validOptions, result)).toThrow(ApiError);
  });
  it('does not throw if ok and no error', () => {
    const result = { status: 200, ok: true, url: '', statusText: '', body: '' };
    expect(() => requestModule.catchErrorCodes(validOptions, result)).not.toThrow();
  });
});
