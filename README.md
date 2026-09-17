<div align="center">
  <h1>Planvia</h1>
  <h3>AI-powered architectural visualization</h3>

  <div>
    <img src="https://img.shields.io/badge/-React-61DAFB?style=for-the-badge&logo=React&logoColor=black" />
    <img src="https://img.shields.io/badge/-Typescript-3178C6?style=for-the-badge&logo=Typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/-Tailwind-06B6D4?style=for-the-badge&logo=Tailwind-CSS&logoColor=white" />
    <img src="https://img.shields.io/badge/-Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white" />
  </div>
</div>

## 📋 Table of Contents

1. ✨ [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🤸 [Quick Start](#quick-start)
5. 📁 [Project Structure](#project-structure)

## <a name="introduction">✨ Introduction</a>

Planvia is an AI-powered architectural visualization app built with React, TypeScript, and Puter. It turns 2D floor plans
into photorealistic top-down 3D renders, then hosts them at permanent public URLs with persistent project metadata.
The app covers 2D-to-3D rendering, serverless workers, key-value storage, and a shared project feed.

## <a name="tech-stack">⚙️ Tech Stack</a>

- **[React](https://react.dev/)** — component-based UI library, used here with React Router in framework mode.
- **[React Router](https://reactrouter.com/)** — routing, data loading, and the dev/build/serve toolchain.
- **[Vite](https://vitejs.dev/)** — dev server and production build tooling.
- **[TypeScript](https://www.typescriptlang.org/)** — static typing across the app, lib, and component layers.
- **[TailwindCSS](https://tailwindcss.com/)** — utility-first styling.
- **[Puter](https://puter.com/)** — cloud platform providing serverless Workers, file storage, KV database, hosting, and hosted AI models.
- **[Puter.js](https://docs.puter.com/)** — JavaScript SDK used to call those cloud services directly from the browser.

## <a name="features">🔋 Features</a>

👉 **2D-to-3D Visualization** — transforms flat floor plans into photorealistic top-down 3D renders.

👉 **Persistent Media Hosting** — every upload and render gets a permanent public URL.

👉 **Project Gallery** — a workspace that tracks your visualization history with metadata persistence.

👉 **Side-by-Side Comparison** — compare a source sketch against its AI-rendered counterpart.

👉 **Shared Project Feed** — publish projects for others to browse in one click.

👉 **Privacy Controls** — public/private toggles per project.

👉 **Ownership Mapping** — project metadata is tracked against user IDs.

👉 **Export** — download generated renders for use in presentations and other workflows.

## <a name="quick-start">🤸 Quick Start</a>

**Prerequisites**

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/)

**Installation**

```bash
npm install
```

**Set Up Environment Variables**

Create a `.env` file in the project root:

```env
VITE_PUTER_WORKER_URL=""
```

Point it at your deployed Puter worker (see `lib/puter.worker.js`). You can create an account and a worker at
[puter.com](https://puter.com/).

**Running the Project**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Other Scripts**

```bash
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # generate route types and run tsc
```

**Docker**

```bash
docker build -t planvia .
docker run -p 3000:3000 planvia
```

## <a name="project-structure">📁 Project Structure</a>

```
app/            routes, root layout, and global styles
components/     shared UI components
lib/            Puter actions, AI actions, worker, constants, helpers
public/         static assets
```
