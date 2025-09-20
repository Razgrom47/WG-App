import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.2.150:7701",
  withCredentials: false, // 🚫 do not send cookies
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;