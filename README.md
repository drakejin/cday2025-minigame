# Character Battle - 최강의 캐릭터 만들기

1시간마다 30자 프롬프트로 캐릭터를 성장시키는 이벤트 서비스

## Tech Stack

- **Frontend**: Vite + React 18 + TypeScript
- **Backend**: Supabase (Auth, Database, Realtime, Edge Functions)
- **Styling**: Tailwind CSS + shadcn/ui + Radix UI
- **Linter/Formatter**: Biome.js
- **State Management**: Zustand
- **Router**: React Router v6

## Getting Started

### 1. Install Dependencies

```bash
yarn install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

### 3. Run Development Server

```bash
yarn dev
```

### 4. Build for Production

```bash
yarn build
```

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production (includes format, lint, and type-check)
- `yarn preview` - Preview production build
- `yarn format` - Format code with Biome
- `yarn lint` - Lint and fix code with Biome
- `yarn check` - Run all Biome checks (format + lint)
- `yarn type-check` - Type check with TypeScript

## Project Structure

See [CLAUDE.md](./CLAUDE.md) for detailed setup guide and project structure.

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Setup & Development Guide
- [docs/DB_DESIGN.md](./docs/DB_DESIGN.md) - Database Schema
- [docs/API_SPEC.md](./docs/API_SPEC.md) - API Specification
- [docs/FRONT.md](./docs/FRONT.md) - Frontend Structure

## License

MIT
