<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./src/assets/Archie%20texto%20logo%20blanco.png">
    <img src="./src/assets/Archie%20texto.png" alt="Archie" width="380">
  </picture>

  <h3>Tu compañero para aprender, preguntar y entender.</h3>

  <p>
    Un tutor web interactivo para explorar matemáticas, programación, lógica y redes<br>
    con explicaciones claras, ejemplos y distintos niveles de profundidad.
  </p>

  <p>
    <a href="#-qué-es-archie">Conoce a Archie</a> ·
    <a href="#-funcionalidades">Funcionalidades</a> ·
    <a href="#-tecnologías">Tecnologías</a> ·
    <a href="#-ejecución-local">Ejecución local</a>
  </p>
</div>

---

<table>
  <tr>
    <td width="68%" valign="middle">
      <h2>🦝 ¿Qué es Archie?</h2>
      <p><strong>Archie</strong> es una aplicación web de apoyo al aprendizaje. Puedes plantear una duda, elegir la profundidad de la explicación y continuar la conversación hasta comprender el tema.</p>
      <p>Su chat combina un <strong>sistema experto basado en reglas</strong> para temas conocidos con una interfaz diseñada para estudiar: respuestas con formato, fragmentos de código y conversaciones guardadas en tu cuenta.</p>
    </td>
    <td align="center" valign="middle">
      <img src="./src/assets/Archie%20saludando.png" alt="Mascota Archie saludando" width="240">
    </td>
  </tr>
</table>

## ✨ Funcionalidades

| | Lo que puedes hacer |
| :---: | --- |
| 📚 | **Aprender paso a paso:** pedir explicaciones y ejemplos sobre matemáticas, programación, lógica y redes. |
| 🎚️ | **Ajustar la profundidad:** elegir entre los modos Fácil, Medio y Pro del chat. |
| 💬 | **Retomar conversaciones:** crear sesiones, consultar el historial y organizar tus chats. |
| 🧠 | **Consultar el sistema experto:** recibir respuestas de reglas temáticas para preguntas reconocidas. |
| 🔐 | **Acceder a tu espacio:** iniciar sesión y completar el registro o la verificación facial para entrar al chat. |
| 🌓 | **Leer cómodamente:** usar la interfaz adaptable, con temas visuales y respuestas que muestran Markdown y código. |

> La portada también muestra planes y logos de servicios de IA. Esos elementos presentan la experiencia visual del proyecto; el flujo actual del chat utiliza el sistema experto de `/api/chat`.

## 🛠️ Tecnologías

<div align="center">
  <img alt="React" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white">
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white">
  <img alt="n8n" src="https://img.shields.io/badge/n8n-EA4B71?style=for-the-badge&logo=n8n&logoColor=white">
  <img alt="InsForge" src="https://img.shields.io/badge/InsForge-4652F6?style=for-the-badge">
</div>

<br>

| Capa | Herramientas en el proyecto |
| --- | --- |
| Interfaz | React, Vite, TypeScript/JavaScript, Tailwind CSS, Radix UI y Lucide |
| Animación y contenido | Framer Motion, GSAP, React Markdown y resaltado de sintaxis |
| Datos y acceso | InsForge SDK, autenticación, perfiles y sesiones de chat |
| API | Funciones de Vercel, sistema experto en TypeScript y verificación facial con `face-api.js` |
| Integración adicional | Servicio de webhook n8n presente en el código del chat |

### Logos que aparecen en la web

El carrusel de la portada muestra **React, Claude, OpenAI, DeepSeek, Gemini, n8n, Qwen, Grok y PostgreSQL**. Es una sección visual de la landing; su presencia no implica que todos esos modelos estén conectados al chat.

<div align="center">
  <img alt="React" src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB">
  <img alt="Claude" src="https://img.shields.io/badge/Claude-D97757?style=flat-square&logo=anthropic&logoColor=white">
  <img alt="OpenAI" src="https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white">
  <img alt="DeepSeek" src="https://img.shields.io/badge/DeepSeek-4D6BFE?style=flat-square&logo=deepseek&logoColor=white">
  <img alt="Gemini" src="https://img.shields.io/badge/Gemini-8E75B2?style=flat-square&logo=googlegemini&logoColor=white">
  <img alt="n8n" src="https://img.shields.io/badge/n8n-EA4B71?style=flat-square&logo=n8n&logoColor=white">
  <img alt="Qwen" src="https://img.shields.io/badge/Qwen-615CED?style=flat-square&logo=qwen&logoColor=white">
  <img alt="Grok" src="https://img.shields.io/badge/Grok-111111?style=flat-square&logo=x&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white">
</div>

## 🚀 Ejecución local

**Requisitos:** Node.js y npm. Para probar las funciones de `/api` en local, también se necesita la CLI de Vercel.

```bash
npm install
```

Crea un archivo `.env.local` en la raíz del proyecto con los valores de tu entorno:

```dotenv
VITE_INSFORGE_URL=tu_url_de_insforge
VITE_INSFORGE_ANON_KEY=tu_clave_publica
INSFORGE_URL=tu_url_de_insforge
INSFORGE_SERVICE_KEY=tu_clave_de_servicio
```

Las variables `VITE_` se usan en el navegador. La clave de servicio se utiliza del lado del servidor para las rutas biométricas: **no la publiques ni le agregues el prefijo `VITE_`**. El proyecto incluye [`setup_biometrics.sql`](./setup_biometrics.sql) y [`setup_expert_system.sql`](./setup_expert_system.sql) para preparar las partes correspondientes de la base de datos.

Inicia la API y la interfaz en dos terminales:

```bash
npm run dev:api
```

```bash
npm run dev
```

Vite muestra la dirección local de la web en la terminal y reenvía las solicitudes `/api` al servidor de funciones en el puerto `3001`.

## 📁 Estructura principal

```text
archie-web/
├── api/                    # Sistema experto y funciones biométricas
├── public/models/face-api/ # Modelos para reconocimiento facial
├── src/assets/             # Logos e ilustraciones de Archie
├── src/components/         # Portada, acceso y chat
├── src/services/           # Comunicación con datos y API
└── src/lib/                # Clientes y utilidades compartidas
```

<div align="center">
  <img src="./src/assets/Archie%20sentado%20lap.png" alt="Archie trabajando en su computadora" width="185">
  <br>
  <strong>Aprender empieza con una buena pregunta.</strong>
</div>

## 📜 Derechos de autor

**© 2026 Eduardo Rivas. Todos los derechos reservados.** Archie fue desarrollado con fines educativos. El código y los materiales originales del proyecto no pueden usarse, copiarse, modificarse ni distribuirse sin autorización previa y por escrito del titular. Consulta el [aviso completo de derechos](./LICENSE). Las dependencias y marcas de terceros se rigen por sus propios términos.
