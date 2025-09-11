import React, { createContext, useState, FC, ReactNode, useContext } from "react";
import { WGContext } from "./WGContext";
import { AuthContext } from "./AuthContext";

export type TaskList = {
  id: number;
  title: string;
  description: string;
  date: string;
  is_checked: boolean;
  wg_id: number;
  users: { id: number; name: string }[];
  tasks: any[];
};

interface TaskListContextValue {
  taskLists: TaskList[];
  selectedTaskList: TaskList | null;
  loading: boolean;
  fetchTaskLists(): Promise<void>;
  selectTaskList(taskList: TaskList): void;
  createTaskList(title: string, description: string): Promise<void>;
  deleteTaskList(id: number): Promise<void>;
}

export const TaskListContext = createContext<TaskListContextValue>({} as TaskListContextValue);

export const TaskListProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedWG } = useContext(WGContext);
  const { user } = useContext(AuthContext);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [selectedTaskList, setSelectedTaskList] = useState<TaskList | null>(null);
  const [loading, setLoading] = useState(false);
  const API_URL = "http://localhost:7701";

  const fetchTaskLists = async () => {
    if (!user || !selectedWG) return;
    setLoading(true);
    const res = await fetch(`${API_URL}/wg/${selectedWG.id}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) throw new Error(data.message || "Failed to fetch task lists");
    setTaskLists(data.tasklists || []);
  };

  const selectTaskList = (taskList: TaskList) => setSelectedTaskList(taskList);

  const createTaskList = async (title: string, description: string) => {
    if (!user || !selectedWG) throw new Error("Not authenticated or WG not selected");
    setLoading(true);
    const res = await fetch(`${API_URL}/tasklist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({ title, description, wg_id: selectedWG.id }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) throw new Error(data.message || "Failed to create task list");
    await fetchTaskLists();
  };

  const deleteTaskList = async (id: number) => {
    if (!user) throw new Error("Not authenticated");
    setLoading(true);
    const res = await fetch(`${API_URL}/tasklist/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user.token}` },
    });
    setLoading(false);
    if (!res.ok) throw new Error("Failed to delete task list");
    await fetchTaskLists();
    setSelectedTaskList(null);
  };

  return (
    <TaskListContext.Provider
      value={{
        taskLists,
        selectedTaskList,
        loading,
        fetchTaskLists,
        selectTaskList,
        createTaskList,
        deleteTaskList,
      }}
    >
      {children}
    </TaskListContext.Provider>
  );
};