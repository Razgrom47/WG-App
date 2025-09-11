import React, { createContext, useState, FC, ReactNode, useContext } from "react";
import { AuthContext } from "./AuthContext";

export type WG = {
  id: number;
  title: string;
  address: string;
  etage: string;
  description: string;
  creator: { id: number; name: string };
  users: { id: number; name: string }[];
  admins: { id: number; name: string }[];
  tasklists: { id: number; title: string }[];
  shoppinglists: { id: number; title: string }[];
  budgetplannings: { id: number; title: string }[];
};

interface WGContextValue {
  wgs: WG[];
  selectedWG: WG | null;
  loading: boolean;
  fetchWGs(): Promise<void>;
  createWG(title: string, address?: string, etage?: string, description?: string): Promise<void>;
  deleteWG(id: number): Promise<void>;
  selectWG(wg: WG): void;
  joinWG(code: string): Promise<void>;
  inviteUser(wgId: number, userId: number): Promise<void>;
  kickUser(wgId: number, userId: number): Promise<void>;
  makeAdmin(wgId: number, userId: number): Promise<void>;
}

export const WGContext = createContext<WGContextValue>({} as WGContextValue);

export const WGProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [wgs, setWGs] = useState<WG[]>([]);
  const [selectedWG, setSelectedWG] = useState<WG | null>(null);
  const [loading, setLoading] = useState(false);
  const API_URL = "http://localhost:7701";

  const fetchWGs = async () => {
    if (!user) return;
    setLoading(true);
    const res = await fetch(`${API_URL}/wg/my`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) throw new Error(data.message || "Failed to fetch WGs");
    setWGs(data);
  };

  const createWG = async (title: string, address = "", etage = "", description = "") => {
    if (!user) throw new Error("Not authenticated");
    setLoading(true);
    const res = await fetch(`${API_URL}/wg`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({ title, address, etage, description }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) throw new Error(data.message || "Failed to create WG");
    await fetchWGs();
  };

  const deleteWG = async (id: number) => {
    if (!user) throw new Error("Not authenticated");
    setLoading(true);
    const res = await fetch(`${API_URL}/wg/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user.token}` },
    });
    setLoading(false);
    if (!res.ok) throw new Error("Failed to delete WG");
    await fetchWGs();
    setSelectedWG(null);
  };

  const selectWG = (wg: WG) => setSelectedWG(wg);

  // For joining by code, you need a backend endpoint (not shown in your backend).
  // Here is a placeholder:
  const joinWG = async (code: string) => {
    // Implement your join logic here, e.g. POST /wg/join
    // For now, just refetch WGs
    await fetchWGs();
  };

  const inviteUser = async (wgId: number, userId: number) => {
    if (!user) throw new Error("Not authenticated");
    await fetch(`${API_URL}/wg/${wgId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ user_id: userId }),
    });
    await fetchWGs();
  };

  const kickUser = async (wgId: number, userId: number) => {
    if (!user) throw new Error("Not authenticated");
    await fetch(`${API_URL}/wg/${wgId}/kick`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ user_id: userId }),
    });
    await fetchWGs();
  };

  const makeAdmin = async (wgId: number, userId: number) => {
    if (!user) throw new Error("Not authenticated");
    await fetch(`${API_URL}/wg/${wgId}/make_admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ user_id: userId }),
    });
    await fetchWGs();
  };

  return (
    <WGContext.Provider
      value={{
        wgs,
        selectedWG,
        loading,
        fetchWGs,
        createWG,
        deleteWG,
        selectWG,
        joinWG,
        inviteUser,
        kickUser,
        makeAdmin,
      }}
    >
      {children}
    </WGContext.Provider>
  );
};