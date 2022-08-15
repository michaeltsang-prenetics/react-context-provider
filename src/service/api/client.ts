import axios, { AxiosRequestConfig } from 'axios';

export type UriParams = Record<string, string>;
export const AuthHeader = (token: string) => {
    return { Authorization: `Bearer ${token}` };
};
export type ErrorHandler = (error: unknown, config?: AxiosRequestConfig) => void;

// axios.defaults.baseURL = getEnvironment.baseUrl;

const replaceUriParams = (obj: Record<string, string>, url: string) => {
    let updatedUrl = url;
    Object.entries(obj).forEach(([key, value]) => {
        updatedUrl = updatedUrl.replace(`:${key}`, value.toString());
    });
    return updatedUrl;
};

export const request = (config: AxiosRequestConfig, errorHandler: ErrorHandler, uriParams: UriParams = {}) => {
    let url = config.url;
    if (url) url = replaceUriParams(uriParams, url);

    const options = { ...config, url: url };

    return axios(options).catch(error => errorHandler(error, config));
};
