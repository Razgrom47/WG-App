import axios from "axios";

let api = axios.create({})

if (process.env.NODE_ENV === "development") {
    api = axios.create({
        baseURL: "http://127.0.0.1:7701",
        withCredentials: false,
    });
} else {
    api = axios.create({
        baseURL: "http://localhost/api",
        withCredentials: false,
    });
}



api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
