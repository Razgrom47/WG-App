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
      // NOTE: The backend logic in user.py now returns the updated user object AND a new token if username/email changed
      const res = await api.put("/user", formData);
      
      // The backend now returns a token on profile update if username/email changed
      if (res.data?.user) {
        setUser(res.data.user);
        // NEW: Check for and update the token
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
          setToken(res.data.token);
          // NEW: Re-configure Axios interceptor with the new token
          // This is crucial for subsequent requests.
          api.interceptors.request.use((config) => {
            const newToken = res.data.token; // Use the new token
            if (newToken) {
              config.headers.Authorization = `Bearer ${newToken}`;
            }
            return config;
          });
          console.log("Token refreshed after profile update."); // Log for debugging
        }
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
            // NEW: Redirect to user's strHomePage on initial load
            const homePath = res.data.user.strHomePage || "/"; // Default to root if not set
            // Check if we're on a non-auth page before redirecting
            if (window.location.pathname === '/login' || window.location.pathname === '/register' || window.location.pathname === '/splash') {
                 navigate(homePath, { replace: true });
            }
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
          // NEW: Redirect to user's strHomePage after successful login
          const homePath = userRes.data.user.strHomePage || "/"; // Default to root if not set
          navigate(homePath, { replace: true }); // Use replace to prevent back button from going to login
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
  
  const deleteAccount = async () => {
    try {
      await api.delete('/user');
      logout();
      return true;
    } catch (err) {
      console.error("Account deletion failed", err);
      return false;
    }
  }


  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);