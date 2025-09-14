import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use the baseURL from your api.js for consistency
  const baseURL = api.defaults.baseURL;

  // Validate token on app load by getting user info
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      // Use the api instance for validation, which automatically includes the token in headers
      api
        .get(`/user`) // CHANGED: Now using the /user endpoint for validation
        .then((res) => {
          if (res.data?.user) {
            setToken(storedToken);
            setUser(res.data.user);
          } else {
            // Token is invalid or user not found, remove it
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
          }
        })
        .catch(() => {
          // Validation failed (e.g., network error, 401 Unauthorized), remove token
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Login: Authenticates user and stores token
  const login = async (identifier, password) => {
    try {
      const res = await axios.post(`${baseURL}/login`, { identifier, password });

      if (res.data?.token) {
        const newToken = res.data.token;
        localStorage.setItem("token", newToken);
        setToken(newToken);
        
        // After successful login, immediately get the user's data to validate the new token
        const userRes = await api.get(`/user`); // CHANGED: Now using the /user endpoint
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

  // Register
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

  // Logout: Clears the token from state and localStorage
  const logout = async () => {
    try {
      if (token) {
        // This is a placeholder for a backend-side logout if needed
        await api.post(`/logout`, {});
      }
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
    }
  };

  const value = {
    token,
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
