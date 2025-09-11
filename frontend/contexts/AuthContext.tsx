import React, { createContext, useState, FC, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: number;
  username: string;
  email: string;
  token: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  register(username: string, email: string, password: string): Promise<void>;
  login(identifier: string, password: string): Promise<void>;
  logout(): void;
}

export const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = "http://localhost:7701";

  useEffect(() => {
    // Restore user from AsyncStorage on mount
    AsyncStorage.getItem("user").then((userStr) => {
      if (userStr) setUser(JSON.parse(userStr));
    });
  }, []);

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) throw new Error(data.message || "Registration failed");
    // Optionally, auto-login after registration
  };

  const login = async (identifier: string, password: string) => {
    setLoading(true);
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) throw new Error(data.message || "Login failed");
    // The backend only returns token, so you need to decode or store identifier/email
    const userObj = {
      id: 0, // You can fetch user info if needed
      username: identifier,
      email: identifier,
      token: data.token,
    };
    setUser(userObj);
    await AsyncStorage.setItem("user", JSON.stringify(userObj));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};