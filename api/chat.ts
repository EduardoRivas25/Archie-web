import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@insforge/sdk';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Fact {
  key: string;
  value: string;
}

interface RuleCondition {
  fact: string;
  operator: 'equals' | 'contains' | 'in' | 'not_equals';
  value: string | string[];
}

interface RuleAction {
  type: 'direct_response';
  response: string;
  followUp?: string;
  tags?: string[];
  levelAdjustment?: number;
}

interface ExpertRule {
  id: string;
  name: string;
  category: string;
  conditions: RuleCondition[];
  action: RuleAction;
  priority: number;
  is_active: boolean;
}

interface InferenceResult {
  matched: boolean;
  rule?: ExpertRule;
  response?: string;
  facts: Fact[];
  matchedRules: ExpertRule[];
}

// ─── Insforge Server Client (lazy — created on first request) ───────────────

let _insforge: ReturnType<typeof createClient> | null = null;

function getInsforge() {
  if (!_insforge) {
    const baseUrl = process.env.INSFORGE_URL;
    const anonKey = process.env.INSFORGE_ANON_KEY;
    if (!baseUrl || !anonKey) {
      throw new Error(
        `Missing env vars: ${!baseUrl ? 'INSFORGE_URL ' : ''}${!anonKey ? 'INSFORGE_ANON_KEY' : ''}`.trim()
      );
    }
    _insforge = createClient({ baseUrl, anonKey });
  }
  return _insforge;
}

// ─── Keyword Dictionaries ─────────────────────────────────────────────────────

const TOPIC_KEYWORDS: Record<string, string[]> = {
  programming: [
    'programacion', 'codigo', 'funcion', 'variable', 'array', 'loop',
    'bucle', 'for', 'while', 'if', 'else', 'clase', 'objeto', 'python',
    'javascript', 'java', 'c++', 'typescript', 'html', 'css', 'react',
    'algoritmo', 'recursion', 'closure', 'promise', 'async', 'api', 'git',
    'debug', 'compilar', 'ejecutar', 'modulo', 'import', 'export',
  ],
  math: [
    'matematicas', 'ecuacion', 'integral', 'derivada', 'limite', 'matriz',
    'vector', 'trigonometria', 'seno', 'coseno', 'algebra', 'calculo',
    'geometria', 'probabilidad', 'estadistica', 'logaritmo', 'exponencial',
    'polinomio', 'factorial', 'combinatoria', 'numero', 'fraccion',
  ],
  networking: [
    'red', 'redes', 'osi', 'tcp', 'ip', 'protocolo', 'router', 'switch',
    'firewall', 'dns', 'http', 'https', 'puerto', 'subred', 'mascara',
    'ethernet', 'wifi', 'latencia', 'ancho de banda',
  ],
};

const SUBTOPIC_KEYWORDS: Record<string, string[]> = {
  loops: ['for', 'while', 'bucle', 'loop', 'iteracion', 'recorrer', 'repetir', 'ciclo'],
  functions: ['funcion', 'function', 'def', 'return', 'parametro', 'argumento', 'metodo'],
  arrays: ['array', 'arreglo', 'lista', 'list', 'push', 'pop', 'map', 'filter', 'vector'],
  conditionals: ['if', 'else', 'condicion', 'switch', 'ternario', 'condicional', 'cuando'],
  oop: ['clase', 'class', 'objeto', 'herencia', 'polimorfismo', 'encapsulamiento', 'instancia'],
  recursion: ['recursion', 'recursiva', 'recursivo', 'base case', 'caso base', 'llamada recursiva'],
  async_programming: ['async', 'await', 'promise', 'promesa', 'asincrono', 'callback', 'then', 'catch'],
  derivatives: ['derivada', 'derivative', 'diferencial', 'dx', 'regla cadena', 'derivar'],
  integrals: ['integral', 'antiderivada', 'area bajo curva', 'integracion', 'integrar'],
  limits: ['limite', 'limit', 'tiende', 'lim', 'continuidad', 'infinito'],
  algebra: ['ecuacion', 'despejar', 'factorizar', 'polinomio', 'sistema ecuaciones', 'igualando'],
  trigonometry: ['seno', 'coseno', 'tangente', 'trigonometria', 'angulo', 'radian', 'sen', 'cos', 'tan'],
  osi_model: ['osi', 'capas osi', 'modelo osi', 'siete capas', '7 capas'],
  tcp_ip: ['tcp', 'protocolo internet', 'ipv4', 'ipv6', 'three way handshake'],
};

const INTENT_KEYWORDS: Record<string, string[]> = {
  explain: ['explica', 'explicame', 'que es', 'que son', 'como funciona', 'describe', 'definicion', 'define'],
  solve: ['resuelve', 'calcula', 'encuentra', 'haz', 'resolveme', 'solucion', 'resolver'],
  example: ['ejemplo', 'muestrame', 'demuestra', 'practica', 'ejercicio', 'demo'],
  compare: ['diferencia', 'comparar', 'vs', 'versus', 'mejor', 'cual es mejor', 'comparacion'],
};

const LANG_KEYWORDS: Record<string, string[]> = {
  python: ['python', 'py ', ' py', 'pip'],
  javascript: ['javascript', ' js', 'js ', 'node', 'npm', 'nodejs'],
  typescript: ['typescript', ' ts', 'ts '],
  java: ['java ', ' java', 'jvm', 'javac'],
  cpp: ['c++', 'cpp'],
};

// ─── Fact Extractor ───────────────────────────────────────────────────────────

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function extractFacts(message: string, profile: Record<string, unknown> | null): Fact[] {
  const msg = normalize(message);
  const facts: Fact[] = [];

  // Topic
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(k => msg.includes(k))) {
      facts.push({ key: 'topic', value: topic });
      break;
    }
  }

  // Subtopic
  for (const [sub, keywords] of Object.entries(SUBTOPIC_KEYWORDS)) {
    if (keywords.some(k => msg.includes(k))) {
      facts.push({ key: 'subtopic', value: sub });
      break;
    }
  }

  // Intent
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some(k => msg.includes(k))) {
      facts.push({ key: 'intent', value: intent });
      break;
    }
  }

  // Programming language
  for (const [lang, keywords] of Object.entries(LANG_KEYWORDS)) {
    if (keywords.some(k => msg.includes(k))) {
      facts.push({ key: 'language', value: lang });
      break;
    }
  }

  // User level (from profile or derived)
  const level = (profile?.expert_level as string) || determineLevel(profile);
  facts.push({ key: 'level', value: level });

  return facts;
}

function determineLevel(profile: Record<string, unknown> | null): string {
  const count = (profile?.interactions_count as number) || 0;
  if (count < 10) return 'beginner';
  if (count < 50) return 'intermediate';
  return 'advanced';
}

// ─── Condition Evaluator ──────────────────────────────────────────────────────

function evaluateCondition(condition: RuleCondition, facts: Fact[]): boolean {
  const fact = facts.find(f => f.key === condition.fact);
  if (!fact) return false;

  switch (condition.operator) {
    case 'equals':
      return fact.value === condition.value;
    case 'contains':
      return fact.value.includes(condition.value as string);
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(fact.value);
    case 'not_equals':
      return fact.value !== condition.value;
    default:
      return false;
  }
}

// ─── Rule Matcher ─────────────────────────────────────────────────────────────

function matchRules(facts: Fact[], rules: ExpertRule[]): ExpertRule[] {
  return rules.filter(rule =>
    rule.is_active && rule.conditions.every(cond => evaluateCondition(cond, facts))
  );
}

// ─── Conflict Resolution ──────────────────────────────────────────────────────

function selectBestRule(matchedRules: ExpertRule[]): ExpertRule | null {
  if (matchedRules.length === 0) return null;

  return [...matchedRules].sort((a, b) => {
    // Higher priority first
    if (b.priority !== a.priority) return b.priority - a.priority;
    // More conditions = more specific = preferred
    return b.conditions.length - a.conditions.length;
  })[0];
}

// ─── Inference Engine ─────────────────────────────────────────────────────────

function runInferenceEngine(facts: Fact[], rules: ExpertRule[]): InferenceResult {
  const matched = matchRules(facts, rules);
  const bestRule = selectBestRule(matched);

  if (bestRule) {
    let response = bestRule.action.response;
    if (bestRule.action.followUp) {
      response += `\n\n---\n💡 ${bestRule.action.followUp}`;
    }
    return { matched: true, rule: bestRule, response, facts, matchedRules: matched };
  }

  return { matched: false, facts, matchedRules: [] };
}

// ─── DB Operations ────────────────────────────────────────────────────────────

async function loadActiveRules(): Promise<ExpertRule[]> {
  try {
    const { data, error } = await getInsforge().database
      .from('expert_rules')
      .select()
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) {
      console.warn('[ExpertSystem] Error loading rules:', error);
      return [];
    }
    return (data ?? []) as ExpertRule[];
  } catch (err) {
    console.warn('[ExpertSystem] Failed to load rules (table may not exist):', err);
    return [];
  }
}

async function getProfile(userId: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await getInsforge().database
    .from('user_profiles')
    .select()
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Could not fetch profile:', error.message);
    return null;
  }
  return data as Record<string, unknown> | null;
}

async function updateUserProgress(userId: string, facts: Fact[]): Promise<void> {
  try {
    const db = getInsforge().database;
    const { data: profile } = await db
      .from('user_profiles')
      .select('interactions_count, topics_history')
      .eq('user_id', userId)
      .maybeSingle();

    const currentCount = (profile?.interactions_count as number) || 0;
    const topicsHistory = (profile?.topics_history as Record<string, number>) || {};
    const topic = facts.find(f => f.key === 'topic')?.value;

    if (topic) {
      topicsHistory[topic] = (topicsHistory[topic] || 0) + 1;
    }

    await db
      .from('user_profiles')
      .update({
        interactions_count: currentCount + 1,
        topics_history: topicsHistory,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } catch (err) {
    console.warn('Could not update user progress:', err);
  }
}

// ─── Webhook Fallback ─────────────────────────────────────────────────────────

async function forwardToWebhook(
  message: string,
  sessionId: string,
  userId: string,
  model: string
): Promise<string> {
  const webhookUrl = process.env.CHAT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('CHAT_WEBHOOK_URL is not set');
    return 'Lo siento, no pude procesar tu mensaje. Intenta de nuevo.';
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId, userId, model }),
    });

    if (res.ok) {
      const json = await res.json();
      return json.respuesta || json.response || json.output || 'Sin respuesta.';
    }
    console.warn('Webhook responded with status:', res.status);
  } catch (err) {
    console.error('Webhook fallback error:', err);
  }

  return 'Lo siento, no pude procesar tu mensaje. Intenta de nuevo.';
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, sessionId, userId, model = 'pro' } = req.body ?? {};

    if (!message || !userId) {
      return res.status(400).json({ error: 'Missing required fields: message, userId' });
    }

    // 1. Get user profile (non-blocking failure)
    const profile = await getProfile(userId);

    // 2. Extract facts from message + profile
    const facts = extractFacts(message, profile);
    console.log('[ExpertSystem] Facts extracted:', facts);

    // 3. Load active rules from DB
    const rules = await loadActiveRules();
    console.log(`[ExpertSystem] Loaded ${rules.length} active rules`);

    // 4. Run forward chaining inference engine
    const result = runInferenceEngine(facts, rules);

    // 5a. Expert system matched → return deterministic response
    if (result.matched && result.rule) {
      console.log(`[ExpertSystem] Rule matched: ${result.rule.name} (priority: ${result.rule.priority})`);

      // Update user progress (fire-and-forget)
      updateUserProgress(userId, facts).catch(() => {});

      return res.status(200).json({
        respuesta: result.response,
        source: 'expert_system',
        rule: result.rule.name,
        facts: result.facts,
        matchedRulesCount: result.matchedRules.length,
      });
    }

    // 5b. No rule matched → fallback to n8n webhook
    console.log('[ExpertSystem] No rule matched, falling back to webhook');
    const webhookResponse = await forwardToWebhook(message, sessionId, userId, model);

    return res.status(200).json({
      respuesta: webhookResponse,
      source: 'webhook_fallback',
      facts: result.facts,
    });

  } catch (err: unknown) {
    let errMsg = 'Unknown error';
    if (err instanceof Error) {
      errMsg = err.message;
    } else if (typeof err === 'string') {
      errMsg = err;
    } else if (err && typeof err === 'object') {
      errMsg = JSON.stringify(err);
    }
    console.error('[ExpertSystem] Handler error:', errMsg, err);
    return res.status(500).json({ error: 'Internal server error', details: errMsg });
  }
}
