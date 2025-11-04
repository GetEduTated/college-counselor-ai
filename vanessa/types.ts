
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Message {
  role: Role;
  text: string;
}

export interface Subtask {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface TodoItem {
  id: string;
  text: string;
  isCompleted: boolean;
  priority?: 'High' | 'Medium' | 'Low';
  dueDate?: string; // e.g. '2024-12-31'
  notes?: string;
  subtasks?: Subtask[];
}

export interface TimelineItem {
  id: string;
  title: string;
  date: string;
  description: string;
  todos: TodoItem[];
  status: 'todo' | 'in-progress' | 'done';
}

export interface TimelineSection {
  id: string;
  title: string;
  items: TimelineItem[];
}

// New types for the redesigned Timeline View
export type TimelineEventCategory = 'Deadline' | 'Testing' | 'Visit' | 'To-Do' | 'Other';

export interface TimelineEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  category: TimelineEventCategory;
  description?: string;
}
