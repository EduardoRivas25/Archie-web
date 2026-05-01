import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Types ────────────────────────────────────────────────────────
interface Fact { key: string; value: string; }

interface RuleCondition {
  fact: string;
  operator: 'equals' | 'contains' | 'in' | 'not_equals';
  value: string | string[];
}

interface ExpertRule {
  name: string;
  category: string;
  conditions: RuleCondition[];
  response: string;
  followUp?: string;
  priority: number;
}

// ─── Keyword Dictionaries ─────────────────────────────────────────
const TOPIC_KW: Record<string, string[]> = {
  programming: ['programacion','codigo','funcion','variable','array','loop','bucle','for','while','if','else','clase','objeto','python','javascript','java','c++','typescript','html','css','react','algoritmo','recursion','closure','promise','async','api','git','debug'],
  math: ['matematicas','ecuacion','integral','derivada','limite','matriz','vector','trigonometria','seno','coseno','algebra','calculo','geometria','probabilidad','estadistica','logaritmo','exponencial','polinomio','factorial'],
  networking: ['red','redes','osi','tcp','ip','protocolo','router','switch','firewall','dns','http','https','puerto','subred','ethernet','wifi'],
};

const SUBTOPIC_KW: Record<string, string[]> = {
  loops: ['for','while','bucle','loop','iteracion','recorrer','repetir','ciclo'],
  functions: ['funcion','function','def','return','parametro','argumento','metodo'],
  arrays: ['array','arreglo','lista','list','push','pop','map','filter'],
  conditionals: ['if','else','condicion','switch','ternario','condicional'],
  oop: ['clase','class','objeto','herencia','polimorfismo','encapsulamiento','instancia'],
  recursion: ['recursion','recursiva','recursivo','caso base','llamada recursiva'],
  async_programming: ['async','await','promise','promesa','asincrono','callback','then','catch'],
  derivatives: ['derivada','derivative','diferencial','dx','regla cadena','derivar'],
  integrals: ['integral','antiderivada','area bajo curva','integracion','integrar'],
  limits: ['limite','limit','tiende','lim','continuidad','infinito'],
  algebra: ['ecuacion','despejar','factorizar','polinomio','sistema ecuaciones'],
  trigonometry: ['seno','coseno','tangente','trigonometria','angulo','radian','sen','cos','tan'],
  osi_model: ['osi','capas osi','modelo osi','siete capas','7 capas'],
  tcp_ip: ['tcp','udp','protocolo internet','ipv4','ipv6','handshake'],
};

const INTENT_KW: Record<string, string[]> = {
  explain: ['explica','explicame','que es','que son','como funciona','describe','definicion','define'],
  solve: ['resuelve','calcula','encuentra','haz','resolveme','solucion','resolver'],
  example: ['ejemplo','muestrame','demuestra','practica','ejercicio'],
  compare: ['diferencia','comparar','vs','versus','mejor','cual es mejor'],
};

// ─── Fact Extractor ───────────────────────────────────────────────
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function extractFacts(message: string): Fact[] {
  const msg = normalize(message);
  const facts: Fact[] = [];

  for (const [t, kws] of Object.entries(TOPIC_KW)) {
    if (kws.some(k => msg.includes(k))) { facts.push({ key: 'topic', value: t }); break; }
  }
  for (const [s, kws] of Object.entries(SUBTOPIC_KW)) {
    if (kws.some(k => msg.includes(k))) { facts.push({ key: 'subtopic', value: s }); break; }
  }
  for (const [i, kws] of Object.entries(INTENT_KW)) {
    if (kws.some(k => msg.includes(k))) { facts.push({ key: 'intent', value: i }); break; }
  }

  facts.push({ key: 'level', value: 'beginner' });
  return facts;
}

// ─── Condition Evaluator ──────────────────────────────────────────
function evalCond(c: RuleCondition, facts: Fact[]): boolean {
  const f = facts.find(x => x.key === c.fact);
  if (!f) return false;
  switch (c.operator) {
    case 'equals': return f.value === c.value;
    case 'contains': return f.value.includes(c.value as string);
    case 'in': return Array.isArray(c.value) && c.value.includes(f.value);
    case 'not_equals': return f.value !== c.value;
    default: return false;
  }
}

// ─── Inference Engine ─────────────────────────────────────────────
function runEngine(facts: Fact[], rules: ExpertRule[]): { matched: boolean; rule?: ExpertRule; response: string } {
  const matched = rules.filter(r => r.conditions.every(c => evalCond(c, facts)));

  if (matched.length === 0) {
    return { matched: false, response: '🤔 No tengo una respuesta específica para eso. Puedo ayudarte con **programación**, **matemáticas** y **redes**. ¿Podrías reformular tu pregunta?' };
  }

  const best = matched.sort((a, b) => b.priority !== a.priority ? b.priority - a.priority : b.conditions.length - a.conditions.length)[0];

  let resp = best.response;
  if (best.followUp) resp += `\n\n---\n💡 ${best.followUp}`;

  return { matched: true, rule: best, response: resp };
}

// ─── Knowledge Base (Hardcoded Rules) ─────────────────────────────
const RULES: ExpertRule[] = [
  {
    name: 'for_loop_beginner', category: 'programming', priority: 80,
    conditions: [
      { fact: 'topic', operator: 'equals', value: 'programming' },
      { fact: 'subtopic', operator: 'equals', value: 'loops' },
    ],
    response: '🔁 **¿Qué es un bucle `for`?**\n\nUn bucle `for` repite un bloque de código un número definido de veces.\n\n```python\nfor i in range(5):\n    print(f"Iteración {i}")\n```\n\n**Resultado:**\n```\nIteración 0\nIteración 1\nIteración 2\nIteración 3\nIteración 4\n```\n\n💡 **Tip:** `range(5)` genera los números del **0 al 4** (el 5 no se incluye).\n\n**Estructura general:**\n```python\nfor variable in secuencia:\n    # código a repetir\n```',
    followUp: '¿Quieres que te explique el bucle `while` también?',
  },
  {
    name: 'functions_beginner', category: 'programming', priority: 78,
    conditions: [
      { fact: 'topic', operator: 'equals', value: 'programming' },
      { fact: 'subtopic', operator: 'equals', value: 'functions' },
    ],
    response: '🔧 **¿Qué es una función?**\n\nUna función es un bloque de código reutilizable que realiza una tarea específica.\n\n```python\ndef saludar(nombre):\n    return f"Hola, {nombre}!"\n\nresultado = saludar("Ana")\nprint(resultado)  # Hola, Ana!\n```\n\n**Partes de una función:**\n| Parte | Descripción |\n|-------|-------------|\n| `def` | Palabra clave para definir |\n| `saludar` | Nombre de la función |\n| `nombre` | Parámetro (entrada) |\n| `return` | Valor que devuelve |',
    followUp: '¿Quieres aprender sobre parámetros por defecto y *args/**kwargs?',
  },
  {
    name: 'conditionals_beginner', category: 'programming', priority: 78,
    conditions: [
      { fact: 'topic', operator: 'equals', value: 'programming' },
      { fact: 'subtopic', operator: 'equals', value: 'conditionals' },
    ],
    response: '🔀 **Condicionales (if/else)**\n\nPermiten ejecutar código solo si se cumple una condición.\n\n```python\nedad = 18\n\nif edad >= 18:\n    print("Eres mayor de edad")\nelif edad >= 13:\n    print("Eres adolescente")\nelse:\n    print("Eres menor de edad")\n```\n\n**Operadores de comparación:**\n| Operador | Significado |\n|----------|-------------|\n| `==` | Igual a |\n| `!=` | Diferente de |\n| `>` | Mayor que |\n| `<` | Menor que |\n| `>=` | Mayor o igual |\n| `<=` | Menor o igual |',
    followUp: '¿Te explico operadores lógicos (and, or, not)?',
  },
  {
    name: 'oop_beginner', category: 'programming', priority: 76,
    conditions: [
      { fact: 'topic', operator: 'equals', value: 'programming' },
      { fact: 'subtopic', operator: 'equals', value: 'oop' },
    ],
    response: '🏗️ **Programación Orientada a Objetos (POO)**\n\nLa POO organiza el código en **objetos** que combinan datos y comportamiento.\n\n```python\nclass Perro:\n    def __init__(self, nombre, raza):\n        self.nombre = nombre\n        self.raza = raza\n\n    def ladrar(self):\n        return f"{self.nombre} dice: ¡Guau!"\n\nmi_perro = Perro("Max", "Labrador")\nprint(mi_perro.ladrar())  # Max dice: ¡Guau!\n```\n\n**Los 4 pilares de la POO:**\n| Pilar | Significado |\n|-------|-------------|\n| Encapsulamiento | Ocultar datos internos |\n| Herencia | Reutilizar código de otra clase |\n| Polimorfismo | Mismo método, distintos comportamientos |\n| Abstracción | Simplificar complejidad |',
    followUp: '¿Te explico herencia con un ejemplo práctico?',
  },
  {
    name: 'recursion_beginner', category: 'programming', priority: 77,
    conditions: [
      { fact: 'topic', operator: 'equals', value: 'programming' },
      { fact: 'subtopic', operator: 'equals', value: 'recursion' },
    ],
    response: '🔄 **¿Qué es la recursión?**\n\nLa recursión es cuando una función **se llama a sí misma** para resolver un problema dividiéndolo en partes más pequeñas.\n\n```python\ndef factorial(n):\n    if n <= 1:        # Caso base\n        return 1\n    return n * factorial(n - 1)  # Llamada recursiva\n\nprint(factorial(5))  # 120\n```\n\n**Ejecución paso a paso:**\n```\nfactorial(5) = 5 × factorial(4)\n             = 5 × 4 × factorial(3)\n             = 5 × 4 × 3 × factorial(2)\n             = 5 × 4 × 3 × 2 × factorial(1)\n             = 5 × 4 × 3 × 2 × 1 = 120\n```\n\n⚠️ **Siempre necesitas un caso base** para evitar recursión infinita.',
    followUp: '¿Quieres ver la secuencia de Fibonacci con recursión?',
  },
  {
    name: 'async_programming', category: 'programming', priority: 85,
    conditions: [
      { fact: 'topic', operator: 'equals', value: 'programming' },
      { fact: 'subtopic', operator: 'equals', value: 'async_programming' },
    ],
    response: '⚡ **Async/Await en JavaScript**\n\n`async/await` hace el código asíncrono más legible.\n\n```javascript\n// Con Promises\nfetch("/api/datos")\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));\n\n// Con async/await\nasync function cargarDatos() {\n  try {\n    const res = await fetch("/api/datos");\n    const data = await res.json();\n    console.log(data);\n  } catch (err) {\n    console.error(err);\n  }\n}\n```\n\n**Ejecutar en paralelo:**\n```javascript\nconst [usuarios, productos] = await Promise.all([\n  fetch("/api/usuarios").then(r => r.json()),\n  fetch("/api/productos").then(r => r.json()),\n]);\n```',
    followUp: '¿Quieres ver cómo manejar errores avanzados con async/await?',
  },
  {
    name: 'arrays_beginner', category: 'programming', priority: 77,
    conditions: [
      { fact: 'topic', operator: 'equals', value: 'programming' },
      { fact: 'subtopic', operator: 'equals', value: 'arrays' },
    ],
    response: '📦 **Arrays / Listas**\n\nUn array es una colección ordenada de elementos.\n\n```python\nfrutas = ["manzana", "pera", "uva"]\n\n# Acceder por índice (empieza en 0)\nprint(frutas[0])   # manzana\nprint(frutas[-1])  # uva (último)\n\n# Agregar\nfrutas.append("naranja")\n\n# Recorrer\nfor fruta in frutas:\n    print(fruta)\n```\n\n**Métodos útiles:**\n| Método | Acción |\n|--------|--------|\n| `append(x)` | Agrega al final |\n| `pop()` | Elimina el último |\n| `sort()` | Ordena la lista |\n| `len(lista)` | Cantidad de elementos |\n| `x in lista` | ¿Está x en la lista? |',
    followUp: '¿Te explico list comprehensions para crear listas de forma avanzada?',
  },
  // ── MATH ──
  {
    name: 'derivatives_beginner', category: 'math', priority: 80,
    conditions: [
      { fact: 'topic', operator: 'equals', value: 'math' },
      { fact: 'subtopic', operator: 'equals', value: 'derivatives' },
    ],
    response: '📐 **¿Qué es una derivada?**\n\nLa derivada mide **qué tan rápido cambia** una función. Es la pendiente de la recta tangente.\n\n**Reglas básicas:**\n| Función | Derivada | Ejemplo |\n|---------|----------|---------|\n| xⁿ | n·xⁿ⁻¹ | x³ → 3x² |\n| constante | 0 | 5 → 0 |\n| eˣ | eˣ | eˣ → eˣ |\n| ln(x) | 1/x | ln(x) → 1/x |\n| sin(x) | cos(x) | sin(x) → cos(x) |\n| cos(x) | -sin(x) | cos(x) → -sin(x) |\n\n**Ejemplo paso a paso:**\nf(x) = 3x² + 2x + 1\n\n1. Derivada de 3x² → 6x\n2. Derivada de 2x → 2\n3. Derivada de 1 → 0\n4. **f\'(x) = 6x + 2** ✓',
    followUp: '¿Quieres aprender la Regla de la Cadena?',
  },
  {
    name: 'integrals_beginner', category: 'math', priority: 78,
    conditions: [
      { fact: 'topic', operator: 'equals', value: 'math' },
      { fact: 'subtopic', operator: 'equals', value: 'integrals' },
    ],
    response: '∫ **¿Qué es una integral?**\n\nLa integral es la operación **inversa de la derivada**. Representa el **área bajo una curva**.\n\n**Reglas básicas:**\n| Función | Integral |\n|---------|----------|\n| xⁿ | xⁿ⁺¹/(n+1) + C |\n| 1/x | ln|x| + C |\n| eˣ | eˣ + C |\n| sin(x) | -cos(x) + C |\n| cos(x) | sin(x) + C |\n\n**Ejemplo:**\n∫(3x² + 2x) dx = x³ + x² + C\n\n**Integral definida (área):**\n∫₀² x² dx = [x³/3]₀² = 8/3 − 0 = **8/3**',
    followUp: '¿Te explico el método de sustitución (u-substitution)?',
  },
  {
    name: 'limits_beginner', category: 'math', priority: 76,
    conditions: [
      { fact: 'topic', operator: 'equals', value: 'math' },
      { fact: 'subtopic', operator: 'equals', value: 'limits' },
    ],
    response: '📏 **¿Qué es un límite?**\n\nUn límite describe el valor al que se **acerca** una función cuando x se acerca a un punto.\n\n**Notación:** lím(x→a) f(x) = L\n\n**Ejemplo:**\nlím(x→2) (x² - 4)/(x - 2)\n= lím(x→2) (x+2)(x-2)/(x-2)\n= lím(x→2) (x+2) = **4**\n\n**Propiedades:**\n- lím [f ± g] = lím f ± lím g\n- lím [f · g] = lím f · lím g\n- lím [f/g] = lím f / lím g (si lím g ≠ 0)\n\n**Límites importantes:**\n| Límite | Valor |\n|--------|-------|\n| lím(x→0) sin(x)/x | 1 |\n| lím(x→∞) (1+1/x)ˣ | e |\n| lím(x→0) (eˣ-1)/x | 1 |',
    followUp: '¿Quieres aprender sobre continuidad y su relación con límites?',
  },
  {
    name: 'trigonometry_basics', category: 'math', priority: 72,
    conditions: [
      { fact: 'topic', operator: 'equals', value: 'math' },
      { fact: 'subtopic', operator: 'equals', value: 'trigonometry' },
    ],
    response: '📐 **Trigonometría — Fundamentos**\n\n**Ángulos especiales:**\n| Ángulo | sin | cos | tan |\n|--------|-----|-----|-----|\n| 0° | 0 | 1 | 0 |\n| 30° | 1/2 | √3/2 | 1/√3 |\n| 45° | √2/2 | √2/2 | 1 |\n| 60° | √3/2 | 1/2 | √3 |\n| 90° | 1 | 0 | ∞ |\n\n**Identidades fundamentales:**\n- **sin²(θ) + cos²(θ) = 1**\n- tan(θ) = sin(θ)/cos(θ)\n- sin(2θ) = 2·sin(θ)·cos(θ)\n- cos(2θ) = cos²(θ) − sin²(θ)',
    followUp: '¿Quieres practicar con la Ley de Senos o Cosenos?',
  },
  {
    name: 'algebra_basics', category: 'math', priority: 74,
    conditions: [
      { fact: 'topic', operator: 'equals', value: 'math' },
      { fact: 'subtopic', operator: 'equals', value: 'algebra' },
    ],
    response: '🔢 **Álgebra — Fundamentos**\n\n**Resolver ecuaciones lineales:**\n```\n2x + 5 = 13\n2x = 13 - 5\n2x = 8\nx = 4\n```\n\n**Ecuación cuadrática:** ax² + bx + c = 0\n\nFórmula general:\nx = (-b ± √(b²-4ac)) / 2a\n\n**Ejemplo:** x² - 5x + 6 = 0\n- a=1, b=-5, c=6\n- x = (5 ± √(25-24)) / 2\n- x = (5 ± 1) / 2\n- **x₁ = 3, x₂ = 2**\n\n**Factorización:** x² - 5x + 6 = (x-3)(x-2)',
    followUp: '¿Te explico sistemas de ecuaciones?',
  },
  // ── NETWORKING ──
  {
    name: 'osi_model', category: 'networking', priority: 85,
    conditions: [
      { fact: 'topic', operator: 'equals', value: 'networking' },
      { fact: 'subtopic', operator: 'equals', value: 'osi_model' },
    ],
    response: '🌐 **Modelo OSI — Las 7 capas**\n\n| # | Capa | Función | Ejemplo |\n|---|------|---------|----------|\n| 7 | **Aplicación** | Interfaz con el usuario | HTTP, FTP, DNS |\n| 6 | **Presentación** | Formato y cifrado | SSL/TLS, JPEG |\n| 5 | **Sesión** | Gestiona conexiones | NetBIOS, RPC |\n| 4 | **Transporte** | Entrega confiable | TCP, UDP |\n| 3 | **Red** | Enrutamiento | IP, ICMP |\n| 2 | **Enlace de datos** | Nodo a nodo | Ethernet, Wi-Fi |\n| 1 | **Física** | Señales eléctricas | Cables, hubs |\n\n**Mnemotécnico:**\n> **A**ll **P**eople **S**eem **T**o **N**eed **D**ata **P**rocessing\n\n💡 TCP/IP colapsa las capas 5,6,7 en una sola capa de Aplicación.',
    followUp: '¿Quieres que profundice en alguna capa específica?',
  },
  {
    name: 'tcp_ip_basics', category: 'networking', priority: 80,
    conditions: [
      { fact: 'topic', operator: 'equals', value: 'networking' },
      { fact: 'subtopic', operator: 'equals', value: 'tcp_ip' },
    ],
    response: '🔗 **TCP vs UDP**\n\n| Característica | TCP | UDP |\n|---------------|-----|-----|\n| Conexión | Orientado a conexión | Sin conexión |\n| Confiabilidad | Garantiza entrega | No garantiza |\n| Velocidad | Más lento | Más rápido |\n| Uso | HTTP, correo, archivos | Streaming, juegos, DNS |\n\n**Three-Way Handshake (TCP):**\n```\nCliente         Servidor\n  |---SYN-------->|\n  |<--SYN-ACK----|\n  |---ACK-------->|\n  |  (conexión)  |\n```',
    followUp: '¿Quieres aprender sobre subnetting y máscaras de red?',
  },
  // ── Generic topic fallbacks (lower priority) ──
  {
    name: 'general_programming', category: 'programming', priority: 30,
    conditions: [
      { fact: 'topic', operator: 'equals', value: 'programming' },
    ],
    response: '💻 **Programación**\n\nPuedo ayudarte con estos temas:\n\n- 🔁 **Bucles** (for, while)\n- 🔧 **Funciones** y parámetros\n- 🔀 **Condicionales** (if/else)\n- 📦 **Arrays/Listas**\n- 🏗️ **POO** (clases, objetos)\n- 🔄 **Recursión**\n- ⚡ **Async/Await**\n\n¿Sobre cuál te gustaría aprender?',
  },
  {
    name: 'general_math', category: 'math', priority: 30,
    conditions: [
      { fact: 'topic', operator: 'equals', value: 'math' },
    ],
    response: '📐 **Matemáticas**\n\nPuedo ayudarte con:\n\n- 📏 **Límites**\n- 📐 **Derivadas**\n- ∫ **Integrales**\n- 🔢 **Álgebra** y ecuaciones\n- 📐 **Trigonometría**\n\n¿Qué tema te interesa?',
  },
  {
    name: 'general_networking', category: 'networking', priority: 30,
    conditions: [
      { fact: 'topic', operator: 'equals', value: 'networking' },
    ],
    response: '🌐 **Redes**\n\nPuedo ayudarte con:\n\n- 🌐 **Modelo OSI** (7 capas)\n- 🔗 **TCP/IP** y protocolos\n- 📡 Conceptos de redes\n\n¿Sobre qué quieres aprender?',
  },
];

// ─── Main Handler ─────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message } = req.body ?? {};
    if (!message) return res.status(400).json({ error: 'Missing message field' });

    const facts = extractFacts(message);
    const result = runEngine(facts, RULES);

    return res.status(200).json({
      respuesta: result.response,
      source: result.matched ? 'expert_system' : 'no_match',
      rule: result.rule?.name ?? null,
      facts,
    });

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error('[ExpertSystem] Error:', errMsg);
    return res.status(500).json({ error: 'Internal server error', details: errMsg });
  }
}
