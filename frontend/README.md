# Nitro Finance Hub (Frontend)

Interface React do **Nitro Finance** — gestão de despesas e assinaturas corporativas. Conecta à API FastAPI do backend.

## Tecnologias

- **Vite** + **React** + **TypeScript**
- **shadcn/ui** + **Tailwind CSS**
- **React Query** (TanStack Query) + **Axios**
- **React Router** + **React Hook Form** + **Zod**
- **Vitest** + **Testing Library** (testes)

## Pré-requisitos

- Node.js 18+
- npm ou bun  
- Backend Nitro Finance rodando (para uso sem mock)

## Instalação

```bash
cd frontend
npm install
```

## Variáveis de ambiente

Copie o exemplo e ajuste se precisar:

```bash
cp .env.example .env
```

| Variável           | Descrição                                      | Padrão (dev)     |
|--------------------|------------------------------------------------|------------------|
| `VITE_API_URL`     | URL base da API (sem `/api/v1`)                | _(vazio = usa proxy)_ |
| `VITE_USE_MOCK`    | `true` para usar dados mock (sem backend)      | `false`          |

- **Desenvolvimento:** deixe `VITE_API_URL` vazio. O Vite faz proxy de `/api` para `http://localhost:8000`.
- **Backend em outro host/porta:** use por exemplo `VITE_API_URL=http://localhost:8000`.

## Rodar em desenvolvimento

1. Subir o backend (na pasta do projeto principal):

   ```bash
   cd backend && uvicorn app.main:app --reload
   ```

2. Subir o frontend (a partir da raiz do projeto):

   ```bash
   cd frontend && npm run dev
   ```

Acesse: **http://localhost:5173**

Para testar só o frontend com dados fake, use `VITE_USE_MOCK=true` no `.env` (não precisa do backend).

## Scripts

| Comando           | Descrição                |
|-------------------|--------------------------|
| `npm run dev`     | Servidor de desenvolvimento |
| `npm run build`   | Build de produção        |
| `npm run preview` | Preview do build         |
| `npm run lint`    | ESLint                   |
| `npm run test`    | Testes (Vitest) uma vez  |
| `npm run test:watch` | Testes em modo watch  |

## Testes

```bash
npm run test
```

Testes em modo watch (re-executa ao salvar):

```bash
npm run test:watch
```

Configuração em `vitest.config.ts` e setup em `src/tests/setup.ts`.

## Conexão com o backend

- **Base URL da API:** em dev sem `VITE_API_URL` é usado `/api/v1` (proxy para `http://localhost:8000`).
- **Autenticação:** login em `/auth/login`; o token é enviado em `Authorization: Bearer <token>`.
- **Endpoints usados:** usuários, empresas, departamentos, categorias, despesas, validações mensais (`/expense-validations`), alertas (`/alerts`).

O cliente HTTP e os serviços de API estão em `src/lib/api-client.ts` e `src/services/api.ts`.

## Estrutura principal

```
frontend/
├── public/
├── src/
│   ├── components/   # layout/, expenses/, ui/
│   ├── contexts/     # AuthContext
│   ├── hooks/
│   ├── lib/          # api-client, mock-data, formatters, utils
│   ├── pages/        # Dashboard, Login, Despesas, Validações, Alertas, etc.
│   ├── services/     # api.ts (chamadas à API)
│   ├── tests/        # setup.ts e testes
│   └── types/        # tipos TypeScript
├── index.html
├── package.json
├── vite.config.ts
└── vitest.config.ts
```

## Build para produção

```bash
npm run build
```

Saída em `dist/`. Para servir localmente: `npm run preview`.

## Licença

Uso interno / projeto Nitro Finance.
