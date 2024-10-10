import axios, { AxiosRequestConfig } from "axios";
import { message } from "antd";

export const request = function (config: AxiosRequestConfig) {
  return axios({
    ...config,
    baseURL: "/api/",
    headers: {
      Authorization: localStorage.getItem("token") || "",
      ...config.headers,
    },
  })
    .then((res) => {
      if (res.status !== 200) {
        message.error("网络错误");
        return;
      }
      if (res.data.code === 401) {
        message.error("登录过期，请重新登录");
        localStorage.removeItem("token");
        const { origin, pathname } = window.location;
        const path = pathname.split("/")[1];
        window.location.replace(`${origin}/${path}/login`);
      } else if (res.data.code !== 200) {
        message.error(res.data.message);
      }
      const userId = res.headers["user-id"];
      if (userId) {
        localStorage.setItem("userId", userId);
      }
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      message.error("网络错误");
    });
};
