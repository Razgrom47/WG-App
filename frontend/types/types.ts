/**
 * @file types.ts
 *
 * This file defines the Task interface used throughout the application,
 * to enforce a consistent structure for task objects.
 */
export interface Task {
  id: number;
  text: string;
  color: string;
  dueDate: Date;
  completed: boolean;
}
