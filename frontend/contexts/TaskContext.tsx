import React, {
  createContext,
  FC,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import { z } from "zod";
import { TaskListContext } from "./TaskListContext";
import { AuthContext } from "./AuthContext";

const API_URL = "http://localhost:7701";

const TaskDBSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  is_done: z.boolean(),
  is_template: z.boolean(),
  tasklist_id: z.number(),
  users: z.array(z.object({ id: z.number(), name: z.string() })),
});
type RawTask = z.infer<typeof TaskDBSchema>;

export type Task = {
  id: number;
  title: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  isDone: boolean;
  isTemplate: boolean;
  tasklistId: number;
  users: { id: number; name: string }[];
};

export interface TaskContextValue {
  user: { id: number; username: string; email: string; token: string } | null;
  tasks: Task[];
  loading: boolean;
  addTask(
    title: string,
    description: string,
    startDate: Date | null,
    endDate: Date | null,
    userIds: number[]
  ): Promise<void>;
  toggleTask(id: number): Promise<void>;
  deleteTask(id: number): Promise<void>;
  fetchTasks(): Promise<void>;
}

export const TaskContext = createContext<TaskContextValue>(
  {} as TaskContextValue,
);

function parseTask(raw: RawTask): Task {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    startDate: raw.start_date ? new Date(raw.start_date) : null,
    endDate: raw.end_date ? new Date(raw.end_date) : null,
    isDone: raw.is_done,
    isTemplate: raw.is_template,
    tasklistId: raw.tasklist_id,
    users: raw.users,
  };
}

export const TaskProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { selectedTaskList } = useContext(TaskListContext);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchTasks = useCallback(async () => {
    if (!user || !selectedTaskList) return;
    setLoading(true);
    const res = await fetch(`${API_URL}/tasklist/${selectedTaskList.id}`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) throw new Error(data.message || "Failed to fetch tasks");
    setTasks((data.tasks || []).map((raw: RawTask) => parseTask(TaskDBSchema.parse(raw))));
  }, [user, selectedTaskList]);

  const addTask = async (
    title: string,
    description: string,
    startDate: Date | null,
    endDate: Date | null,
    userIds: number[]
  ) => {
    if (!user || !selectedTaskList) throw new Error("Not authenticated or no task list selected");
    setLoading(true);
    const res = await fetch(`${API_URL}/task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({
        title,
        description,
        start_date: startDate ? startDate.toISOString() : null,
        end_date: endDate ? endDate.toISOString() : null,
        tasklist_id: selectedTaskList.id,
        user_ids: userIds,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) throw new Error(data.message || "Failed to add task");
    await fetchTasks();
  };

  const toggleTask = async (id: number) => {
    if (!user) throw new Error("Not authenticated");
    setLoading(true);
    const res = await fetch(`${API_URL}/task/${id}/check`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });
    setLoading(false);
    if (!res.ok) throw new Error("Failed to toggle task");
    await fetchTasks();
  };

  const deleteTask = async (id: number) => {
    if (!user) throw new Error("Not authenticated");
    setLoading(true);
    const res = await fetch(`${API_URL}/task/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });
    setLoading(false);
    if (!res.ok) throw new Error("Failed to delete task");
    await fetchTasks();
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <TaskContext.Provider
      value={{
        user,
        tasks,
        loading,
        addTask,
        toggleTask,
        deleteTask,
        fetchTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};