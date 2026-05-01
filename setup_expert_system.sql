-- ═══════════════════════════════════════════════════════════════════
-- Expert System Setup — Archie
-- Run this script once in your Insforge/Supabase SQL editor
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Create expert_rules table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS expert_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  category    TEXT NOT NULL,
  conditions  JSONB NOT NULL DEFAULT '[]',
  action      JSONB NOT NULL DEFAULT '{}',
  priority    INTEGER NOT NULL DEFAULT 50,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── 2. Extend user_profiles ──────────────────────────────────────────
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS expert_level        TEXT    DEFAULT 'beginner';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS interactions_count  INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS topics_history      JSONB   DEFAULT '{}';

-- ─── 3. Seed initial rules ───────────────────────────────────────────

-- PROGRAMMING ────────────────────────────────────────────────────────

INSERT INTO expert_rules (name, category, priority, conditions, action) VALUES
('for_loop_beginner', 'programming', 80,
  '[
    {"fact":"topic","operator":"equals","value":"programming"},
    {"fact":"subtopic","operator":"equals","value":"loops"},
    {"fact":"level","operator":"equals","value":"beginner"}
  ]',
  '{
    "type":"direct_response",
    "response":"🔁 **¿Qué es un bucle `for`?**\n\nUn bucle `for` repite un bloque de código un número definido de veces.\n\n```python\nfor i in range(5):\n    print(f\"Iteración {i}\")\n```\n\n**Resultado:**\n```\nIteración 0\nIteración 1\nIteración 2\nIteración 3\nIteración 4\n```\n\n💡 **Tip:** `range(5)` genera los números del **0 al 4** (el 5 no se incluye).\n\n**Estructura general:**\n```python\nfor variable in secuencia:\n    # código a repetir\n```",
    "followUp":"¿Quieres que te explique el bucle `while` también?"
  }'
),

('for_loop_intermediate', 'programming', 75,
  '[
    {"fact":"topic","operator":"equals","value":"programming"},
    {"fact":"subtopic","operator":"equals","value":"loops"},
    {"fact":"level","operator":"in","value":["intermediate","advanced"]}
  ]',
  '{
    "type":"direct_response",
    "response":"🔁 **Bucles avanzados en Python**\n\n### List Comprehensions\n```python\ncuadrados = [x**2 for x in range(10) if x % 2 == 0]\n# [0, 4, 16, 36, 64]\n```\n\n### enumerate — índice + valor\n```python\nfrutas = [\"manzana\", \"pera\", \"uva\"]\nfor i, fruta in enumerate(frutas, start=1):\n    print(f\"{i}. {fruta}\")\n```\n\n### zip — iterar en paralelo\n```python\nnombres = [\"Ana\", \"Luis\"]\nnotas  = [9.5, 8.0]\nfor nombre, nota in zip(nombres, notas):\n    print(f\"{nombre}: {nota}\")\n```\n\n### itertools para patrones complejos\n```python\nfrom itertools import product\nfor x, y in product(range(3), repeat=2):\n    print(x, y)\n```",
    "followUp":"¿Te explico generadores (`yield`) para bucles de alto rendimiento?"
  }'
),

('functions_beginner', 'programming', 78,
  '[
    {"fact":"topic","operator":"equals","value":"programming"},
    {"fact":"subtopic","operator":"equals","value":"functions"},
    {"fact":"level","operator":"equals","value":"beginner"}
  ]',
  '{
    "type":"direct_response",
    "response":"🔧 **¿Qué es una función?**\n\nUna función es un bloque de código reutilizable que realiza una tarea específica.\n\n```python\ndef saludar(nombre):\n    return f\"Hola, {nombre}!\"\n\n# Llamar la función\nresultado = saludar(\"Ana\")\nprint(resultado)  # Hola, Ana!\n```\n\n**Partes de una función:**\n| Parte | Descripción |\n|-------|-------------|\n| `def` | Palabra clave para definir |\n| `saludar` | Nombre de la función |\n| `nombre` | Parámetro (entrada) |\n| `return` | Valor que devuelve |\n\n💡 **Tip:** Nombra tus funciones con verbos: `calcular_area()`, `obtener_usuario()`.",
    "followUp":"¿Quieres aprender sobre parámetros por defecto y *args/**kwargs?"
  }'
),

('closures_javascript', 'programming', 82,
  '[
    {"fact":"topic","operator":"equals","value":"programming"},
    {"fact":"subtopic","operator":"equals","value":"functions"},
    {"fact":"language","operator":"equals","value":"javascript"}
  ]',
  '{
    "type":"direct_response",
    "response":"🔒 **Closures en JavaScript**\n\nUn closure es una función que **recuerda** las variables del scope donde fue creada, incluso después de que ese scope haya terminado.\n\n```javascript\nfunction crearContador() {\n  let count = 0; // variable privada\n  return function() {\n    count++;\n    return count;\n  };\n}\n\nconst contador = crearContador();\nconsole.log(contador()); // 1\nconsole.log(contador()); // 2\nconsole.log(contador()); // 3\n```\n\n**¿Por qué funciona?** La función interna mantiene una referencia al scope de `crearContador`, manteniendo `count` vivo.\n\n**Uso práctico — datos privados:**\n```javascript\nconst banco = (() => {\n  let saldo = 1000; // privado\n  return {\n    depositar: (n) => saldo += n,\n    retirar:  (n) => saldo -= n,\n    verSaldo: ()  => saldo,\n  };\n})();\n\nbanco.depositar(500);\nconsole.log(banco.verSaldo()); // 1500\n```",
    "followUp":"¿Quieres ver cómo los closures se relacionan con el patrón Module?"
  }'
),

('oop_beginner', 'programming', 76,
  '[
    {"fact":"topic","operator":"equals","value":"programming"},
    {"fact":"subtopic","operator":"equals","value":"oop"},
    {"fact":"level","operator":"equals","value":"beginner"}
  ]',
  '{
    "type":"direct_response",
    "response":"🏗️ **Programación Orientada a Objetos (POO)**\n\nLa POO organiza el código en **objetos** que combinan datos (atributos) y comportamiento (métodos).\n\n```python\nclass Perro:\n    def __init__(self, nombre, raza):\n        self.nombre = nombre  # atributo\n        self.raza   = raza\n\n    def ladrar(self):          # método\n        return f\"{self.nombre} dice: ¡Guau!\"\n\n# Crear un objeto (instancia)\nmi_perro = Perro(\"Max\", \"Labrador\")\nprint(mi_perro.ladrar())  # Max dice: ¡Guau!\n```\n\n**Los 4 pilares de la POO:**\n| Pilar | Significado |\n|-------|-------------|\n| Encapsulamiento | Ocultar datos internos |\n| Herencia | Reutilizar código de otra clase |\n| Polimorfismo | Mismo método, distintos comportamientos |\n| Abstracción | Simplificar complejidad |",
    "followUp":"¿Te explico herencia con un ejemplo práctico?"
  }'
),

('async_javascript', 'programming', 85,
  '[
    {"fact":"topic","operator":"equals","value":"programming"},
    {"fact":"subtopic","operator":"equals","value":"async_programming"},
    {"fact":"language","operator":"equals","value":"javascript"}
  ]',
  '{
    "type":"direct_response",
    "response":"⚡ **Async/Await en JavaScript**\n\n`async/await` es azúcar sintáctica sobre las **Promises** que hace el código asíncrono más legible.\n\n```javascript\n// Con Promises\nfetch(\"/api/datos\")\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));\n\n// Con async/await (más limpio)\nasync function cargarDatos() {\n  try {\n    const res  = await fetch(\"/api/datos\");\n    const data = await res.json();\n    console.log(data);\n  } catch (err) {\n    console.error(err);\n  }\n}\n```\n\n**Ejecutar en paralelo con `Promise.all`:**\n```javascript\nasync function cargarTodo() {\n  const [usuarios, productos] = await Promise.all([\n    fetch(\"/api/usuarios\").then(r => r.json()),\n    fetch(\"/api/productos\").then(r => r.json()),\n  ]);\n  console.log(usuarios, productos);\n}\n```\n\n💡 **Regla de oro:** Usa `Promise.all` cuando las peticiones son **independientes** entre sí.",
    "followUp":"¿Quieres ver cómo manejar errores avanzados con async/await?"
  }'
),

-- MATH ───────────────────────────────────────────────────────────────

('derivatives_beginner', 'math', 80,
  '[
    {"fact":"topic","operator":"equals","value":"math"},
    {"fact":"subtopic","operator":"equals","value":"derivatives"},
    {"fact":"level","operator":"equals","value":"beginner"}
  ]',
  '{
    "type":"direct_response",
    "response":"📐 **¿Qué es una derivada?**\n\nLa derivada mide **qué tan rápido cambia** una función en un punto. Geométricamente, es la **pendiente de la recta tangente**.\n\n**Reglas básicas:**\n| Función | Derivada | Ejemplo |\n|---------|----------|---------|\n| `xⁿ` | `n·xⁿ⁻¹` | `x³ → 3x²` |\n| `constante` | `0` | `5 → 0` |\n| `eˣ` | `eˣ` | `eˣ → eˣ` |\n| `ln(x)` | `1/x` | `ln(x) → 1/x` |\n| `sin(x)` | `cos(x)` | `sin(x) → cos(x)` |\n| `cos(x)` | `-sin(x)` | `cos(x) → -sin(x)` |\n\n**Ejemplo paso a paso:**\nf(x) = 3x² + 2x + 1\n\n1. Derivada de `3x²` → `6x`\n2. Derivada de `2x` → `2`\n3. Derivada de `1` → `0`\n4. **f''(x) = 6x + 2** ✓",
    "followUp":"¿Quieres aprender la Regla de la Cadena para funciones compuestas?"
  }'
),

('derivatives_intermediate', 'math', 75,
  '[
    {"fact":"topic","operator":"equals","value":"math"},
    {"fact":"subtopic","operator":"equals","value":"derivatives"},
    {"fact":"level","operator":"in","value":["intermediate","advanced"]}
  ]',
  '{
    "type":"direct_response",
    "response":"📐 **Derivadas — Reglas avanzadas**\n\n### Regla de la Cadena\nSi f(x) = g(h(x)), entonces **f''(x) = g''(h(x)) · h''(x)**\n\n```\nf(x) = sin(x²)\ng(u) = sin(u)  →  g''(u) = cos(u)\nh(x) = x²      →  h''(x) = 2x\nf''(x) = cos(x²) · 2x\n```\n\n### Regla del Producto\n(f · g)'' = f'' · g + f · g''\n\n```\nh(x) = x² · sin(x)\nh''(x) = 2x · sin(x) + x² · cos(x)\n```\n\n### Regla del Cociente\n(f/g)'' = (f''·g − f·g'') / g²\n\n```\nh(x) = x² / (x+1)\nh''(x) = (2x(x+1) − x²·1) / (x+1)²\n       = (x² + 2x) / (x+1)²\n```\n\n### Derivadas implícitas\n```\nx² + y² = 25\n2x + 2y(dy/dx) = 0\ndy/dx = -x/y\n```",
    "followUp":"¿Practicamos con un ejercicio de optimización usando derivadas?"
  }'
),

('integrals_beginner', 'math', 78,
  '[
    {"fact":"topic","operator":"equals","value":"math"},
    {"fact":"subtopic","operator":"equals","value":"integrals"},
    {"fact":"level","operator":"equals","value":"beginner"}
  ]',
  '{
    "type":"direct_response",
    "response":"∫ **¿Qué es una integral?**\n\nLa integral es la operación **inversa de la derivada**. Geométricamente representa el **área bajo una curva**.\n\n**Reglas básicas de integración:**\n| Función | Integral |\n|---------|----------|\n| `xⁿ` | `xⁿ⁺¹/(n+1) + C` |\n| `1/x` | `ln|x| + C` |\n| `eˣ` | `eˣ + C` |\n| `sin(x)` | `-cos(x) + C` |\n| `cos(x)` | `sin(x) + C` |\n\n⚠️ **La constante C** representa la familia de antiderivadas.\n\n**Ejemplo:**\n∫(3x² + 2x) dx\n= x³ + x² + C\n\n**Integral definida (área entre a y b):**\n∫₀² x² dx = [x³/3]₀² = 8/3 − 0 = **8/3**",
    "followUp":"¿Te explico el método de sustitución (u-substitution)?"
  }'
),

('trigonometry_basics', 'math', 72,
  '[
    {"fact":"topic","operator":"equals","value":"math"},
    {"fact":"subtopic","operator":"equals","value":"trigonometry"}
  ]',
  '{
    "type":"direct_response",
    "response":"📐 **Trigonometría — Fundamentos**\n\n### El círculo unitario\nPara un ángulo θ en el círculo unitario:\n- **sin(θ)** = coordenada Y\n- **cos(θ)** = coordenada X\n- **tan(θ)** = sin(θ)/cos(θ)\n\n### Ángulos especiales\n| Ángulo | Radianes | sin | cos | tan |\n|--------|----------|-----|-----|-----|\n| 0° | 0 | 0 | 1 | 0 |\n| 30° | π/6 | 1/2 | √3/2 | 1/√3 |\n| 45° | π/4 | √2/2 | √2/2 | 1 |\n| 60° | π/3 | √3/2 | 1/2 | √3 |\n| 90° | π/2 | 1 | 0 | ∞ |\n\n### Identidades fundamentales\n- **sin²(θ) + cos²(θ) = 1**\n- tan²(θ) + 1 = sec²(θ)\n- sin(2θ) = 2·sin(θ)·cos(θ)\n- cos(2θ) = cos²(θ) − sin²(θ)",
    "followUp":"¿Quieres practicar resolviendo triángulos con la Ley de Senos o Cosenos?"
  }'
),

-- NETWORKING ─────────────────────────────────────────────────────────

('osi_model', 'networking', 85,
  '[
    {"fact":"topic","operator":"equals","value":"networking"},
    {"fact":"subtopic","operator":"equals","value":"osi_model"}
  ]',
  '{
    "type":"direct_response",
    "response":"🌐 **Modelo OSI — Las 7 capas**\n\nEl modelo OSI (Open Systems Interconnection) es un marco conceptual que estandariza las funciones de comunicación en redes.\n\n| # | Capa | Función | Ejemplo |\n|---|------|---------|----------|\n| 7 | **Aplicación** | Interfaz con el usuario | HTTP, FTP, DNS |\n| 6 | **Presentación** | Formato y cifrado | SSL/TLS, JPEG |\n| 5 | **Sesión** | Gestiona conexiones | NetBIOS, RPC |\n| 4 | **Transporte** | Entrega confiable | TCP, UDP |\n| 3 | **Red** | Enrutamiento | IP, ICMP |\n| 2 | **Enlace de datos** | Nodo a nodo | Ethernet, Wi-Fi |\n| 1 | **Física** | Señales eléctricas | Cables, hubs |\n\n**Mnemotécnico (de arriba hacia abajo):**\n> **A**ll **P**eople **S**eem **T**o **N**eed **D**ata **P**rocessing\n\n💡 **TCP/IP vs OSI:** TCP/IP colapsa las capas 5,6,7 en una sola capa de Aplicación.",
    "followUp":"¿Quieres que profundice en alguna capa específica o en TCP/IP?"
  }'
),

('tcp_ip_basics', 'networking', 80,
  '[
    {"fact":"topic","operator":"equals","value":"networking"},
    {"fact":"subtopic","operator":"equals","value":"tcp_ip"}
  ]',
  '{
    "type":"direct_response",
    "response":"🔗 **TCP vs UDP**\n\n### TCP (Transmission Control Protocol)\n- **Orientado a conexión** — Three-Way Handshake (SYN → SYN-ACK → ACK)\n- **Confiable** — garantiza entrega y orden\n- **Más lento** — mayor overhead\n- **Uso:** HTTP, correo, transferencia de archivos\n\n### UDP (User Datagram Protocol)\n- **Sin conexión** — envía y olvida\n- **No confiable** — puede perder paquetes\n- **Más rápido** — menor overhead\n- **Uso:** streaming, videojuegos, DNS, VoIP\n\n### Three-Way Handshake TCP\n```\nCliente         Servidor\n  |---SYN-------->|\n  |<--SYN-ACK----|\n  |---ACK-------->|\n  |  (conexión)  |\n```\n\n### Estructura de un paquete IP\n- **IP origen/destino** (32 bits en IPv4)\n- **TTL** — Time To Live (evita bucles infinitos)\n- **Protocolo** — TCP=6, UDP=17, ICMP=1",
    "followUp":"¿Quieres aprender sobre subnetting y máscaras de red?"
  }'
)

ON CONFLICT (name) DO UPDATE SET
  conditions = EXCLUDED.conditions,
  action     = EXCLUDED.action,
  priority   = EXCLUDED.priority,
  updated_at = NOW();

-- ─── 4. Index for faster queries ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_expert_rules_active_priority
  ON expert_rules (is_active, priority DESC);

-- ─── 5. Verify ───────────────────────────────────────────────────────
SELECT name, category, priority, is_active
FROM expert_rules
ORDER BY category, priority DESC;
