/**
 * messagingService.ts
 * Wrapper REST para /api/messaging/* — reemplaza las llamadas a Google Apps Script.
 */
const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

async function jpost<T = any>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${path}`);
  return r.json();
}

async function jget<T = any>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`);
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${path}`);
  return r.json();
}

export interface ApiMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  isDirector: boolean;
}

export interface ApiChat {
  id: string;
  name: string;
  type: 'GLOBAL' | 'GROUP' | 'DIRECT';
  participants: string[];
  participantNames?: Record<string, string>;
  participantRoles?: Record<string, string>;
  messages: ApiMessage[];
  lastMessage: string;
  unreadCount: number;
}

export async function listarChats(email: string): Promise<ApiChat[]> {
  const data = await jget<{ ok: boolean; chats: ApiChat[] }>(
    `/api/messaging/conversations?email=${encodeURIComponent(email)}`
  );
  return data.chats || [];
}

export async function crearChat(
  email: string,
  chatId: string,
  name: string,
  type: 'GLOBAL' | 'GROUP' | 'DIRECT',
  participants: string[]
): Promise<void> {
  await jpost('/api/messaging/conversations', { email, chatId, name, type, participants });
}

export async function obtenerMensajesChat(
  email: string,
  chatId: string,
  limit = 100
): Promise<ApiMessage[]> {
  const data = await jget<{ ok: boolean; messages: ApiMessage[] }>(
    `/api/messaging/conversations/${encodeURIComponent(chatId)}/messages?email=${encodeURIComponent(email)}&limit=${limit}`
  );
  return data.messages || [];
}

export async function enviarMensaje(
  email: string,
  chatId: string,
  content: string,
  senderName?: string,
  senderRole?: string,
  isDirector?: boolean
): Promise<ApiMessage> {
  const data = await jpost<{ ok: boolean; message: ApiMessage }>(
    `/api/messaging/conversations/${encodeURIComponent(chatId)}/messages`,
    { email, content, senderName, senderRole, isDirector }
  );
  return data.message;
}

export async function marcarLeido(email: string, chatId: string): Promise<void> {
  await jpost(`/api/messaging/conversations/${encodeURIComponent(chatId)}/read`, { email });
}

export default {
  listarChats,
  crearChat,
  obtenerMensajesChat,
  enviarMensaje,
  marcarLeido,
};