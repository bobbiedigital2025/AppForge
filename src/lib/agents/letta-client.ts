/**
 * AppForge Letta Agent Client
 *
 * Sends messages to the AppForge agent team on Letta Cloud.
 * Each agent is a persistent Letta agent with its own memory —
 * they learn across projects and get smarter with each build.
 *
 * Falls back to Telnyx AI when LETTA_API_KEY is not configured
 * or when agent messaging fails.
 *
 * Agent IDs are stored in letta-agents.json.
 */

import agentConfig from './letta-agents.json';

const LETTA_BASE_URL = process.env.LETTA_BASE_URL || 'https://api.letta.com';

/** True when Letta agent messaging is available. */
export function hasLettaKey(): boolean {
  return !!process.env.LETTA_API_KEY;
}

/** Letta connection status for the dashboard. */
export function getLettaStatus(): { connected: boolean; agents: number } {
  return {
    connected: hasLettaKey(),
    agents: Object.keys(agentConfig.agents).length,
  };
}

type AgentRole = keyof typeof agentConfig.agents;

/**
 * Send a message to a Letta agent and get the response text.
 * Returns the content of the agent's assistant reply.
 * Throws on API errors — callers should catch and fall back.
 */
export async function callLettaAgent(role: AgentRole, message: string): Promise<string> {
  const apiKey = process.env.LETTA_API_KEY;
  if (!apiKey) {
    throw new Error('LETTA_API_KEY is not configured');
  }

  const agent = agentConfig.agents[role];
  if (!agent) {
    throw new Error(`No Letta agent configured for role: ${role}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 120s — Letta agents can be slow

  try {
    const response = await fetch(`${LETTA_BASE_URL}/v1/agents/${agent.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Letta API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();

    // Extract the assistant's reply from the messages array
    // The response contains the agent's messages — find the last assistant message
    const messages: Array<{ message_type?: string; role?: string; content?: string }> = data.messages || [];
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.message_type === 'assistant_message' && msg.content) {
        return msg.content;
      }
    }

    // Fallback: return any message with content
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].content) {
        return messages[i].content!;
      }
    }

    throw new Error('Letta agent returned an empty response');
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Call a Letta agent with automatic fallback to a backup function.
 * If the Letta call fails, calls the fallback (typically the Telnyx callAI).
 */
export async function callWithFallback(
  role: AgentRole,
  message: string,
  fallback: () => Promise<string>,
  log?: (level: 'info' | 'warn', msg: string) => void
): Promise<string> {
  if (hasLettaKey()) {
    try {
      log?.('info', `Calling Letta agent: ${role}`);
      const result = await callLettaAgent(role, message);
      log?.('info', `Letta agent ${role} responded successfully`);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      log?.('warn', `Letta agent ${role} failed (${msg}), falling back to Telnyx`);
    }
  }
  return fallback();
}
