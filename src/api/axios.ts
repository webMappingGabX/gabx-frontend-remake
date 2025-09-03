import axios from "axios";
import { getCookie } from "../utils/tools";

export default axios.create({
   baseURL: "http://localhost:5055/api/v1"
})

// Axios interceptor to ensure access token is always valid for refreshRoute

// This assumes you have a refresh token endpoint at /auth/refresh and store tokens in cookies or localStorage.
// Adjust as needed for your actual token storage and refresh logic.

let isRefreshing = false;
let failedQueue : any = [];

function processQueue(error, token = null) {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
}

const refreshRoute = "/auth/refresh";

axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If 401 and not already trying to refresh
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.endsWith(refreshRoute)
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue the request until token is refreshed
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            // Attach new token and retry
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return axios(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      // Get refresh token from storage (adjust as needed)
      const refreshToken = localStorage.getItem("refreshToken");
      //const refreshToken = getCookie("refreshToken");
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        // Call refresh endpoint
        const res = await axios.post(refreshRoute, { refreshToken: refreshToken });
        const newAccessToken = res.data.accessToken;

        // Store new access token (adjust as needed)
        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("refreshToken", res.data.refreshToken);

        processQueue(null, newAccessToken);

        // Retry original request with new token
        originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
        return axios(originalRequest);
      } catch (err) {
        processQueue(err, null);
        // Optionally, redirect to login or handle logout here
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Optionally, set the Authorization header for all requests if token exists
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = "Bearer " + token;
    }
    return config;
  },
  error => Promise.reject(error)
);
