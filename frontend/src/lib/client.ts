import { accessTokenAtom } from "@/stores/access-token";
import { getAccessTokenFnAtom } from "@/stores/auth";
import store from "@/stores/store";
import axios from "axios";

const httpClient = axios.create({
  baseURL: "http://localhost:3000",
});

httpClient.interceptors.request.use((request) => {
  const token = store.get(accessTokenAtom);

  if (token) {
    request.headers["Authorization"] = `Bearer ${token}`;
  }

  return request;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const refresher = store.get(getAccessTokenFnAtom);
    const originalRequest = error.config;
    if (error.response.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (refresher) {
        const access_token = await refresher();
        axios.defaults.headers.common["Authorization"] =
          "Bearer " + access_token;
        return httpClient(originalRequest);
      }
    }
    return Promise.reject(error);
  },
);

export default httpClient;
