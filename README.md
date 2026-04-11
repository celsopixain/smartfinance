# SmartFinance

Aplicativo de controle financeiro pessoal com Inteligência Artificial para predição de gastos e detecção de anomalias.

---

## Funcionalidades

- Cadastro e autenticação segura com JWT (access token + refresh token + blacklist Redis)
- Gerenciamento de contas financeiras com saldo atualizado atomicamente
- Registro de transações (receitas e despesas) por categoria
- Dashboard com saldo atual, receitas e despesas do mês
- Detecção automática de gastos anômalos via IA (gasto > 2× a média histórica da categoria)
- Predição de gastos do próximo mês por categoria (Regressão Linear ou Média Móvel Ponderada)
- Dark mode
- Rate limiting no login (máx. 5 tentativas/min por IP)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Angular 21 (Standalone, Signals, Zoneless) + Tailwind CSS 3 |
| Validação frontend | Zod |
| Backend | NestJS + Prisma ORM 6 + TypeScript |
| Banco de dados | PostgreSQL 16 |
| Cache / Sessão | Redis 7 (ioredis) |
| IA / Predição | Python + FastAPI + Scikit-learn + Pandas |
| Infra local | Docker + docker-compose |
| CI/CD | GitHub Actions |
| Deploy DB | Neon.tech |
| Deploy Cache | Upstash Redis |
| Deploy API | Render |
| Deploy Frontend | Vercel |

---

## Estrutura do projeto

```
SmartFinance/
├── backend/          # API NestJS
│   ├── prisma/       # Schema e migrations
│   └── src/
│       ├── auth/         # JWT, login, logout, refresh
│       ├── accounts/     # Contas financeiras
│       ├── categories/   # Categorias de transações
│       ├── transactions/ # CRUD de transações + cache Redis
│       ├── ai/           # Integração com o serviço FastAPI
│       ├── prisma/       # PrismaService (@Global)
│       └── redis/        # RedisService (@Global)
├── frontend/         # App Angular
│   └── src/app/
│       ├── core/         # Services, interceptors, schemas Zod
│       ├── dashboard/    # Tela principal
│       ├── accounts/     # Gestão de contas
│       └── categories/   # Gestão de categorias
├── ai/               # Serviço Python FastAPI
│   ├── app/
│   │   ├── main.py       # Endpoints: /health, /predict, /anomaly
│   │   ├── predictor.py  # Lógica de ML
│   │   └── schemas.py    # Modelos Pydantic
│   └── tests/
├── .github/workflows/  # CI/CD GitHub Actions
├── docker-compose.yml
├── render.yaml         # Blueprint Render (backend + IA)
└── DEPLOY.md           # Guia de deploy passo a passo
```

---

## Rodando localmente

### Pré-requisitos

- Node.js 22+
- Python 3.12+
- Docker Desktop

### 1. Clonar e configurar variáveis

```bash
git clone https://github.com/SEU_USUARIO/SmartFinance.git
cd SmartFinance

cp backend/.env.example backend/.env
# Edite backend/.env e preencha os valores
```

### 2. Subir banco de dados e Redis

```bash
docker-compose up -d
```

### 3. Backend (NestJS)

```bash
cd backend
npm install
npx prisma migrate deploy
npm run start:dev
# API disponível em http://localhost:3000
```

### 4. Serviço de IA (FastAPI)

```bash
cd ai
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# IA disponível em http://localhost:8000
```

### 5. Frontend (Angular)

```bash
cd frontend
npm install
npm start
# App disponível em http://localhost:4200
```

---

## Testes

### Backend (Jest)

```bash
cd backend
npm test
```

### IA (pytest)

```bash
cd ai
pytest tests/ -v
```

---

## API — Endpoints principais

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/auth/register` | Criar conta | — |
| POST | `/auth/login` | Login (retorna JWT) | — |
| POST | `/auth/refresh` | Renovar tokens | — |
| POST | `/auth/logout` | Logout (invalida token) | JWT |
| GET | `/accounts` | Listar contas | JWT |
| POST | `/accounts` | Criar conta | JWT |
| GET | `/categories` | Listar categorias | JWT |
| POST | `/categories` | Criar categoria | JWT |
| GET | `/transactions` | Listar transações (paginado) | JWT |
| POST | `/transactions` | Criar transação | JWT |
| DELETE | `/transactions/:id` | Excluir transação | JWT |

---

## Deploy

**Frontend em produção:** [https://smartfinance-iota.vercel.app](https://smartfinance-iota.vercel.app)

Consulte o [DEPLOY.md](DEPLOY.md) para o guia completo passo a passo (Neon.tech → Upstash → Render → Vercel).

---

## CI/CD

| Workflow | Trigger | O que faz |
|----------|---------|-----------|
| `ci.yml` | Pull Request para `main` | Roda Jest, `ng build` e pytest — bloqueia merge se falhar |
| `deploy-backend.yml` | Push em `main` (pasta `backend/`) | Aciona deploy hook do Render (NestJS) |
| `deploy-ai.yml` | Push em `main` (pasta `ai/`) | Roda pytest + aciona deploy hook do Render (FastAPI) |

O deploy do frontend na Vercel é automático via integração nativa com GitHub.

---

## Variáveis de ambiente (backend)

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `REDIS_URL` | Connection string Redis (usar `rediss://` com TLS em produção) |
| `JWT_SECRET` | Segredo para assinar tokens JWT (mín. 64 bytes aleatórios) |
| `JWT_EXPIRES_IN` | Validade do access token (ex: `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Validade do refresh token (ex: `7d`) |
| `AI_SERVICE_URL` | URL do serviço FastAPI |
| `CORS_ORIGINS` | Origens permitidas, separadas por vírgula |
| `PORT` | Porta da API (padrão: `3000`) |
