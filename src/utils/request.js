import axios from "axios";
import Config from "@/config";

// 创建axios实例
const service = axios.create({
    // baseURL: "http://192.168.199.43:8000", // api 的 base_url
    // baseURL: "/", // api 的 base_url
    baseURL: process.env.BASE_API, // api 的 base_url
    timeout: Config.timeout // 请求超时时间
});

// request拦截器
service.interceptors.request.use(
    config => {
        config.headers["Content-Type"] = "application/json";
        return config;
    },
    error => {
        // Do something with request error
        console.log(error); // for debug
        Promise.reject(error);
    }
);

// response 拦截器
service.interceptors.response.use(
    response => {
        // console.log(response)

        const code = response.status;
        if (code < 200 || code > 300) {
            Notify(response.message);

            return Promise.reject("error");
        } else {
            return response.data;
        }
    },
    error => {
        let code = 0;
        try {
            code = error.response.data.status;
        } catch (e) {
            if (error.toString().indexOf("Error: timeout") !== -1) {
                Notify("网络请求超时");

                return Promise.reject(error);
            }
            if (error.toString().indexOf("Error: Network Error") !== -1) {
                Notify("网络请求超时");

                return Promise.reject(error);
            }
        }
        if (code === 401) {
            Notify("登录状态已过期，您可以继续留在该页面，或者重新登录");
        } else if (code === 403) {
            Notify("error");
        } else {
            const errorMsg = error.response.data.message;
            if (errorMsg !== undefined) {
                Notify(errorMsg);
            }
        }
        return Promise.reject(error);
    }
);
export default service;
