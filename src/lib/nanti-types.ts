export type ItemKind = "task" | "commitment" | "deadline" | "waiting" | "followup";
export type ItemStatus = "inbox" | "open" | "done" | "ignored" | "received";
export type Priority = "high" | "medium" | "low";

export interface Person {
  id: string;
  name: string;
  org: string;
  role?: string;
  lastConversation: string; // ISO date
  activity: { date: string; text: string }[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  sources: string[];
}

export interface Item {
  id: string;
  title: string;
  description?: string;
  kind: ItemKind;
  status: ItemStatus;
  priority: Priority;
  due?: string; // ISO date
  time?: string; // HH:mm
  since?: string; // ISO date, for waiting items
  personId?: string;
  projectId?: string;
  source: string; // WhatsApp group / chat name
  quote: string;
  aiNote: string;
  confidence: number; // 0..1
  createdBy: "ai" | "user";
}

export interface Message {
  id: string;
  source: string;
  sender: string;
  text: string;
  at: string;
}
