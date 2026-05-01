import { insforge } from '@/lib/insforge';

const WEBHOOK_URL = import.meta.env.VITE_CHAT_WEBHOOK_URL;

// ─── Types ───────────────────────────────────────────────────────────
export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  model_used: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  model: string | null;
  created_at: string;
}

export type DateFilter = 'today' | 'yesterday' | 'this_week' | 'older';

// ─── Sessions ────────────────────────────────────────────────────────

export async function createSession(
  userId: string,
  title: string = 'Nuevo chat',
  model: string = 'pro'
): Promise<ChatSession> {
  const { data, error } = await insforge.database
    .from('chat_sessions')
    .insert({
      user_id: userId,
      title,
      model_used: model,
    })
    .select();

  if (error) throw error;
  return data[0] as ChatSession;
}

export async function getSessionsByUser(userId: string): Promise<ChatSession[]> {
  const { data, error } = await insforge.database
    .from('chat_sessions')
    .select()
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ChatSession[];
}

export async function deleteSession(sessionId: string) {
  // Messages cascade-delete via FK
  const { error } = await insforge.database
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
}

export async function updateSessionTitle(sessionId: string, title: string) {
  const { data, error } = await insforge.database
    .from('chat_sessions')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select();

  if (error) throw error;
  return data?.[0] as ChatSession;
}

// ─── Messages ────────────────────────────────────────────────────────

export async function getMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
  const { data, error } = await insforge.database
    .from('chat_messages')
    .select()
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

async function saveMessage(
  sessionId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  model?: string
): Promise<ChatMessage> {
  const { data, error } = await insforge.database
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      user_id: userId,
      role,
      content,
      model: model || null,
    })
    .select();

  if (error) throw error;

  // Update session timestamp
  await insforge.database
    .from('chat_sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  return data[0] as ChatMessage;
}

// ─── Send Message (Webhook) ─────────────────────────────────────────

export async function sendMessage(
  sessionId: string,
  userId: string,
  content: string,
  model: string = 'pro'
): Promise<{ userMsg: ChatMessage; assistantMsg: ChatMessage }> {
  // 1. Save user message
  const userMsg = await saveMessage(sessionId, userId, 'user', content);

  // 2. Send to n8n webhook
  let assistantContent = 'Lo siento, hubo un error al procesar tu mensaje. Intenta de nuevo.';

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: content,
        sessionId,
        userId,
        model,
      }),
    });

    if (response.ok) {
      const json = await response.json();
      // n8n response format: { "respuesta": "..." }
      assistantContent = json.respuesta || json.response || json.output || 'Sin respuesta del servidor.';
    }
  } catch (err) {
    console.error('Webhook error:', err);
  }

  // 3. Save assistant message
  const assistantMsg = await saveMessage(sessionId, userId, 'assistant', assistantContent, model);

  return { userMsg, assistantMsg };
}

// ─── Progressive Rendering Helpers ──────────────────────────────────

/**
 * Sends user content to the webhook and returns the full response text.
 * Also saves the user message to the DB.
 */
export async function sendToWebhookOnly(
  sessionId: string,
  userId: string,
  content: string,
  model: string = 'pro'
): Promise<{ userMsg: ChatMessage; assistantContent: string }> {
  // 1. Save user message
  const userMsg = await saveMessage(sessionId, userId, 'user', content);

  // 2. Send to n8n webhook
  let assistantContent = 'Lo siento, hubo un error al procesar tu mensaje. Intenta de nuevo.';

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: content,
        sessionId,
        userId,
        model,
      }),
    });

    if (response.ok) {
      const json = await response.json();
      assistantContent = json.respuesta || json.response || json.output || 'Sin respuesta del servidor.';
    }
  } catch (err) {
    console.error('Webhook error:', err);
  }

  return { userMsg, assistantContent };
}

/**
 * Saves the assistant response to the DB after progressive rendering is complete.
 */
export async function saveAssistantMessage(
  sessionId: string,
  userId: string,
  content: string,
  model?: string
): Promise<ChatMessage> {
  return saveMessage(sessionId, userId, 'assistant', content, model);
}

// ─── Expert System ───────────────────────────────────────────────────

/**
 * Sends a message through the expert system API (/api/chat).
 * The API tries to resolve with deterministic rules first, then falls back
 * to the n8n webhook if no rule matches.
 *
 * Drop-in replacement for sendToWebhookOnly() — same signature and return type.
 */
export async function sendToExpertSystem(
  sessionId: string,
  userId: string,
  content: string,
  model: string = 'pro'
): Promise<{ userMsg: ChatMessage; assistantContent: string }> {
  // 1. Save user message to DB
  const userMsg = await saveMessage(sessionId, userId, 'user', content);

  // 2. Call the expert system serverless function
  let assistantContent = 'Lo siento, hubo un error al procesar tu mensaje. Intenta de nuevo.';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: content, sessionId, userId, model }),
    });

    if (response.ok) {
      const json = await response.json();
      assistantContent = json.respuesta || 'Sin respuesta.';

      // Log source for debugging (expert_system vs webhook_fallback)
      if (json.source) {
        console.info(`[chatService] Response source: ${json.source}${json.rule ? ` (rule: ${json.rule})` : ''}`);
      }
    } else {
      console.error('[chatService] Expert system API error:', response.status, await response.text());
    }
  } catch (err) {
    console.error('[chatService] Expert system fetch error:', err);
  }

  return { userMsg, assistantContent };
}

// ─── Group by Date ───────────────────────────────────────────────────

export function groupSessionsByDate(sessions: ChatSession[]): Record<string, ChatSession[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: Record<string, ChatSession[]> = {
    'Hoy': [],
    'Ayer': [],
    'Esta semana': [],
    'Anterior': [],
  };

  for (const session of sessions) {
    const sessionDate = new Date(session.updated_at || session.created_at);
    if (sessionDate >= today) {
      groups['Hoy'].push(session);
    } else if (sessionDate >= yesterday) {
      groups['Ayer'].push(session);
    } else if (sessionDate >= weekAgo) {
      groups['Esta semana'].push(session);
    } else {
      groups['Anterior'].push(session);
    }
  }

  return groups;
}
