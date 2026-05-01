-- 1. Crear tabla de reglas del sistema experto
CREATE TABLE IF NOT EXISTS expert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]',
  action JSONB NOT NULL DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Agregar campos de nivel y progreso a user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS expert_level TEXT DEFAULT 'beginner';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS interactions_count INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS topics_history JSONB DEFAULT '{}';

-- 3. Insertar reglas de ejemplo iniciales

-- Regla: Explicación de bucles FOR para principiantes
INSERT INTO expert_rules (name, category, priority, conditions, action)
VALUES (
  'for_loop_beginner',
  'programming',
  80,
  '[
    {"fact": "topic", "operator": "equals", "value": "programming"},
    {"fact": "subtopic", "operator": "equals", "value": "loops"},
    {"fact": "level", "operator": "equals", "value": "beginner"},
    {"fact": "intent", "operator": "equals", "value": "explain"}
  ]',
  '{
    "type": "direct_response",
    "response": "🔁 **¿Qué es un bucle for?**\n\nUn bucle `for` se usa para repetir un bloque de código un número conocido de veces. Imagina que tienes una lista de tareas y quieres hacer cada una; el bucle va una por una hasta terminar.\n\n**Ejemplo en Python:**\n```python\nfrutas = [\"manzana\", \"banana\", \"cereza\"]\nfor x in frutas:\n  print(x)\n```\n\n**¿Por qué usarlo?**\nEvita escribir el mismo código muchas veces y hace que tu programa sea más limpio.",
    "followUp": "¿Te gustaría ver cómo se hace esto mismo con un bucle while?"
  }'
) ON CONFLICT (name) DO NOTHING;

-- Regla: Derivadas básicas para nivel intermedio
INSERT INTO expert_rules (name, category, priority, conditions, action)
VALUES (
  'derivatives_basics_intermediate',
  'math',
  75,
  '[
    {"fact": "topic", "operator": "equals", "value": "math"},
    {"fact": "subtopic", "operator": "equals", "value": "derivatives"},
    {"fact": "level", "operator": "in", "value": ["intermediate", "advanced"]},
    {"fact": "intent", "operator": "equals", "value": "explain"}
  ]',
  '{
    "type": "direct_response",
    "response": "📐 **Reglas de Derivación Básicas**\n\nComo ya tienes conocimientos previos, aquí tienes un resumen de las reglas fundamentales:\n\n1. **Regla de la Potencia:** $\\frac{d}{dx}x^n = nx^{n-1}$\n2. **Derivada de una constante:** $\\frac{d}{dx}c = 0$\n3. **Regla de la Cadena:** $[f(g(x))]'' = f''(g(x)) \\cdot g''(x)$\n\n**Ejemplo rápido:**\nSi $f(x) = 3x^2 + 5$, entonces $f''(x) = 6x$.",
    "followUp": "¿Quieres practicar con un ejercicio de la regla de la cadena?"
  }'
) ON CONFLICT (name) DO NOTHING;

-- Regla: Fallback para programación general
INSERT INTO expert_rules (name, category, priority, conditions, action)
VALUES (
  'general_programming_help',
  'programming',
  10,
  '[
    {"fact": "topic", "operator": "equals", "value": "programming"}
  ]',
  '{
    "type": "direct_response",
    "response": "Veo que tienes una duda sobre programación. Para ayudarte mejor, ¿podrías decirme qué lenguaje estás usando (Python, JavaScript, etc.) o qué concepto específico te causa curiosidad?",
    "followUp": "Recuerda que puedo explicarte desde variables básicas hasta arquitectura de sistemas."
  }'
) ON CONFLICT (name) DO NOTHING;
