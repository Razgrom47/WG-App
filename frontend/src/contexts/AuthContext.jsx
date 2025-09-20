import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const baseURL = api.defaults.baseURL;

  // Function to handle profile updates and new token from the backend
  const updateUser = async (formData) => {
    try {
      const res = await api.put("/user", formData);
      if (res.data?.token && res.data?.user) {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Update failed", err);
      throw err;
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      api
        .get(`/user`)
        .then((res) => {
          if (res.data?.user) {
            setToken(storedToken);
            setUser(res.data.user);
          } else {
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
            navigate("/login");
          }
        })
        .catch(() => {
          // API call failed (e.g., network error or 401/403)
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
          navigate("/login");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const login = async (identifier, password) => {
    try {
      const res = await axios.post(
        `${baseURL}/login`,
        { identifier, password },
        { headers: { "Content-Type": "application/json" } }
      );
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        const userRes = await api.get(`/user`);
        if (userRes.data?.user) {
          setUser(userRes.data.user);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("Login failed", err);
      return false;
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await axios.post(
        `${baseURL}/register`,
        { username, email, password },
        { headers: { "Content-Type": "application/json" } }
      );
      return res.status === 201;
    } catch (err) {
      console.error("Registration failed", err);
      return err.response?.data?.message || "Registration failed.";
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post(`/logout`, {});
      }
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);