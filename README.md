# Synapsis

Notas, adjuntos (PDF, imagen, audio) y un chat con IA (Gemini) que conoce tu contenido — todo conectado,
todo en un solo lugar. v1: notas + carpetas + adjuntos + chat con contexto. (Quiz automático llega en v2.)

## Stack

- **Frontend:** React + Vite + Tailwind
- **Auth:** Firebase Authentication (Google Sign-In)
- **Base de datos:** Firebase Firestore
- **Archivos:** Firebase Storage
- **IA:** API de Gemini, llamada desde una Cloud Function (nunca desde el navegador — así la API key nunca se expone)

## 1. Crear el proyecto de Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) → crear proyecto.
2. Activa **Authentication** → método "Google".
3. Activa **Firestore Database** (modo producción).
4. Activa **Storage**.
5. En "Configuración del proyecto" → agrega una app web → copia la config al `.env` (ver paso 3).

## 2. Instalar dependencias

```bash
npm install
cd functions && npm install && cd ..
```

## 3. Variables de entorno

```bash
cp .env.example .env
```

Llena `.env` con los datos de tu app web de Firebase (paso 1.5).

## 4. Configurar la API key de Gemini (Cloud Functions)

Consigue tu API key en [aistudio.google.com/apikey](https://aistudio.google.com/apikey), luego:

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

(te pedirá pegar la key — queda guardada de forma segura, nunca en el código ni en git)

## 5. Correr en local

```bash
npm run dev
```

Para probar las Cloud Functions en local también, usa el emulador:

```bash
firebase emulators:start
```

## 6. Desplegar reglas de seguridad y funciones

```bash
firebase deploy --only firestore:rules,storage:rules,functions
```

## 7. Desplegar el frontend

```bash
npm run build
firebase deploy --only hosting
```

(si aún no tienes Hosting configurado: `firebase init hosting`, elige la carpeta `dist` como pública)

## Estructura del proyecto

```
src/
  components/     → LoginScreen, Sidebar, NotesPanel, ChatPanel
  hooks/          → useAuth
  lib/            → firestore.js (CRUD), storage.js (subir archivos), gemini.js (llamar a la IA)
  firebase.js     → inicialización del SDK
  App.jsx         → conecta todo
functions/
  index.js        → Cloud Function "preguntarIA" (proxy seguro hacia Gemini)
firestore.rules   → cada usuario solo lee/escribe sus propios datos
storage.rules     → mismo principio para archivos subidos
```

## Roadmap (ver el documento de diseño completo del proyecto para más detalle)

- **v1 (esta base):** notas, carpetas, adjuntos, chat con contexto, PWA.
- **v2:** quiz automático generado desde tus notas, resúmenes, transcripción de audio.
- **v3:** recordatorios, estadísticas de estudio, notificaciones.
- **v4:** apps nativas en tiendas, modo colaborativo (a decidir).

## Nota sobre PDFs/audio como contexto de la IA

Ahora mismo, cuando anclas una nota de texto al chat, su contenido se manda completo a Gemini. Para PDFs
e imágenes, lo más directo es mandarle el archivo mismo a Gemini (que sí puede leerlos) en vez de solo
la URL — es la siguiente mejora natural en `src/lib/gemini.js` y `functions/index.js`. Para audio, se
necesita un paso de transcripción (Google Cloud Speech-to-Text) antes de poder usarlo como texto.
