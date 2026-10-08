import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = axios.create({
  baseURL: "https://streetfoodplatform-1.onrender.com/api",
  timeout: 20000,

  // IMPORTANT:
  // React Native ko server response JSON ke form me chahiye
  responseType: "json",

  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(
        "customerToken"
      );

      console.log(
        "🔐 Customer token:",
        token ? "FOUND" : "NOT FOUND"
      );

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      console.log(
        "❌ TOKEN ERROR:",
        error
      );

      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    console.log(
      "🌐 API:",
      response.config?.url,
      "STATUS:",
      response.status
    );

    return response;
  },
  (error) => {
    console.log(
      "❌ API ERROR:",
      error?.config?.url
    );

    console.log(
      "❌ STATUS:",
      error?.response?.status
    );

    console.log(
      "❌ DATA:",
      error?.response?.data
    );

    return Promise.reject(error);
  }
);

export default API;