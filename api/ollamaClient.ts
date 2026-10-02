/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ollamaClient.ts
 * Cliente LLM compartido por los routers que usan Ollama como proveedor local.
 *
 * Se extrajo de aiRoutes.ts para que toolRoutes.ts use la misma configuracion
 * en lugar de duplicarla. Los defaults no cambian: temperature 0.4, num_ctx
 * 4096 y timeout de 120s, que es lo que ya usa /api/ai/ask en produccion.
 */

export type OllamaMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// process.env del sistema tiene prioridad sobre .env (dotenv no sobreescribe).
// OVERRIDE_OLLAMA_MODEL/OVERRIDE_OLLAMA_BASE_URL permiten ganar de forma explicita
// sin tener que editar variables globales de Windows/Linux.
export const OLLAMA_BASE_URL = (
  process.env.OVERRIDE_OLLAMA_BASE_URL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
).replace(/\/+$/, '');

// .trim() es necesario: fuentes como `set VAR=valor && cmd` en cmd.exe dejan
// un espacio final que haria fallar la comparacion contra /api/tags.
export const OLLAMA_MODEL = (
  process.env.OVERRIDE_OLLAMA_MODEL || process.env.OLLAMA_MODEL || 'llama3.2:3b'
).trim();

export const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 120_000;

export interface CallOllamaOptions {
  /** Fuerza salida JSON estructurada del modelo. */
  json?: boolean;
  temperature?: number;
}

/**
 * Llama a /api/chat y devuelve el contenido plano. Lanza si Ollama no responde
 * o devuelve vacio; el llamador decide como degradar.
 */
export async function callOllama(
  messages: OllamaMessage[],
  opts: CallOllamaOptions = {}
): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      keep_alive: '24h',
      // `format: 'json'` es el equivalente de response_format de Groq. Un 3B
      // tiende a envolver el JSON en prosa o en vallas markdown, por eso el
      // formato alone no alcanza y hay que limpiar la respuesta aparte.
      ...(opts.json ? { format: 'json' } : {}),
      options: {
        temperature: opts.temperature ?? 0.4,
        num_predict: 120,
        num_ctx: 2048,
        ...(process.env.OLLAMA_NUM_CTX ? { num_ctx: Number(process.env.OLLAMA_NUM_CTX) } : {}),
      },
    }),
    signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Ollama respondio ${res.status}: ${body.slice(0, 300)}`);
  }

  const data: any = await res.json();
  const content = data?.message?.content ?? data?.response ?? '';
  if (!content) throw new Error('Ollama devolvio una respuesta vacia');
  return String(content).trim();
}

/**
 * Extrae un objeto JSON de la salida del modelo. Los modelos pequenos agregan
 * vallas ```json, texto antes o despues, o comas colgantes, y `JSON.parse`
 * revienta en silencio dejando al usuario sin score.
 */
export function parseModelJson<T>(raw: string): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : raw).trim();
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`El modelo no devolvio JSON: ${raw.slice(0, 200)}`);
  }
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}
