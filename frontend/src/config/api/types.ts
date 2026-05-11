import axios from 'axios';

import { request } from './request';

import type { CancelablePromise } from './CancelablePromise';
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

export type ApiMiddleware = {
  request?: (
    config: InternalAxiosRequestConfig<unknown>,
  ) => Promise<InternalAxiosRequestConfig<unknown>>;
  response?: (
    response: AxiosResponse<unknown, unknown>,
  ) => Promise<AxiosResponse<unknown, unknown>>;
  failure?: (error: AxiosError<unknown>) => Promise<unknown>;
};

export type HttpMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'PATCH';

export type ApiRequestOptions = {
  readonly method: HttpMethod;
  readonly url: string;
  readonly path?: Record<string, unknown>;
  readonly cookies?: Record<string, unknown>;
  readonly headers?: Record<string, unknown>;
  readonly query?: Record<string, unknown>;
  readonly formData?: Record<string, unknown>;
  readonly body?: unknown;
  readonly mediaType?: string;
  readonly responseHeader?: string;
  readonly errors?: Record<number, string>;
  readonly middleware?: Array<ApiMiddleware>;
  readonly meta?: Record<string, unknown>;
};

export type ApiResult = {
  readonly url: string;
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly body: unknown;
};

export class ApiError extends Error {
  public readonly url: string;
  public readonly status: number;
  public readonly statusText: string;
  public readonly body: unknown;
  public readonly request: ApiRequestOptions;

  constructor(request: ApiRequestOptions, response: ApiResult, message: string) {
    super(message);

    this.name = 'ApiError';
    this.url = response.url;
    this.status = response.status;
    this.statusText = response.statusText;
    this.body = response.body;
    this.request = request;
  }
}

type Resolver<T> = (options: ApiRequestOptions) => Promise<T>;
type Headers = Record<string, string>;

export type APIConfig = {
  BASE: string;
  VERSION: string;
  WITH_CREDENTIALS: boolean;
  CREDENTIALS: 'include' | 'omit' | 'same-origin';
  TOKEN?: string | Resolver<string> | undefined;
  USERNAME?: string | Resolver<string> | undefined;
  PASSWORD?: string | Resolver<string> | undefined;
  HEADERS?: Headers | Resolver<Headers> | undefined;
  ENCODE_PATH?: ((path: string) => string) | undefined;
  TIMEOUT?: number;
  ADAPTER?: AxiosRequestConfig['adapter'];
};

export class HttpClient {
  axiosInstance: AxiosInstance;
  constructor(readonly config: APIConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.BASE,
      timeout: config.TIMEOUT || 60000, // Default timeout of 60 seconds
      headers: {
        'Content-Type': 'application/json',
        ...config.HEADERS,
      },
    });
  }

  protected doRequest = <T>(config: APIConfig, options: ApiRequestOptions): CancelablePromise<T> =>
    request<T>(config, options, this.axiosInstance);
}
