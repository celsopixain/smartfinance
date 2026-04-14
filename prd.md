# PRD — SmartFinance
*Documento de Requisitos do Produto*

**Status:** ✅ MVP entregue e em produção  
**Última atualização:** 2026-04-13

---

## 1. Visão do Produto

### Problema
Pessoas físicas têm dificuldade em acompanhar seus gastos mensais de forma proativa. As ferramentas existentes são reativas — mostram o que já foi gasto, mas não ajudam a prever ou evitar excessos.

### Proposta de Valor
O SmartFinance é um aplicativo de controle financeiro pessoal que combina uma UX premium com Inteligência Artificial para **predizer gastos futuros** e **detectar anomalias** no comportamento financeiro do usuário.

### Público-Alvo
Profissionais entre 25–45 anos, com renda estável, que já tentaram usar planilhas ou outros apps de finanças e abandonaram por falta de automação ou insights úteis.

### Métricas de Sucesso (KPIs)
- Usuário cadastra ao menos 10 transações na primeira semana (engajamento inicial)
- Taxa de retorno semanal > 60% após o primeiro mês
- Predição de gastos com margem de erro < 15% (validação do modelo de IA)
- Tempo de carregamento do Dashboard < 1.5s (performance)

### Fora do Escopo (v1)
- Integração com bancos via Open Finance
- App mobile nativo (iOS/Android)
- Múltiplos usuários por conta / compartilhamento familiar
- Módulo de investimentos

---

## 2. Funcionalidades Implementadas

| # | Funcionalidade | Status | Rota |
|---|---------------|--------|------|
| 1 | Autenticação (registro, login, logout, refresh token) | ✅ | `/auth` |
| 2 | Contas financeiras (criar, listar, editar, excluir) | ✅ | `/accounts` |
| 3 | Categorias (criar, listar, editar, excluir) | ✅ | `/categories` |
| 4 | Transações (criar, listar paginado, excluir) | ✅ | `/transactions` |
| 5 | Dashboard (saldo, receitas/despesas do mês, últimas transações) | ✅ | `/dashboard` |
| 6 | Orçamentos mensais por categoria com progresso | ✅ | `/budgets` |
| 7 | Analytics — gráfico mensal e breakdown por categoria | ✅ | `/analytics` |
| 8 | Transações Recorrentes (criar, ativar/desativar, gerar no mês) | ✅ | `/recurring` |
| 9 | IA — Predição de gastos (regressão linear / média móvel) | ✅ | `/predict` |
| 10 | IA — Detecção de anomalias em transações | ✅ | `/anomaly` |

---

## 3. Arquitetura e Stack

| Camada | Tecnologia | Status |
|--------|-----------|--------|
| Front-end | Angular 21 (Standalone, Signals, Zoneless) + Tailwind CSS | ✅ em produção |
| Validação front | Zod | ✅ |
| Back-end | Node.js + NestJS + Prisma ORM v6 | ✅ em produção |
| Banco de Dados | PostgreSQL 16 (Neon.tech) | ✅ em produção |
| Cache / Sessão | Redis (Upstash) via ioredis | ✅ em produção |
| IA / Predição | Python + FastAPI + Scikit-learn + Pandas | ✅ em produção |
| CI/CD | GitHub Actions | ✅ ativo |
| Deploy DB | Neon.tech | ✅ |
| Deploy Cache | Upstash Redis | ✅ |
| Deploy API | Render | ✅ |
| Deploy IA | Render (segundo serviço) | ✅ |
| Deploy Front | Vercel | ✅ |

---

## 4. Estrutura de Pastas

```
SmartFinance/
├── frontend/                  # Angular 21 + Tailwind
│   └── src/app/
│       ├── auth/              # Login, Register
│       ├── dashboard/         # Dashboard principal
│       ├── accounts/          # Contas financeiras
│       ├── categories/        # Categorias
│       ├── budgets/           # Orçamentos mensais
│       ├── analytics/         # Gráficos e relatórios
│       ├── recurring/         # Transações recorrentes
│       └── core/
│           ├── services/      # AuthService, TransactionsService, etc.
│           ├── schemas/       # Zod schemas
│           └── interceptors/  # JWT interceptor
│
├── backend/                   # NestJS + Prisma
│   └── src/
│       ├── auth/              # JWT, bcrypt, Redis blacklist
│       ├── transactions/      # CRUD + cache Redis
│       ├── accounts/          # Contas do usuário
│       ├── categories/        # Categorias
│       ├── budgets/           # Orçamentos + cálculo de gastos
│       ├── analytics/         # Relatórios mensais e por categoria
│       ├── recurring-transactions/ # Transações recorrentes
│       ├── ai/                # AiService (chama FastAPI)
│       ├── prisma/            # PrismaService
│       └── redis/             # RedisService
│
├── ai/                        # Python + FastAPI
│   ├── app/
│   │   ├── main.py            # Endpoints /predict, /anomaly, /health
│   │   ├── predictor.py       # Lógica de ML (LinearRegression + WMA)
│   │   └── schemas.py         # Pydantic schemas
│   └── tests/
│       └── test_predictor.py  # pytest
│
└── .github/workflows/
    ├── ci.yml                 # Jest + ng build + pytest em todo PR
    ├── deploy-backend.yml     # Deploy Render ao push em main/backend
    └── deploy-ai.yml          # Testa + deploy Render ao push em main/ai
```

---

## 5. Modelos de Dados (Prisma)

- **User** — autenticação, relações com tudo
- **Account** — contas financeiras com saldo
- **Category** — categorias de transação com ícone
- **Transaction** — receitas/despesas, flag `isAnomaly`
- **Budget** — orçamento mensal por categoria (`@@unique` userId+categoryId+month+year)
- **RecurringTransaction** — transações recorrentes com `dayOfMonth` e `isActive`
- **AiSpendingLog** — log mensal por categoria para a IA

---

## 6. CI/CD e Deploy

### Pipeline
1. **Pull Request** → `ci.yml` roda Jest (backend), `ng build --prod` (frontend), pytest (IA)
2. **Push em `main` com mudanças em `backend/`** → `deploy-backend.yml` aciona Render
3. **Push em `main` com mudanças em `ai/`** → `deploy-ai.yml` testa + aciona Render
4. **Push em `main`** → Vercel detecta automaticamente e faz deploy do frontend

### Migrations em Produção
O script `start` do backend executa `prisma migrate deploy` antes de subir o servidor, garantindo que o banco (Neon) fique sempre sincronizado com o schema a cada deploy.

---

## 7. Segurança

- Senhas com bcrypt (salt rounds: 12)
- JWT Access Token (15min) + Refresh Token (7 dias) no Redis
- Blacklist de tokens no Redis com TTL exato
- Rate limiting no login via `@nestjs/throttler` (5 req/min por IP)
- `user_id` extraído exclusivamente do JWT — nunca aceito do body
- Cache por usuário com invalidação automática ao criar/remover transações
- Helmet habilitado no NestJS
