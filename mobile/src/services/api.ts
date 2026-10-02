import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = axios.create({
  baseURL: "https://streetfoodplatform-1.onrender.com/api",
  timeout: 15000,
});

API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("customerToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;