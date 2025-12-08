# Armonia RAG - AI Chatbot Application

A modern AI chatbot application built with React, Vite, TypeScript, and shadcn/ui components. Features a complete chat interface with streaming responses, document uploads, and authentication.

## Features

- 🔐 **Authentication** - Secure login with JWT token management
- 💬 **AI Chat Interface** - ChatGPT-style conversation UI with streaming support
- 📄 **Document Upload** - Upload PDF documents to provide context for the AI
- 🎨 **Modern UI** - Built entirely with shadcn/ui components
- ♿ **Accessible** - Full keyboard navigation and screen reader support
- 📱 **Responsive** - Works seamlessly on desktop and mobile devices

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **TypeScript** - Type-safe development
- **shadcn/ui** - Beautiful, accessible component library
- **Radix UI** - Unstyled, accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Set up environment variables (optional):

Create a `.env` file in the root directory:

```env
VITE_API_URL=https://api-ai-rag-o62iq.ondigitalocean.app
```

If not set, the app will use the default API URL.

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser (Vite's default port).

## Project Structure

```
armonia-rag/
├── src/
│   ├── pages/         # Page components
│   │   ├── LoginPage.tsx
│   │   └── ChatPage.tsx
│   ├── components/
│   │   ├── ai/        # AI chatbot components
│   │   │   ├── conversation.tsx
│   │   │   ├── message.tsx
│   │   │   ├── prompt-input.tsx
│   │   │   ├── reasoning.tsx
│   │   │   └── sources.tsx
│   │   └── ui/        # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts     # API client
│   │   └── utils.ts   # Utility functions
│   ├── App.tsx        # Main app component with routing
│   ├── main.tsx       # Entry point
│   └── index.css      # Global styles
├── index.html         # HTML template
├── vite.config.ts     # Vite configuration
└── package.json
```

## API Integration

The application integrates with the following endpoints:

- `POST /auth/login` - User authentication
- `POST /rag/chat` - Send chat messages and receive AI responses
- `POST /rag/upload` - Upload documents for RAG context

All authenticated requests include a Bearer token in the Authorization header.

## Usage

### Login

1. Navigate to `/login`
2. Enter your email and password
3. Upon successful login, you'll be redirected to the chat page

### Chat

1. Type your message in the input field
2. Press Enter or click the send button
3. The AI response will stream in real-time
4. View reasoning and sources if available

### Upload Documents

1. Click the upload button in the header
2. Select a PDF file
3. Click Upload to add context for the AI

## Components

### AI Components

- **Conversation** - Scrollable conversation container with auto-scroll
- **Message** - Individual message display with avatars
- **PromptInput** - Advanced input with keyboard shortcuts
- **Reasoning** - Collapsible AI reasoning display
- **Sources** - Expandable source citations

All components follow shadcn/ui patterns and are fully accessible.

## Development

### Building for Production

```bash
npm run build
npm run preview
```

The build output will be in the `dist` directory, ready to be deployed to any static hosting service.

### Linting

```bash
npm run lint
```

## License

MIT

