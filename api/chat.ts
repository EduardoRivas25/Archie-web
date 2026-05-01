import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@insforge/sdk';

// ─── Types ───────────────────────────────────────────────────────────
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

// ─── Insforge Server Client ─────────────────────────────────────────
const insforge = createClient({
  baseUrl: process.env.INSFORGE_URL!,
  anonKey: process.env.INSFORGE_ANON_KEY!,
});

// ─── Keyword Dictionaries ───────────────────────────────────────────

const TOPIC_KEYWORDS: Record<string, string[]> = {
  programming: [
    'programación', 'programacion', 'código', 'codigo', 'función', 'funcion',
    'variable', 'array', 'loop', 'bucle', 'for', 'while', 'if', 'else',
    'clase', 'objeto', 'python', 'javascript', 'java', 'c++', 'typescript',
    'html', 'css', 'react', 'algoritmo', 'recursión', 'recursion', 'closure',
    'promise', 'async', 'api', 'git', 'debug', 'string', 'int', 'float',
    'boolean', 'struct', 'enum', 'interface', 'import', 'export', 'npm',
    'pip', 'compilar', 'compilador', 'interprete', 'framework', 'librería',
    'biblioteca', 'método', 'metodo', 'constructor', 'herencia', 'polimorfismo',
  ],
  math: [
    'matemáticas', 'matematicas', 'ecuación', 'ecuacion', 'integral',
    'derivada', 'límite', 'limite', 'matriz', 'vector', 'trigonometría',
    'trigonometria', 'seno', 'coseno', 'tangente', 'álgebra', 'algebra',
    'cálculo', 'calculo', 'geometría', 'geometria', 'probabilidad',
    'estadística', 'estadistica', 'logaritmo', 'exponencial', 'polinomio',
    'factorial', 'combinatoria', 'función lineal', 'funcion lineal',
    'pendiente', 'intersección', 'raíz', 'raiz', 'cuadrática', 'cuadratica',
    'fracción', 'fraccion', 'porcentaje', 'proporción', 'proporcion',
    'teorema', 'pitágoras', 'pitagoras', 'área', 'area', 'perímetro',
    'perimetro', 'volumen', 'circunferencia', 'radio', 'diámetro',
  ],
};

const SUBTOPIC_KEYWORDS: Record<string, string[]> = {
  loops: ['for', 'while', 'bucle', 'loop', 'iteración', 'iteracion', 'recorrer', 'repetir', 'do while', 'foreach'],
  functions: ['función', 'funcion', 'function', 'def', 'return', 'parámetro', 'parametro', 'argumento', 'arrow', 'lambda'],
  arrays: ['array', 'arreglo', 'lista', 'list', 'push', 'pop', 'map', 'filter', 'reduce', 'sort', 'slice'],
  conditionals: ['if', 'else', 'condición', 'condicion', 'switch', 'ternario', 'condicional', 'else if', 'elif'],
  oop: ['clase', 'class', 'objeto', 'herencia', 'polimorfismo', 'encapsulamiento', 'abstracción', 'abstraccion', 'constructor', 'instancia'],
  strings: ['string', 'cadena', 'texto', 'concatenar', 'split', 'substring', 'replace', 'trim', 'charAt'],
  errors: ['error', 'excepción', 'excepcion', 'try', 'catch', 'throw', 'finally', 'debug', 'bug'],
  async_prog: ['async', 'await', 'promise', 'promesa', 'callback', 'then', 'fetch', 'asíncrono', 'asincron'],
  derivatives: ['derivada', 'derivative', 'diferencial', 'd/dx', 'regla cadena', 'regla de la cadena', 'derivar'],
  integrals: ['integral', 'antiderivada', 'área bajo curva', 'area bajo curva', 'integración', 'integracion', 'integrar'],
  limits: ['límite', 'limite', 'limit', 'tiende', 'lím', 'lim', 'continuidad', 'indeterminación'],
  algebra: ['ecuación', 'ecuacion', 'despejar', 'factorizar', 'polinomio', 'sistema ecuaciones', 'variable', 'incógnita'],
  trigonometry: ['seno', 'coseno', 'tangente', 'trigonometría', 'trigonometria', 'ángulo', 'angulo', 'radián', 'radian', 'sen', 'cos', 'tan'],
  geometry: ['geometría', 'geometria', 'área', 'area', 'perímetro', 'perimetro', 'volumen', 'triángulo', 'triangulo', 'círculo', 'circulo', 'cuadrado', 'rectángulo'],
  probability: ['probabilidad', 'estadística', 'estadistica', 'media', 'mediana', 'moda', 'desviación', 'varianza', 'combinatoria', 'permutación'],
};

const INTENT_KEYWORDS: Record<string, string[]> = {
  explain: ['explica', 'explícame', 'explicame', 'qué es', 'que es', 'qué son', 'que son', 'cómo funciona', 'como funciona', 'describe', 'definición', 'definicion', 'significa'],
  solve: ['resuelve', 'calcula', 'encuentra', 'haz', 'resolveme', 'solución', 'solucion', 'resolver', 'resultado', 'respuesta', 'cuánto', 'cuanto'],
  example: ['ejemplo', 'muéstrame', 'muestrame', 'demuestra', 'práctica', 'practica', 'ejercicio', 'código de ejemplo', 'codigo de ejemplo', 'muestra'],
  compare: ['diferencia', 'comparar', 'vs', 'versus', 'mejor', 'cuál es mejor', 'cual es mejor', 'entre', 'ventaja', 'desventaja'],
  help: ['ayuda', 'ayúdame', 'ayudame', 'no entiendo', 'no comprendo', 'duda', 'pregunta', 'cómo se hace', 'como se hace'],
};

const LANG_KEYWORDS: Record<string, string[]> = {
  python: ['python', 'py', 'pip', 'django', 'flask', 'pandas', 'numpy'],
  javascript: ['javascript', 'js', 'node', 'npm', 'react', 'vue', 'angular', 'express'],
  typescript: ['typescript', 'ts', 'tsx'],
  java: ['java', 'jvm', 'spring', 'maven', 'gradle'],
  cpp: ['c++', 'cpp', 'puntero', 'punteros'],
  csharp: ['c#', 'csharp', '.net', 'dotnet'],
  sql: ['sql', 'select', 'insert', 'update', 'delete', 'join', 'tabla', 'base de datos'],
};

// ─── Fact Extractor ─────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function extractFacts(message: string, profile: any): Fact[] {
  const msgNorm = normalizeText(message);
  const msgOrig = message.toLowerCase();
  const facts: Fact[] = [];

  // Topic detection
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(k => msgNorm.includes(normalizeText(k)) || msgOrig.includes(k))) {
      facts.push({ key: 'topic', value: topic });
      break;
    }
  }

  // Subtopic detection
  for (const [sub, keywords] of Object.entries(SUBTOPIC_KEYWORDS)) {
    if (keywords.some(k => msgNorm.includes(normalizeText(k)) || msgOrig.includes(k))) {
      facts.push({ key: 'subtopic', value: sub });
      break;
    }
  }

  // Intent detection
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some(k => msgNorm.includes(normalizeText(k)) || msgOrig.includes(k))) {
      facts.push({ key: 'intent', value: intent });
      break;
    }
  }

  // Programming language detection
  for (const [lang, keywords] of Object.entries(LANG_KEYWORDS)) {
    if (keywords.some(k => msgNorm.includes(normalizeText(k)) || msgOrig.includes(k))) {
      facts.push({ key: 'language', value: lang });
      break;
    }
  }

  // User level from profile
  const level = profile?.expert_level || determineLevel(profile);
  facts.push({ key: 'level', value: level });

  // Category from topic (convenience fact)
  const topic = facts.find(f => f.key === 'topic');
  if (topic) {
    facts.push({ key: 'category', value: topic.value });
  }

  return facts;
}

function determineLevel(profile: any): string {
  const count = profile?.interactions_count || 0;
  if (count < 10) return 'beginner';
  if (count < 50) return 'intermediate';
  return 'advanced';
}

// ─── Condition Evaluator ────────────────────────────────────────────

function evaluateCondition(condition: RuleCondition, facts: Fact[]): boolean {
  const fact = facts.find(f => f.key === condition.fact);
  if (!fact) return false;

  switch (condition.operator) {
    case 'equals':
      return fact.value === condition.value;

    case 'contains':
      return typeof condition.value === 'string' && fact.value.includes(condition.value);

    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(fact.value);

    case 'not_equals':
      return fact.value !== condition.value;

    default:
      return false;
  }
}

// ─── Rule Matcher ───────────────────────────────────────────────────

function matchRules(facts: Fact[], rules: ExpertRule[]): ExpertRule[] {
  return rules.filter(rule =>
    rule.conditions.every(cond => evaluateCondition(cond, facts))
  );
}

// ─── Conflict Resolution ────────────────────────────────────────────

function selectBestRule(matchedRules: ExpertRule[]): ExpertRule | null {
  if (matchedRules.length === 0) return null;

  const sorted = [...matchedRules].sort((a, b) => {
    // Higher priority first
    if (b.priority !== a.priority) return b.priority - a.priority;
    // More conditions = more specific = preferred
    return b.conditions.length - a.conditions.length;
  });

  return sorted[0];
}

// ─── Inference Engine (Forward Chaining) ────────────────────────────

function runInferenceEngine(facts: Fact[], rules: ExpertRule[]): InferenceResult {
  const activeRules = rules.filter(r => r.is_active);
  const matched = matchRules(facts, activeRules);
  const bestRule = selectBestRule(matched);

  if (bestRule) {
    let response = bestRule.action.response;
    if (bestRule.action.followUp) {
      response += `\n\n---\n💡 ${bestRule.action.followUp}`;
    }
    return {
      matched: true,
      rule: bestRule,
      response,
      facts,
      matchedRules: matched,
    };
  }

  return { matched: false, facts, matchedRules: [] };
}

// ─── Database Operations ────────────────────────────────────────────

async function loadActiveRules(): Promise<ExpertRule[]> {
  const { data, error } = await insforge.database
    .from('expert_rules')
    .select()
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error loading rules:', error);
    return [];
  }

  return (data ?? []) as ExpertRule[];
}

async function getProfile(userId: string) {
  const { data, error } = await insforge.database
    .from('user_profiles')
    .select()
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error loading profile:', error);
    return null;
  }

  return data;
}

async function updateUserProgress(userId: string, facts: Fact[]) {
  try {
    // Get current profile to increment counter
    const { data: profile } = await insforge.database
      .from('user_profiles')
      .select('interactions_count, topics_history')
      .eq('user_id', userId)
      .maybeSingle();

    const currentCount = (profile?.interactions_count || 0) + 1;
    const topicsHistory = profile?.topics_history || {};

    // Update topic history
    const topic = facts.find(f => f.key === 'topic')?.value;
    if (topic) {
      topicsHistory[topic] = (topicsHistory[topic] || 0) + 1;
    }

    // Determine new level
    let newLevel = 'beginner';
    if (currentCount >= 50) newLevel = 'advanced';
    else if (currentCount >= 10) newLevel = 'intermediate';

    await insforge.database
      .from('user_profiles')
      .update({
        interactions_count: currentCount,
        expert_level: newLevel,
        topics_history: topicsHistory,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } catch (err) {
    console.error('Error updating user progress:', err);
  }
}

// ─── Webhook Fallback ───────────────────────────────────────────────

async function forwardToWebhook(
  message: string,
  sessionId: string,
  userId: string,
  model: string
): Promise<string> {
  const webhookUrl = process.env.CHAT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('CHAT_WEBHOOK_URL not configured');
    return 'Lo siento, el servicio no está disponible en este momento.';
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId, userId, model }),
    });

    if (res.ok) {
      const json = await res.json();
      return json.respuesta || json.response || json.output || 'Sin respuesta del servidor.';
    }

    console.error('Webhook returned status:', res.status);
  } catch (err) {
    console.error('Webhook fallback error:', err);
  }

  return 'Lo siento, hubo un error al procesar tu mensaje. Intenta de nuevo.';
}

// ─── Main API Handler ───────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, sessionId, userId, model } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: 'Missing required fields: message, userId' });
    }

    // 1. Get user profile from DB
    const profile = await getProfile(userId);

    // 2. Extract facts from message + profile
    const facts = extractFacts(message, profile);

    // 3. Load active rules from DB
    const rules = await loadActiveRules();

    // 4. Run forward-chaining inference engine
    const result = runInferenceEngine(facts, rules);

    // 5. If a rule matched, return expert response
    if (result.matched && result.response) {
      // Update user progress asynchronously (don't block response)
      updateUserProgress(userId, facts).catch(err =>
        console.error('Background progress update failed:', err)
      );

      return res.status(200).json({
        respuesta: result.response,
        source: 'expert_system',
        rule: result.rule?.name,
        facts: result.facts,
        matchedCount: result.matchedRules.length,
      });
    }

    // 6. No rule matched → fallback to n8n webhook
    const webhookResponse = await forwardToWebhook(
      message,
      sessionId || '',
      userId,
      model || 'pro'
    );

    return res.status(200).json({
      respuesta: webhookResponse,
      source: 'webhook_fallback',
      facts: result.facts,
    });
  } catch (err: any) {
    console.error('Expert system handler error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err?.message || 'Unknown error',
    });
  }
}
