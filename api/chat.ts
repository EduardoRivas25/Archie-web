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
  respuesta?: string;
  respuestaExperto?: string;
  respuestaFacil?: string;
  respuestaMedio?: string;
  respuestaPro?: string;
  seguimiento?: string;
  prioridad: number;
}
// ─── Diccionarios de Palabras Clave ───────────────────────────────
const PALABRAS_TEMA: Record<string, string[]> = {
  programming: ['programacion','codigo','funcion','variable','array','loop','bucle','for','while','if','else','clase','objeto','python','javascript','java','c++','typescript','html','css','react','algoritmo','recursion','closure','promise','async','api','git','debug','pila','cola','arbol','grafo','singleton','docker','test','testing','design pattern'],
  math: ['matematicas','ecuacion','integral','derivada','limite','matriz','vector','trigonometria','seno','coseno','algebra','calculo','geometria','probabilidad','estadistica','logaritmo','exponencial','polinomio','factorial','complejo','imaginario','area','perimetro','circulo','triangulo','pitagoras'],
  networking: ['red','redes','osi','tcp','ip','protocolo','router','switch','firewall','dns','http','https','puerto','subred','ethernet','wifi'],
  conversational: ['hola', 'buenos', 'buenas', 'que tal', 'saludos', 'hey', 'gracias', 'agradezco', 'adios', 'chao', 'vemos', 'hasta luego', 'bye'],
};

const PALABRAS_SUBTEMA: Record<string, string[]> = {
  loops: ['for','while','bucle','loop','iteracion','recorrer','repetir','ciclo'],
  functions: ['funcion','function','def','return','parametro','argumento','metodo'],
  arrays: ['array','arreglo','lista','list','push','pop','map','filter'],
  conditionals: ['if','else','condicion','switch','ternario','condicional'],
  oop: ['clase','class','objeto','herencia','polimorfismo','encapsulamiento','instancia'],
  recursion: ['recursion','recursiva','recursivo','caso base','llamada recursiva'],
  async_programming: ['async','await','promise','promesa','asincrono','callback','then','catch'],
  git: ['git', 'commit', 'push', 'pull', 'merge', 'rama', 'branch', 'repositorio', 'rebase'],
  apis: ['api', 'rest', 'json', 'endpoint', 'fetch', 'axios', 'get', 'post', 'http', 'graphql'],
  databases: ['sql', 'base de datos', 'select', 'join', 'nosql', 'mongodb', 'mysql', 'postgres', 'query'],
  derivatives: ['derivada','derivative','diferencial','dx','regla cadena','derivar'],
  integrals: ['integral','antiderivada','area bajo curva','integracion','integrar'],
  limits: ['limite','limit','tiende','lim','continuidad','infinito'],
  algebra: ['ecuacion','despejar','factorizar','polinomio','sistema ecuaciones'],
  trigonometry: ['seno','coseno','tangente','trigonometria','angulo','radian','sen','cos','tan'],
  matrices: ['matriz', 'matrices', 'determinante', 'inversa', 'rango', 'eigenvalor', 'vector', 'gauss'],
  statistics: ['estadistica', 'probabilidad', 'media', 'mediana', 'varianza', 'desviacion', 'distribucion', 'bayes'],
  osi_model: ['osi','capas osi','modelo osi','siete capas','7 capas'],
  tcp_ip: ['tcp','udp','protocolo internet','ipv4','ipv6','handshake'],
  data_structures: ['pila', 'cola', 'arbol', 'grafo', 'stack', 'queue', 'linked list', 'lista enlazada', 'nodo', 'estructura de datos'],
  design_patterns: ['patron de diseno', 'singleton', 'factory', 'observer', 'builder', 'decorator', 'mvc'],
  testing: ['test', 'prueba unitaria', 'testing', 'unit test', 'jest', 'mocha', 'cypress', 'junit', 'assert'],
  docker_devops: ['docker', 'contenedor', 'kubernetes', 'k8s', 'ci/cd', 'devops', 'pipelines', 'ansible', 'terraform'],
  geometry: ['geometria', 'area', 'perimetro', 'volumen', 'triangulo', 'circulo', 'pitagoras', 'poligono'],
  complex_numbers: ['numero complejo', 'imaginario', 'complejos', 'parte real', 'parte imaginaria', 'i', 'fase', 'modulo'],
  greeting: ['hola', 'buenos', 'buenas', 'que tal', 'saludos', 'hey'],
  thanks: ['gracias', 'agradezco', 'te lo agradezco', 'perfecto'],
  goodbye: ['adios', 'chao', 'nos vemos', 'hasta luego', 'bye', 'pronto'],
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

  const nivelUsuario = hechos.find(h => h.clave === 'nivel')?.valor || 'medio';

  if (coincidencias.length === 0) {
    let fallback = '🤔 No tengo una respuesta específica para eso. Puedo ayudarte con **programación**, **matemáticas** y **redes**. ¿Podrías reformular tu pregunta?';
    if (nivelUsuario === 'facil') fallback = '🤔 Mmm, no estoy seguro de entenderte. Pero soy experto en cosas de programación, matemáticas y redes. ¿De qué te gustaría hablar?';
    if (nivelUsuario === 'pro') fallback = '⚠️ Input no reconocido. Por favor provea un contexto técnico sobre programación algorítmica, matemáticas o arquitectura de redes.';
    return { coincidio: false, respuesta: fallback };
  }

  const mejor = coincidencias.sort((a, b) => b.prioridad !== a.prioridad ? b.prioridad - a.prioridad : b.condiciones.length - a.condiciones.length)[0];

  let resp = mejor.respuestaMedio || mejor.respuesta || 'Sin respuesta';
  if (nivelUsuario === 'facil') resp = mejor.respuestaFacil || mejor.respuesta || 'Sin respuesta';
  if (nivelUsuario === 'pro') resp = mejor.respuestaPro || mejor.respuestaExperto || mejor.respuesta || 'Sin respuesta';

  if (mejor.seguimiento) resp += `\n\n---\n💡 ${mejor.seguimiento}`;

  return { coincidio: true, regla: mejor, respuesta: resp };
}

// ─── Base de Conocimientos (Reglas) ─────────────────────────────
const REGLAS: ReglaExperta[] = [
  {
    nombre: 'saludo', categoria: 'conversational', prioridad: 100,
    condiciones: [ { hecho: 'subtema', operador: 'igual', valor: 'greeting' } ],
    respuestaFacil: '¡Hola! Qué gusto saludarte 👋. Soy Archie, tu asistente virtual. ¿En qué te puedo ayudar de forma súper sencilla hoy?',
    respuestaMedio: '¡Hola! Soy Archie, listo para ayudarte a resolver tus dudas con explicaciones claras. ¿Qué tienes en mente?',
    respuestaPro: 'Saludos. Soy Archie. Estoy optimizado para resolver problemas avanzados de programación, matemáticas y redes. Inicializando sesión...',
  },
  {
    nombre: 'despedida', categoria: 'conversational', prioridad: 100,
    condiciones: [ { hecho: 'subtema', operador: 'igual', valor: 'goodbye' } ],
    respuestaFacil: '¡Adiós! 👋 Cuídate mucho y vuelve pronto. Me encantó ayudarte.',
    respuestaMedio: '¡Hasta luego! Si tienes más dudas después, aquí estaré.',
    respuestaPro: 'Hasta la próxima. El sistema cerrará la sesión cuando estés listo. [Exit code 0]',
  },
  {
    nombre: 'agradecimiento', categoria: 'conversational', prioridad: 100,
    condiciones: [ { hecho: 'subtema', operador: 'igual', valor: 'thanks' } ],
    respuestaFacil: '¡De nada! Es un placer inmenso poder ayudarte. ¡Pregúntame lo que quieras! ✨',
    respuestaMedio: '¡Con gusto! Me alegra que la información te haya sido útil.',
    respuestaPro: 'A tu disposición. Seguimos iterando sobre cualquier otro requerimiento que tengas.',
  },
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
    nombre: 'git_basics', categoria: 'programming', prioridad: 82,
    condiciones: [ { hecho: 'tema', operador: 'igual', valor: 'programming' }, { hecho: 'subtema', operador: 'igual', valor: 'git' } ],
    respuestaFacil: '🐙 **Git y GitHub**\n\nGit es como un punto de guardado en los videojuegos para tu código. \n- `git add`: Preparar los archivos.\n- `git commit -m "mensaje"`: Guardar el progreso.\n- `git push`: Subirlo a internet (como GitHub).',
    respuestaMedio: '🐙 **Comandos de Git**\n\nGit te permite llevar control de versiones:\n```bash\ngit init          # Inicializar repositorio\ngit clone <url>   # Clonar proyecto\ngit add .         # Añadir cambios\ngit commit -m "x" # Crear versión\ngit push          # Subir cambios\ngit pull          # Bajar cambios\n```\nTambién puedes usar `git branch` para crear ramas separadas de trabajo.',
    respuestaPro: '🐙 **Git Avanzado (Flujos de trabajo)**\n\n- **Git Flow vs Trunk-Based**: Estrategias de ramificación para CI/CD.\n- **Rebase vs Merge**: `git rebase` reescribe el historial linealmente (evita spaghetti), `git merge` preserva el contexto de cuándo ocurrió la rama.\n- **Resolución de conflictos**: Uso de `git mergetool` o edición directa de los marcadores `<<<<<<< HEAD`.\n- **Cherry-pick**: Para extraer commits específicos de otra rama.',
  },
  {
    nombre: 'apis_basics', categoria: 'programming', prioridad: 82,
    condiciones: [ { hecho: 'tema', operador: 'igual', valor: 'programming' }, { hecho: 'subtema', operador: 'igual', valor: 'apis' } ],
    respuestaFacil: '🔌 **¿Qué es una API?**\n\nImagina que estás en un restaurante. Tú (el cliente) le pides comida al mesero (la API), y el mesero va a la cocina (el servidor) a buscarla y te la trae. ¡Así se comunican las aplicaciones!',
    respuestaMedio: '🔌 **APIs y REST**\n\nUna API (Interfaz de Programación de Aplicaciones) permite comunicar dos sistemas.\n- **GET**: Obtener datos.\n- **POST**: Enviar datos nuevos.\n- **PUT/PATCH**: Actualizar datos.\n- **DELETE**: Borrar datos.\n\nNormalmente responden en formato JSON.',
    respuestaPro: '🔌 **APIs y Microservicios**\n\n- **RESTful**: Estado sin representación, URIs limpias, métodos HTTP semánticos.\n- **GraphQL**: Resuelve el Over-fetching y Under-fetching de REST enviando consultas específicas.\n- **gRPC**: Basado en HTTP/2 y Protocol Buffers, ultra eficiente para comunicación interna.\n- **Autenticación**: JWT (JSON Web Tokens), OAuth 2.0 y manejo de CORS.',
  },
  {
    nombre: 'databases', categoria: 'programming', prioridad: 83,
    condiciones: [ { hecho: 'tema', operador: 'igual', valor: 'programming' }, { hecho: 'subtema', operador: 'igual', valor: 'databases' } ],
    respuestaFacil: '🗄️ **Bases de Datos**\n\nSon como hojas de Excel gigantes donde las apps guardan información.\n- **SQL**: Tablas muy ordenaditas (filas y columnas).\n- **NoSQL**: Cajas donde guardas cosas de forma más libre.',
    respuestaMedio: '🗄️ **SQL vs NoSQL**\n\n**SQL (Relacionales)**: Como MySQL o PostgreSQL. Usan tablas conectadas. Útiles para datos estructurados.\nEjemplo: `SELECT * FROM usuarios WHERE edad > 18;`\n\n**NoSQL (No Relacionales)**: Como MongoDB. Usan documentos JSON. Útiles para grandes volúmenes de datos rápidos de leer.',
    respuestaPro: '🗄️ **Arquitectura de Bases de Datos**\n\n- **ACID**: Atomicidad, Consistencia, Aislamiento y Durabilidad en bases SQL.\n- **Teorema CAP**: Consistencia, Disponibilidad, Tolerancia a Particiones. Solo puedes tener 2 de 3.\n- **Normalización vs Desnormalización**: Reducir redundancia vs optimizar lecturas.\n- **Índices**: B-Trees, Hash indexes para acelerar las consultas enormes.',
  },
  {
    nombre: 'matrices', categoria: 'math', prioridad: 81,
    condiciones: [ { hecho: 'tema', operador: 'igual', valor: 'math' }, { hecho: 'subtema', operador: 'igual', valor: 'matrices' } ],
    respuestaFacil: '🔢 **Matrices**\n\nUna matriz es simplemente una cuadrícula de números, como un tablero de ajedrez, donde cada casilla guarda un valor. ¡Las usan mucho en los gráficos de los videojuegos 3D!',
    respuestaMedio: '🔢 **Álgebra Lineal: Matrices**\n\nUna matriz es un arreglo rectangular de números.\nSe pueden sumar y multiplicar (usando filas por columnas).\n- **Determinante**: Un número especial calculado para matrices cuadradas.\n- **Matriz Identidad**: Es como el número "1" de las matrices (unos en la diagonal principal).',
    respuestaPro: '🔢 **Álgebra Lineal Computacional**\n\n- **Espacios Vectoriales**: Bases y transformaciones lineales.\n- **Eigenvalores y Eigenvectores**: `Ax = λx`, fundamentales en algoritmos como PageRank y sistemas dinámicos.\n- **Descomposición SVD**: Crucial para compresión de imágenes, Machine Learning y análisis de componentes principales (PCA).',
  },
  {
    nombre: 'statistics', categoria: 'math', prioridad: 82,
    condiciones: [ { hecho: 'tema', operador: 'igual', valor: 'math' }, { hecho: 'subtema', operador: 'igual', valor: 'statistics' } ],
    respuestaFacil: '📊 **Estadística**\n\nLa estadística es usar datos para entender qué pasa.\n- **Media**: El promedio de todo.\n- **Mediana**: El número que queda exactamente a la mitad cuando los ordenas.\n- **Moda**: Lo que más se repite.',
    respuestaMedio: '📊 **Estadística y Probabilidad**\n\n- **Medidas de tendencia**: Media, mediana y moda.\n- **Probabilidad**: Posibilidad de que un evento suceda (0 = Imposible, 1 = Seguro).\n- **Varianza**: Qué tan alejados están los números del promedio.\n- **Distribución Normal**: La clásica curva de "campana" donde la mayoría de los datos se agrupan en el centro.',
    respuestaPro: '📊 **Estadística Inferencial y Bayesiana**\n\n- **Teorema del Límite Central**: La suma de variables aleatorias independientes converge a una distribución normal.\n- **Teorema de Bayes**: `P(A|B) = [P(B|A)*P(A)] / P(B)`. Fundamental en Machine Learning estadístico.\n- **Pruebas de Hipótesis**: Uso de P-value, control de Errores Tipo I y Tipo II.\n- **Cadenas de Markov**: Transiciones estocásticas de estado sin memoria.',
  },
  {
    nombre: 'limits_basics', categoria: 'math', prioridad: 80,
    condiciones: [ { hecho: 'tema', operador: 'igual', valor: 'math' }, { hecho: 'subtema', operador: 'igual', valor: 'limits' } ],
    respuestaFacil: '📈 **¿Qué es un límite?**\n\nImagina que caminas hacia una pared. Te acercas y te acercas más y más, pero nunca la tocas. Eso es un límite: es el valor al que se **acerca** una función cuando la variable (como x) se acerca a un número.\n\nEjemplo:\nSi tenemos f(x) = x + 2, y nos acercamos a x = 3:\nEl límite es **5**, porque el resultado se acerca mucho a 5 cuando x se acerca a 3.',
    respuestaMedio: '📈 **Límites Matemáticos**\n\nEl límite describe el comportamiento de una función cerca de un punto, no necesariamente en el punto mismo.\n\nFormulación:\nlim (x -> a) f(x) = L\n\n**Indeterminaciones típicas:**\n- 0/0 y ∞/∞: Se resuelven factorizando, racionalizando o aplicando la regla de L\'Hôpital.',
    respuestaPro: '📈 **Límites y Continuidad (Avanzado)**\n\nDefinición formal (ε, δ):\nlim (x -> c) f(x) = L <=> ∀ ε > 0, ∃ δ > 0 tal que si 0 < |x - c| < δ, entonces |f(x) - L| < ε.\n\nConceptos clave:\n- **Límites laterales**: Para que exista el límite, los límites por la izquierda y la derecha deben coincidir.\n- **Continuidad**: f(x) es continua en c si y solo si lim (x -> c) f(x) = f(c).\n- **Regla de L\'Hôpital**: Si el límite de f(x)/g(x) da 0/0 o ∞/∞, es igual al límite de sus derivadas f\'(x)/g\'(x).',
  },
  {
    nombre: 'algebra_basics', categoria: 'math', prioridad: 80,
    condiciones: [ { hecho: 'tema', operador: 'igual', valor: 'math' }, { hecho: 'subtema', operador: 'igual', valor: 'algebra' } ],
    respuestaFacil: '🧮 **Álgebra Básica**\n\nEl álgebra es como resolver un misterio. Usamos letras (como la x) para representar números que no conocemos todavía.\n\n**Ejemplo sencillo:**\nx + 5 = 8\n\nPara encontrar el valor de x, dejamos a la x solita pasando el +5 al otro lado restando:\nx = 8 - 5\nx = 3',
    respuestaMedio: '🧮 **Álgebra: Ecuaciones y Factorización**\n\nEl álgebra permite resolver ecuaciones lineales, cuadráticas y sistemas de ecuaciones.\n\n**Ecuación Cuadrática:** ax² + bx + c = 0\nFórmula general: x = [-b ± √(b² - 4ac)] / 2a\n\n**Métodos de factorización importantes:**\n- Diferencia de cuadrados: a² - b² = (a-b)(a+b)\n- Trinomio cuadrado perfecto: a² + 2ab + b² = (a+b)²',
    respuestaPro: '🧮 **Álgebra Abstracta y Sistemas Complejos**\n\nÁreas avanzadas de estudio algebraico:\n- **Estructuras algebraicas**: Grupos, anillos y campos (bases de la criptografía moderna).\n- **Teorema Fundamental del Álgebra**: Todo polinomio de grado n >= 1 con coeficientes complejos tiene exactamente n raíces complejas (contando multiplicidad).\n- **Sistemas de Ecuaciones Lineales**: Analizados mediante el Teorema de Rouché-Frobenius utilizando matrices y determinantes.',
  },
  {
    nombre: 'trigonometry_basics', categoria: 'math', prioridad: 80,
    condiciones: [ { hecho: 'tema', operador: 'igual', valor: 'math' }, { hecho: 'subtema', operador: 'igual', valor: 'trigonometry' } ],
    respuestaFacil: '📐 **Trigonometría Básica**\n\nLa trigonometría estudia los **triángulos** y sus lados y ángulos.\nLas tres funciones más famosas son:\n- **Seno**: Opuesto / Hipotenusa\n- **Coseno**: Adyacente / Hipotenusa\n- **Tangente**: Opuesto / Adyacente',
    respuestaMedio: '📐 **Relaciones Trigonométricas e Identidades**\n\nEn un triángulo rectángulo, las razones se definen en base al ángulo θ.\n\n**Identidad Pitagórica Fundamental:**\nsen²(θ) + cos²(θ) = 1\n\n**Ley de Senos y Cosenos** (para cualquier triángulo):\n- Ley de Senos: a/sen(A) = b/sen(B) = c/sen(C)\n- Ley de Cosenos: c² = a² + b² - 2ab cos(C)',
    respuestaPro: '📐 **Análisis Trigonométrico y Ondas (Avanzado)**\n\n- **Funciones de variable compleja**: Las identidades se derivan de la Fórmula de Euler: e^(iz) = cos(z) + i sen(z).\n- **Análisis de Fourier**: Cualquier señal periódica continua puede descomponerse en una suma infinita de funciones seno y coseno.\n- **Coordenadas polares, cilíndricas y esféricas**: Fundamentales para el cálculo de integrales múltiples en física y computación gráfica.',
  },
  {
    nombre: 'osi_model_basics', categoria: 'networking', prioridad: 80,
    condiciones: [ { hecho: 'tema', operador: 'igual', valor: 'networking' }, { hecho: 'subtema', operador: 'igual', valor: 'osi_model' } ],
    respuestaFacil: '🌐 **El Modelo OSI de Redes**\n\nEl modelo OSI explica cómo viaja la información por internet dividiendo el proceso en **7 capas**, como un sistema de correo:\n1. **Física**: Los cables y la luz.\n2. **Enlace**: Conexión entre computadoras vecinas.\n3. **Red**: Direcciones IP (encontrar el camino).\n4. **Transporte**: Asegurar que los datos lleguen completos.\n5. **Sesión**: Mantener la conexión abierta.\n6. **Presentación**: Traducir los datos (formato).\n7. **Aplicación**: Lo que tú ves (Facebook, Chrome).',
    respuestaMedio: '🌐 **Capas del Modelo OSI**\n\nEl modelo OSI (Open Systems Interconnection) estructura la comunicación de red en 7 niveles conceptuales:\n- **Capa 7 (Aplicación)**: Protocolos de usuario como HTTP, FTP, SMTP.\n- **Capa 4 (Transporte)**: Segmentación y control de flujo mediante TCP y UDP.\n- **Capa 3 (Red)**: Direccionamiento lógico y enrutamiento (paquetes IP).\n- **Capa 2 (Enlace de datos)**: Direccionamiento físico (tramas MAC, switches).\n- **Capa 1 (Física)**: Transmisión binaria por medios físicos (cables, ondas).',
    respuestaPro: '🌐 **Arquitectura de Red y Protocolos OSI**\n\n- **Encapsulación/Desencapsulación**: Los datos bajan por la pila OSI agregando cabeceras (headers) en cada nivel y suben en el receptor removiéndolas.\n- **Capa de Transporte (4)**: Mecanismos avanzados como Ventana Deslizante (sliding window), control de congestión, y multiplexación de puertos.\n- **Capa de Enlace (2)**: Subcapas LLC (Logical Link Control) y MAC (Media Access Control); protocolos de prevención de bucles como STP.',
  },
  {
    nombre: 'tcp_ip_basics', categoria: 'networking', prioridad: 80,
    condiciones: [ { hecho: 'tema', operador: 'igual', valor: 'networking' }, { hecho: 'subtema', operador: 'igual', valor: 'tcp_ip' } ],
    respuestaFacil: '🔗 **¿Qué es TCP/IP?**\n\nEs el conjunto de reglas que hace que funcione internet.\n- **IP**: Es la dirección de tu casa en internet para que sepan a dónde mandar los mensajes.\n- **TCP**: Es la regla que empaqueta las cartas y se asegura de que ninguna se pierda en el camino, pidiendo confirmación de entrega.',
    respuestaMedio: '🔗 **Protocolos TCP e IP**\n\nTCP/IP es el modelo práctico usado en el internet real (consta de 4 capas: Enlace, Internet, Transporte y Aplicación).\n- **TCP (Transmission Control Protocol)**: Orientado a conexión, fiable, garantiza orden de paquetes mediante handshake de 3 vías.\n- **UDP (User Datagram Protocol)**: Sin conexión, rápido, no garantiza fiabilidad (usado en streaming y juegos).\n- **IP**: Direcciona los paquetes. IPv4 usa 32 bits; IPv6 usa 128 bits para dar más direcciones.',
    respuestaPro: '🔗 **Pila de Protocolos TCP/IP y Control de Congestión**\n\n- **Three-Way Handshake (TCP)**: SYN -> SYN-ACK -> ACK. Y para el cierre: FIN -> ACK -> FIN -> ACK.\n- **Control de Congestión TCP**: Algoritmos como Reno o Cubic controlan la ventana de congestión (cwnd) mediante Slow Start, Congestion Avoidance, Fast Retransmit y Fast Recovery.\n- **Direccionamiento IPv6**: Despliegue de autoconfiguración SLAAC y cabeceras más eficientes de tamaño fijo.',
  },
  {
    nombre: 'data_structures_basics', categoria: 'programming', prioridad: 80,
    condiciones: [ { hecho: 'tema', operador: 'igual', valor: 'programming' }, { hecho: 'subtema', operador: 'igual', valor: 'data_structures' } ],
    respuestaFacil: '📦 **Estructuras de Datos**\n\nSon diferentes formas de organizar la información en la computadora para usarla más fácil:\n- **Pila (Stack)**: Como una pila de platos. El último que pones es el primero que quitas (LIFO).\n- **Cola (Queue)**: Como una fila en el supermercado. El primero que llega es el primero en ser atendido (FIFO).\n- **Árbol (Tree)**: Organizado en carpetas y subcarpetas.',
    respuestaMedio: '📦 **Estructuras de Datos Fundamentales**\n\n- **Pilas (Stacks)**: Operaciones principales push y pop. Complejidad O(1).\n- **Colas (Queues)**: Operaciones enqueue y dequeue. Complejidad O(1).\n- **Listas Enlazadas**: Colección de nodos donde cada uno apunta al siguiente. Útiles para inserción rápida pero búsqueda lenta (O(N)).\n- **Árboles Binarios**: Estructuras jerárquicas. En árboles balanceados (AVL, Red-Black), la búsqueda es O(log N).',
    respuestaPro: '📦 **Estructuras de Datos Complejas y Grafos**\n\n- **Tablas Hash**: Mapeo clave-valor con colisiones resueltas por encadenamiento o direccionamiento abierto. Búsqueda promedio O(1).\n- **Grafos**: Nodos conectados por aristas. Representados mediante Matriz o Lista de Adyacencia. Algoritmos de recorrido: DFS y BFS.\n- **Heaps (Montículos)**: Árboles binarios que cumplen la propiedad de heap. Ideales para implementar colas de prioridad (búsqueda de min/max en O(1) e inserción en O(log N)).',
  },
  {
    nombre: 'design_patterns_basics', categoria: 'programming', prioridad: 80,
    condiciones: [ { hecho: 'tema', operador: 'igual', valor: 'programming' }, { hecho: 'subtema', operador: 'igual', valor: 'design_patterns' } ],
    respuestaFacil: '🏗️ **Patrones de Diseño**\n\nSon soluciones ya probadas a problemas comunes de programación. En lugar de inventar la rueda, usas una plantilla conocida:\n- **Singleton**: Asegura que una clase tenga una única copia (instancia) en todo tu programa, como una única base de datos.',
    respuestaMedio: '🏗️ **Patrones de Diseño Comunes**\n\nDivididos en Creacionales, Estructurales y de Comportamiento:\n- **Singleton**: Garantiza una única instancia global.\n- **Factory Method**: Define una interfaz para crear objetos, dejando que las subclases decidan cuál instanciar.\n- **Observer**: Define una suscripción de uno a muchos, notificando a varios objetos cuando cambia un estado.',
    respuestaPro: '🏗️ **Patrones de Diseño GoF y Principios de Diseño**\n\nImplementación avanzada de patrones:\n- **Strategy**: Permite definir una familia de algoritmos, encapsular cada uno y hacerlos intercambiables en tiempo de ejecución.\n- **Decorator**: Adjunta responsabilidades adicionales a un objeto dinámicamente sin herencia.\n- **Dependency Injection**: Patrón arquitectónico que externaliza la creación de dependencias de un componente para mejorar testabilidad.',
  },
  {
    nombre: 'testing_basics', categoria: 'programming', prioridad: 80,
    condiciones: [ { hecho: 'tema', operador: 'igual', valor: 'programming' }, { hecho: 'subtema', operador: 'igual', valor: 'testing' } ],
    respuestaFacil: '🧪 **¿Qué son las Pruebas (Testing)?**\n\nEs escribir código especial para verificar que tu programa funcione bien. Es como tener un robot que hace clic en todos tus botones para ver si sale algún error.',
    respuestaMedio: '🧪 **Pruebas Unitarias e Integración**\n\n- **Unit Testing**: Prueba una sola función aislada de dependencias.\n- **Integration Testing**: Prueba la comunicación entre diferentes módulos.\n- **End-to-End (E2E)**: Simula al usuario real en un navegador.\n\nEjemplo en JavaScript (Jest):\n```javascript\ntest(\'suma 1 + 2 igual a 3\', () => {\n  expect(suma(1, 2)).toBe(3);\n});\n```',
    respuestaPro: '🧪 **Estrategias de Calidad de Software y Testing**\n\n- **TDD (Test-Driven Development)**: Ciclo Red-Green-Refactor. Escribir la prueba antes del código de producción.\n- **Mocks, Stubs y Spies**: Aislación de efectos secundarios (como llamadas a bases de datos o APIs externas).\n- **Cobertura de Código (Code Coverage)**: Métricas de líneas, ramas y funciones ejecutadas por las pruebas.\n- **Mutation Testing**: Modificación del código fuente para validar si los tests realmente fallan cuando hay fallas.',
  },
  {
    nombre: 'docker_devops_basics', categoria: 'programming', prioridad: 80,
    condiciones: [ { hecho: 'tema', operador: 'igual', valor: 'programming' }, { hecho: 'subtema', operador: 'igual', valor: 'docker_devops' } ],
    respuestaFacil: '🐳 **Docker y Contenedores**\n\n¿Alguna vez te ha pasado que un programa funciona en tu computadora pero no en la de tu amigo? Docker resuelve esto guardando la app dentro de una **cajita virtual** (contenedor) con todo lo necesario para correr exactamente igual en cualquier máquina.',
    respuestaMedio: '🐳 **Docker y DevOps**\n\n- **Docker**: Empaqueta aplicaciones en contenedores ligeros independientes del sistema operativo host.\n- **Dockerfile**: Script con instrucciones para construir una imagen de Docker.\n- **CI/CD (Integración y Despliegue Continuo)**: Automatiza las fases de pruebas, construcción y despliegue cada vez que subes cambios a tu código.',
    respuestaPro: '🐳 **Orquestación de Contenedores y Pipelines**\n\n- **Kubernetes (K8s)**: Orquestador para automatizar el despliegue, escalado y gestión de contenedores a gran escala (Pods, Deployments, Services).\n- **Infraestructura como Código (IaC)**: Definición de recursos en la nube usando herramientas declarativas como Terraform o Ansible.\n- **Estrategias de Despliegue**: Blue-Green, Canary, o Rolling Updates para minimizar el tiempo de inactividad.',
  },
  {
    nombre: 'geometry_basics', categoria: 'math', prioridad: 80,
    condiciones: [ { hecho: 'tema', operador: 'igual', valor: 'math' }, { hecho: 'subtema', operador: 'igual', valor: 'geometry' } ],
    respuestaFacil: '📐 **Geometría Sencilla**\n\nLa geometría estudia las formas, tamaños y figuras:\n- **Área**: Cuánto espacio ocupa el interior de una figura (ej. para un rectángulo: base por altura).\n- **Perímetro**: La medida de todo el borde exterior de la figura.\n- **Teorema de Pitágoras**: En un triángulo con ángulo de 90 grados, si conoces dos lados puedes hallar el tercero (a² + b² = c²).',
    respuestaMedio: '📐 **Fórmulas Geométricas Fundamentales**\n\n- **Círculo**: Área = π r², Perímetro = 2π r.\n- **Triángulo**: Área = (base * altura) / 2.\n- **Teorema de Pitágoras**: a² + b² = c² donde c es la hipotenusa de un triángulo rectángulo.\n- **Volúmenes**: Esfera = (4/3)π r³, Cilindro = π r² h.',
    respuestaPro: '📐 **Geometría Analítica y Computacional**\n\n- **Geometría Euclidiana vs No Euclidiana**: Espacios planos vs curvos (elípticos, hiperbólicos).\n- **Geometría Analítica**: Estudio de figuras geométricas mediante sistemas de coordenadas (ecuación general de la sección cónica: Ax² + Bxy + Cy² + Dx + Ey + F = 0).\n- **Cálculo de Colisiones**: Algoritmos de colisión 2D/3D en desarrollo de videojuegos y motores gráficos (como el Teorema del Eje Separador).',
  },
  {
    nombre: 'complex_numbers_basics', categoria: 'math', prioridad: 80,
    condiciones: [ { hecho: 'tema', operador: 'igual', valor: 'math' }, { hecho: 'subtema', operador: 'igual', valor: 'complex_numbers' } ],
    respuestaFacil: '🔢 **Números Complejos e Imaginarios**\n\nEn matemáticas normales no existe la raíz de un número negativo (como √-1). Así que los matemáticos inventaron un número imaginario llamado **i** para que i² = -1. Un número complejo combina un número real y uno imaginario, como **3 + 4i**.',
    respuestaMedio: '🔢 **Números Complejos**\n\nUn número complejo se escribe en la forma z = a + bi, donde:\n- a es la parte real.\n- b es la parte imaginaria.\n- i = √-1.\n\n**Representaciones:**\n- Binómica: z = a + bi\n- Polar: z = r(cos θ + i sen θ) = r ∠ θ donde r = √(a² + b²) es el módulo y θ = arctan(b/a) es el argumento.',
    respuestaPro: '🔢 **Análisis Complejo y Aplicaciones**\n\n- **Fórmula de Euler**: e^(iθ) = cos θ + i sen θ, que da lugar a la identidad más famosa: e^(iπ) + 1 = 0.\n- **Teorema de Residuos e Integración en el Plano Complejo**: Permite calcular integrales reales sumamente difíciles analizando los polos en el plano complejo.\n- **Filtros e Impedancia en Ingeniería Eléctrica**: Utilización de números complejos para modelar circuitos de corriente alterna y procesar señales electromagnéticas.',
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
    const { message, model } = req.body ?? {};
    if (!message) return res.status(400).json({ error: 'Missing message field' });

    const hechos = extraerHechos(message);

    // Integramos el nivel basado en el `model` ("facil", "medio", "pro") provisto por la UI
    if (model) {
      const idx = hechos.findIndex(h => h.clave === 'nivel');
      if (idx >= 0) hechos[idx].valor = model;
      else hechos.push({ clave: 'nivel', valor: model });
    }

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
