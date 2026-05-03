import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Tipos ────────────────────────────────────────────────────────
interface Hecho { clave: string; valor: string; }

interface CondicionRegla {
  hecho: string;
  operador: 'igual' | 'contiene' | 'en' | 'no_igual';
  valor: string | string[];
}

interface ReglaExperta {
  nombre: string;
  categoria: string;
  condiciones: CondicionRegla[];
  respuesta: string;
  respuestaExperto?: string;
  seguimiento?: string;
  prioridad: number;
}
// ─── Diccionarios de Palabras Clave ───────────────────────────────
const PALABRAS_TEMA: Record<string, string[]> = {
  programming: ['programacion','codigo','funcion','variable','array','loop','bucle','for','while','if','else','clase','objeto','python','javascript','java','c++','typescript','html','css','react','algoritmo','recursion','closure','promise','async','api','git','debug'],
  math: ['matematicas','ecuacion','integral','derivada','limite','matriz','vector','trigonometria','seno','coseno','algebra','calculo','geometria','probabilidad','estadistica','logaritmo','exponencial','polinomio','factorial'],
  networking: ['red','redes','osi','tcp','ip','protocolo','router','switch','firewall','dns','http','https','puerto','subred','ethernet','wifi'],
};

const PALABRAS_SUBTEMA: Record<string, string[]> = {
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

const PALABRAS_INTENCION: Record<string, string[]> = {
  explain: ['explica','explicame','que es','que son','como funciona','describe','definicion','define'],
  solve: ['resuelve','calcula','encuentra','haz','resolveme','solucion','resolver'],
  example: ['ejemplo','muestrame','demuestra','practica','ejercicio'],
  compare: ['diferencia','comparar','vs','versus','mejor','cual es mejor'],
};

const FRASES_PRINCIPIANTE = ['no se nada', 'soy nuevo', 'soy principiante', 'empezando', 'basico', 'facil', 'explicame como a un nino', 'no entiendo', 'desde cero', 'primera vez'];
const FRASES_EXPERTO = ['soy experto', 'avanzado', 'nivel alto', 'experiencia', 'senior', 'detallado', 'complejo', 'profundidad', 'tecnico', 'profesional', 'optimizado'];

// ─── Extractor de Hechos ──────────────────────────────────────────
function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function detectarNivel(mensajeNormalizado: string): string {
  const esPrincipiante = FRASES_PRINCIPIANTE.some(f => mensajeNormalizado.includes(f));
  const esExperto = FRASES_EXPERTO.some(f => mensajeNormalizado.includes(f));
  if (esExperto && !esPrincipiante) return 'experto';
  if (esPrincipiante && !esExperto) return 'principiante';
  return 'intermedio';
}

function extraerHechos(mensaje: string): Hecho[] {
  const msg = normalizar(mensaje);
  const hechos: Hecho[] = [];

  for (const [t, pcs] of Object.entries(PALABRAS_TEMA)) {
    if (pcs.some(p => msg.includes(p))) { hechos.push({ clave: 'tema', valor: t }); break; }
  }
  for (const [s, pcs] of Object.entries(PALABRAS_SUBTEMA)) {
    if (pcs.some(p => msg.includes(p))) { hechos.push({ clave: 'subtema', valor: s }); break; }
  }
  for (const [i, pcs] of Object.entries(PALABRAS_INTENCION)) {
    if (pcs.some(p => msg.includes(p))) { hechos.push({ clave: 'intencion', valor: i }); break; }
  }

  const nivel = detectarNivel(msg);
  hechos.push({ clave: 'nivel', valor: nivel });
  return hechos;
}

// ─── Evaluador de Condiciones ─────────────────────────────────────
function evaluarCondicion(c: CondicionRegla, hechos: Hecho[]): boolean {
  const h = hechos.find(x => x.clave === c.hecho);
  if (!h) return false;
  switch (c.operador) {
    case 'igual': return h.valor === c.valor;
    case 'contiene': return h.valor.includes(c.valor as string);
    case 'en': return Array.isArray(c.valor) && c.valor.includes(h.valor);
    case 'no_igual': return h.valor !== c.valor;
    default: return false;
  }
}

// ─── Motor de Inferencia ──────────────────────────────────────────
function ejecutarMotor(hechos: Hecho[], reglas: ReglaExperta[]): { coincidio: boolean; regla?: ReglaExperta; respuesta: string } {
  const coincidencias = reglas.filter(r => r.condiciones.every(c => evaluarCondicion(c, hechos)));

  if (coincidencias.length === 0) {
    return { coincidio: false, respuesta: '🤔 No tengo una respuesta específica para eso. Puedo ayudarte con **programación**, **matemáticas** y **redes**. ¿Podrías reformular tu pregunta?' };
  }

  const mejor = coincidencias.sort((a, b) => b.prioridad !== a.prioridad ? b.prioridad - a.prioridad : b.condiciones.length - a.condiciones.length)[0];

  // Seleccionar respuesta segun nivel del usuario
  const nivelUsuario = hechos.find(h => h.clave === 'nivel')?.valor;
  let resp = (nivelUsuario === 'experto' && mejor.respuestaExperto) ? mejor.respuestaExperto : mejor.respuesta;
  if (mejor.seguimiento) resp += `\n\n---\n💡 ${mejor.seguimiento}`;

  return { coincidio: true, regla: mejor, respuesta: resp };
}

// ─── Base de Conocimientos (Reglas) ─────────────────────────────
const REGLAS: ReglaExperta[] = [
  {
    nombre: 'for_loop_beginner', categoria: 'programming', prioridad: 80,
    condiciones: [
      { hecho: 'tema', operador: 'igual', valor: 'programming' },
      { hecho: 'subtema', operador: 'igual', valor: 'loops' },
    ],
    respuesta: '🔁 **¿Qué es un bucle `for`?**\n\nUn bucle `for` repite un bloque de código un número definido de veces.\n\n```python\nfor i in range(5):\n    print(f"Iteración {i}")\n```\n\n**Resultado:**\n```\nIteración 0\nIteración 1\nIteración 2\nIteración 3\nIteración 4\n```\n\n💡 **Tip:** `range(5)` genera los números del **0 al 4** (el 5 no se incluye).\n\n**Estructura general:**\n```python\nfor variable in secuencia:\n    # código a repetir\n```',
    respuestaExperto: '🔁 **Bucle `for` (Avanzado)**\n\nEn Python, el `for` itera sobre cualquier objeto iterable usando el protocolo de iteradores (`__iter__` y `__next__`).\n\n```python\n# Iteración sobre diccionario\ndata = {"a": 1, "b": 2}\nfor key, val in data.items():\n    print(f"{key}: {val}")\n\n# Usando list comprehensions (más eficiente)\ncuadrados = [x**2 for x in range(10)]\n```\n\nSe pueden usar `break` y `continue` para alterar el flujo, e incluso una cláusula `else` que se ejecuta si no ocurre un `break`.',
    seguimiento: '¿Quieres que te explique el bucle `while` también?',
  },
  {
    nombre: 'functions_beginner', categoria: 'programming', prioridad: 78,
    condiciones: [
      { hecho: 'tema', operador: 'igual', valor: 'programming' },
      { hecho: 'subtema', operador: 'igual', valor: 'functions' },
    ],
    respuesta: '🔧 **¿Qué es una función?**\n\nUna función es un bloque de código reutilizable que realiza una tarea específica.\n\n```python\ndef saludar(nombre):\n    return f"Hola, {nombre}!"\n\nresultado = saludar("Ana")\nprint(resultado)  # Hola, Ana!\n```\n\n**Partes de una función:**\n| Parte | Descripción |\n|-------|-------------|\n| `def` | Palabra clave para definir |\n| `saludar` | Nombre de la función |\n| `nombre` | Parámetro (entrada) |\n| `return` | Valor que devuelve |',
    respuestaExperto: '🔧 **Funciones (Avanzado)**\n\nLas funciones en JS/Python son objetos de primera clase. Se pueden pasar como argumentos (callbacks), retornar de otras funciones (closures), o asignarlas a variables.\n\n```javascript\nconst crearMultiplicador = (factor) => (numero) => numero * factor;\nconst duplicar = crearMultiplicador(2);\nconsole.log(duplicar(5)); // 10\n```\nEn Python, considera también decoradores para extender comportamiento.',
    seguimiento: '¿Quieres aprender sobre closures o funciones lambda?',
  },
  {
    nombre: 'conditionals_beginner', categoria: 'programming', prioridad: 78,
    condiciones: [
      { hecho: 'tema', operador: 'igual', valor: 'programming' },
      { hecho: 'subtema', operador: 'igual', valor: 'conditionals' },
    ],
    respuesta: '🔀 **Condicionales (if/else)**\n\nPermiten ejecutar código solo si se cumple una condición.\n\n```python\nedad = 18\n\nif edad >= 18:\n    print("Eres mayor de edad")\nelif edad >= 13:\n    print("Eres adolescente")\nelse:\n    print("Eres menor de edad")\n```\n\n**Operadores de comparación:**\n| Operador | Significado |\n|----------|-------------|\n| `==` | Igual a |\n| `!=` | Diferente de |\n| `>` | Mayor que |\n| `<` | Menor que |\n| `>=` | Mayor o igual |\n| `<=` | Menor o igual |',
    respuestaExperto: '🔀 **Condicionales Avanzados**\n\nEn lugar de usar múltiples if/else, considera estructuras más eficientes:\n- **Operadores ternarios**: `const estado = (edad >= 18) ? "Mayor" : "Menor";`\n- **Pattern Matching (Python 3.10+)**:\n  ```python\n  match status_code:\n      case 200:\n          return "OK"\n      case 404:\n          return "No encontrado"\n      case _: \n          return "Desconocido"\n  ```\n- **Polimorfismo / Diccionarios**: Reemplaza switches complejos con objetos de mapeo de funciones para seguir principios SOLID.',
    seguimiento: '¿Te explico operadores lógicos (and, or, not)?',
  },
  {
    nombre: 'oop_beginner', categoria: 'programming', prioridad: 76,
    condiciones: [
      { hecho: 'tema', operador: 'igual', valor: 'programming' },
      { hecho: 'subtema', operador: 'igual', valor: 'oop' },
    ],
    respuesta: '🏗️ **Programación Orientada a Objetos (POO)**\n\nLa POO organiza el código en **objetos** que combinan datos y comportamiento.\n\n```python\nclass Perro:\n    def __init__(self, nombre, raza):\n        self.nombre = nombre\n        self.raza = raza\n\n    def ladrar(self):\n        return f"{self.nombre} dice: ¡Guau!"\n\nmi_perro = Perro("Max", "Labrador")\nprint(mi_perro.ladrar())  # Max dice: ¡Guau!\n```\n\n**Los 4 pilares de la POO:**\n| Pilar | Significado |\n|-------|-------------|\n| Encapsulamiento | Ocultar datos internos |\n| Herencia | Reutilizar código de otra clase |\n| Polimorfismo | Mismo método, distintos comportamientos |\n| Abstracción | Simplificar complejidad |',
    respuestaExperto: '🏗️ **Arquitectura de POO (Avanzado)**\n\nMás allá de los 4 pilares, enfócate en **SOLID**:\n- **S**ingle Responsibility (Una clase, una razón para cambiar)\n- **O**pen/Closed (Abierto a extensión, cerrado a modificación)\n- **L**iskov Substitution (Subclases deben reemplazar a superclases sin romper nada)\n- **I**nterface Segregation (Múltiples interfaces específicas)\n- **D**ependency Inversion (Depender de abstracciones)\n\nConsidera también Composición sobre Herencia (Composition over Inheritance) para evitar jerarquías rígidas e inmanejables.',
    seguimiento: '¿Te explico herencia con un ejemplo práctico?',
  },
  {
    nombre: 'recursion_beginner', categoria: 'programming', prioridad: 77,
    condiciones: [
      { hecho: 'tema', operador: 'igual', valor: 'programming' },
      { hecho: 'subtema', operador: 'igual', valor: 'recursion' },
    ],
    respuesta: '🔄 **¿Qué es la recursión?**\n\nLa recursión es cuando una función **se llama a sí misma** para resolver un problema dividiéndolo en partes más pequeñas.\n\n```python\ndef factorial(n):\n    if n <= 1:        # Caso base\n        return 1\n    return n * factorial(n - 1)  # Llamada recursiva\n\nprint(factorial(5))  # 120\n```\n\n**Ejecución paso a paso:**\n```\nfactorial(5) = 5 × factorial(4)\n             = 5 × 4 × factorial(3)\n             = 5 × 4 × 3 × factorial(2)\n             = 5 × 4 × 3 × 2 × factorial(1)\n             = 5 × 4 × 3 × 2 × 1 = 120\n```\n\n⚠️ **Siempre necesitas un caso base** para evitar recursión infinita.',
    respuestaExperto: '🔄 **Recursión (Avanzado)**\n\nPara optimizar la recursión y evitar el `StackOverflow` (límite del call stack), puedes usar:\n\n1. **Memoización (Dynamic Programming)**: Cachear resultados intermedios. Ej. en Python `@lru_cache`.\n2. **Tail Call Optimization (TCO)**: Si la llamada recursiva es la última operación, algunos lenguajes (como ciertos engines de JS o Elixir) no añaden un nuevo frame al stack. En lenguajes sin TCO (como Python), es mejor usar enfoques iterativos para grandes entradas.\n\nEjemplo de Tail Recursion:\n```javascript\nfunction factorial(n, acc = 1) {\n    if (n <= 1) return acc;\n    return factorial(n - 1, n * acc);\n}\n```',
    seguimiento: '¿Quieres ver la secuencia de Fibonacci con recursión?',
  },
  {
    nombre: 'async_programming', categoria: 'programming', prioridad: 85,
    condiciones: [
      { hecho: 'tema', operador: 'igual', valor: 'programming' },
      { hecho: 'subtema', operador: 'igual', valor: 'async_programming' },
    ],
    respuesta: '⚡ **Async/Await en JavaScript**\n\n`async/await` hace el código asíncrono más legible.\n\n```javascript\n// Con Promises\nfetch("/api/datos")\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));\n\n// Con async/await\nasync function cargarDatos() {\n  try {\n    const res = await fetch("/api/datos");\n    const data = await res.json();\n    console.log(data);\n  } catch (err) {\n    console.error(err);\n  }\n}\n```\n\n**Ejecutar en paralelo:**\n```javascript\nconst [usuarios, productos] = await Promise.all([\n  fetch("/api/usuarios").then(r => r.json()),\n  fetch("/api/productos").then(r => r.json()),\n]);\n```',
    respuestaExperto: '⚡ **Concurrencia y Asincronía Avanzada**\n\nEn entornos de un solo hilo (Event Loop en JS/Node):\n- `Promise.all` falla rápido. Si una falla, fallan todas. Usa `Promise.allSettled` si necesitas el estado de todas sin importar los errores.\n- Cuidado con bloquear el Event Loop con tareas de CPU intensivas. Para eso usa Worker Threads.\n\nEn Python (asyncio):\n- No bloquees el hilo asíncrono con I/O bloqueante (usa `run_in_executor`).\n- Aprovecha `asyncio.gather` para concurrencia masiva de I/O de red.\n- Los `TaskGroups` (Python 3.11+) permiten manejar errores concurrentes más elegantemente.',
    seguimiento: '¿Quieres ver cómo manejar errores avanzados con async/await?',
  },
  {
    nombre: 'arrays_beginner', categoria: 'programming', prioridad: 77,
    condiciones: [
      { hecho: 'tema', operador: 'igual', valor: 'programming' },
      { hecho: 'subtema', operador: 'igual', valor: 'arrays' },
    ],
    respuesta: '📦 **Arrays / Listas**\n\nUn array es una colección ordenada de elementos.\n\n```python\nfrutas = ["manzana", "pera", "uva"]\n\n# Acceder por índice (empieza en 0)\nprint(frutas[0])   # manzana\nprint(frutas[-1])  # uva (último)\n\n# Agregar\nfrutas.append("naranja")\n\n# Recorrer\nfor fruta in frutas:\n    print(fruta)\n```\n\n**Métodos útiles:**\n| Método | Acción |\n|--------|--------|\n| `append(x)` | Agrega al final |\n| `pop()` | Elimina el último |\n| `sort()` | Ordena la lista |\n| `len(lista)` | Cantidad de elementos |\n| `x in lista` | ¿Está x en la lista? |',
    respuestaExperto: '📦 **Estructuras de Datos: Arrays (Avanzado)**\n\nLos Arrays en memoria suelen ser bloques contiguos. Consideraciones de rendimiento (Big O):\n- **Acceso (Indexación)**: O(1)\n- **Búsqueda**: O(N) (O(log N) si está ordenado usando Binary Search)\n- **Inserción/Eliminación al final**: O(1) amortizado.\n- **Inserción/Eliminación al principio**: O(N) (debe desplazar todos los elementos).\n\nSi necesitas inserciones constantes en los extremos, utiliza `collections.deque` en Python (Double-Ended Queue) o LinkedLists.',
    seguimiento: '¿Te explico list comprehensions para crear listas de forma avanzada?',
  },
  // ── MATH ──
  {
    nombre: 'derivatives_beginner', categoria: 'math', prioridad: 80,
    condiciones: [
      { hecho: 'tema', operador: 'igual', valor: 'math' },
      { hecho: 'subtema', operador: 'igual', valor: 'derivatives' },
    ],
    respuesta: '📐 **¿Qué es una derivada?**\n\nLa derivada mide **qué tan rápido cambia** una función. Es la pendiente de la recta tangente.\n\n**Reglas básicas:**\n| Función | Derivada | Ejemplo |\n|---------|----------|---------|\n| xⁿ | n·xⁿ⁻¹ | x³ → 3x² |\n| constante | 0 | 5 → 0 |\n| eˣ | eˣ | eˣ → eˣ |\n| ln(x) | 1/x | ln(x) → 1/x |\n| sin(x) | cos(x) | sin(x) → cos(x) |\n| cos(x) | -sin(x) | cos(x) → -sin(x) |\n\n**Ejemplo paso a paso:**\nf(x) = 3x² + 2x + 1\n\n1. Derivada de 3x² → 6x\n2. Derivada de 2x → 2\n3. Derivada de 1 → 0\n4. **f\'(x) = 6x + 2** ✓',
    respuestaExperto: '📐 **Cálculo Diferencial (Avanzado)**\n\nLa derivada se define formalmente mediante límites:\n`f\'(x) = lím(h→0) [f(x+h) - f(x)] / h`\n\nAplicaciones avanzadas:\n- **Gradientes (∇f)**: Vector de derivadas parciales, crucial en Machine Learning (Gradient Descent) para encontrar mínimos de funciones de costo.\n- **Matriz Jacobiana y Hessiana**: Usadas para optimización multivariable y análisis de curvatura.\n- **Regla de la Cadena Compleja**: Para derivación implícita y funciones compuestas multivariables.',
    seguimiento: '¿Quieres aprender la Regla de la Cadena?',
  },
  {
    nombre: 'integrals_beginner', categoria: 'math', prioridad: 78,
    condiciones: [
      { hecho: 'tema', operador: 'igual', valor: 'math' },
      { hecho: 'subtema', operador: 'igual', valor: 'integrals' },
    ],
    respuesta: '∫ **¿Qué es una integral?**\n\nLa integral es la operación **inversa de la derivada**. Representa el **área bajo una curva**.\n\n**Reglas básicas:**\n| Función | Integral |\n|---------|----------|\n| xⁿ | xⁿ⁺¹/(n+1) + C |\n| 1/x | ln|x| + C |\n| eˣ | eˣ + C |\n| sin(x) | -cos(x) + C |\n| cos(x) | sin(x) + C |\n\n**Ejemplo:**\n∫(3x² + 2x) dx = x³ + x² + C\n\n**Integral definida (área):**\n∫₀² x² dx = [x³/3]₀² = 8/3 − 0 = **8/3**',
    respuestaExperto: '∫ **Cálculo Integral (Avanzado)**\n\nFormalmente es la suma de Riemann. Aplicaciones avanzadas:\n- **Integración Múltiple**: Integrales dobles y triples para calcular volúmenes, masa y centros de masa en física multidimensional.\n- **Teorema Fundamental del Cálculo**: Conecta derivación e integración.\n- **Métodos Numéricos**: Cuando no hay antiderivada analítica, usamos Cuadratura Gaussiana o método de Simpson.\n- **Transformadas (Laplace/Fourier)**: Integrales impropias esenciales en procesamiento de señales y sistemas de control dinámico.',
    seguimiento: '¿Te explico el método de sustitución (u-substitution)?',
  },
  {
    nombre: 'general_programming', categoria: 'programming', prioridad: 30,
    condiciones: [
      { hecho: 'tema', operador: 'igual', valor: 'programming' },
    ],
    respuesta: '💻 **Programación**\n\nPuedo ayudarte con estos temas:\n\n- 🔁 **Bucles** (for, while)\n- 🔧 **Funciones** y parámetros\n- 🔀 **Condicionales** (if/else)\n- 📦 **Arrays/Listas**\n- 🏗️ **POO** (clases, objetos)\n- 🔄 **Recursión**\n- ⚡ **Async/Await**\n\n¿Sobre cuál te gustaría aprender?',
    respuestaExperto: '💻 **Programación (Nivel Experto)**\n\nPara temas avanzados, podemos discutir:\n\n- Arquitectura de Software (Microservicios, DDD, Event-Driven)\n- Patrones de Diseño (GoF, Concurrencia)\n- Optimización y Complejidad Algorítmica (Big O, grafos, programación dinámica)\n- CI/CD, Docker, Kubernetes y DevOps\n\n¿En qué área compleja estás trabajando?',
  },
  {
    nombre: 'general_math', categoria: 'math', prioridad: 30,
    condiciones: [
      { hecho: 'tema', operador: 'igual', valor: 'math' },
    ],
    respuesta: '📐 **Matemáticas**\n\nPuedo ayudarte con:\n\n- 📏 **Límites**\n- 📐 **Derivadas**\n- ∫ **Integrales**\n- 🔢 **Álgebra** y ecuaciones\n- 📐 **Trigonometría**\n\n¿Qué tema te interesa?',
    respuestaExperto: '📐 **Matemáticas (Avanzado)**\n\nPodemos explorar temas complejos como:\n\n- Cálculo Vectorial (Gradientes, Divergencia, Rotacional)\n- Álgebra Lineal Computacional (SVD, Eigenvalores, Descomposiciones)\n- Ecuaciones Diferenciales Ordinarias y Parciales\n- Probabilidad Aplicada y Estadística Bayesiana\n\n¿Qué concepto matemático complejo necesitas resolver?',
  },
  {
    nombre: 'general_networking', categoria: 'networking', prioridad: 30,
    condiciones: [
      { hecho: 'tema', operador: 'igual', valor: 'networking' },
    ],
    respuesta: '🌐 **Redes**\n\nPuedo ayudarte con:\n\n- 🌐 **Modelo OSI** (7 capas)\n- 🔗 **TCP/IP** y protocolos\n- 📡 Conceptos de redes\n\n¿Sobre qué quieres aprender?',
    respuestaExperto: '🌐 **Redes (Avanzado)**\n\nPuedo ayudarte con la arquitectura de red y sistemas distribuidos:\n\n- Enrutamiento Dinámico (BGP, OSPF)\n- Arquitecturas Zero Trust y Seguridad en Capa 7\n- Criptografía de red (TLS 1.3 handshake, IPSec)\n- SD-WAN y Virtualización de red\n\n¿Qué protocolo avanzado estamos analizando?',
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

    const hechos = extraerHechos(message);
    const resultado = ejecutarMotor(hechos, REGLAS);

    return res.status(200).json({
      respuesta: resultado.respuesta,
      source: resultado.coincidio ? 'expert_system' : 'no_match',
      rule: resultado.regla?.nombre ?? null,
      facts: hechos,
    });

  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error('[ExpertSystem] Error:', errMsg);
    return res.status(500).json({ error: 'Internal server error', details: errMsg });
  }
}
