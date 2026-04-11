# Deploy — SmartFinance

Guia passo a passo para publicar o projeto gratuitamente.
Siga a ordem abaixo — cada etapa gera uma URL usada na próxima.

---

## Pré-requisitos

- Repositório no GitHub com o projeto completo
- Contas criadas em: [Neon.tech](https://neon.tech), [Upstash](https://upstash.com), [Render](https://render.com), [Vercel](https://vercel.com)

---

## PASSO 1 — Banco de Dados (Neon.tech)

1. Acesse [console.neon.tech](https://console.neon.tech) → **New Project**
2. Nome: `smartfinance` | Region: `US East (Ohio)` → **Create Project**
3. Na tela seguinte, copie a **Connection String** (formato `postgresql://...?sslmode=require`)
4. Guarde — será o valor de `DATABASE_URL`

**Rodar migrations:**
```bash
cd backend
# Cole a DATABASE_URL do Neon no comando abaixo:
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

---

## PASSO 2 — Redis (Upstash)

1. Acesse [console.upstash.com](https://console.upstash.com) → **Create Database**
2. Nome: `smartfinance-redis` | Type: `Regional` | Region: `US-East-1` → **Create**
3. Na aba **Details**, copie o campo **REDIS_URL** (começa com `rediss://`)
4. Guarde — será o valor de `REDIS_URL`

---

## PASSO 3 — Backend NestJS (Render)

1. Acesse [render.com](https://render.com) → **New** → **Web Service**
2. Conecte seu repositório GitHub e selecione o repo do SmartFinance
3. Configure:
   - **Name:** `smartfinance-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `node dist/main.js`
   - **Instance Type:** `Free`

4. Em **Environment Variables**, adicione:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | *(string do Neon — Passo 1)* |
   | `REDIS_URL` | *(string do Upstash — Passo 2)* |
   | `JWT_SECRET` | *(gere com: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)* |
   | `JWT_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` |
   | `AI_SERVICE_URL` | *(preencher após Passo 4)* |
   | `CORS_ORIGINS` | *(preencher após Passo 5)* |

5. Clique em **Create Web Service** e aguarde o deploy
6. Anote a URL gerada: `https://smartfinance-api.onrender.com`

7. **Copie o Deploy Hook:**
   - Render → Settings → **Deploy Hook** → copie a URL
   - Guarde como `RENDER_DEPLOY_HOOK_BACKEND` (usada no Passo 6)

---

## PASSO 4 — Serviço de IA FastAPI (Render)

1. Render → **New** → **Web Service**
2. Mesmo repositório GitHub
3. Configure:
   - **Name:** `smartfinance-ai`
   - **Root Directory:** `ai`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`

4. Em **Environment Variables:**

   | Key | Value |
   |-----|-------|
   | `APP_ENV` | `production` |

5. Clique em **Create Web Service** e aguarde o deploy
6. Anote a URL gerada: `https://smartfinance-ai.onrender.com`

7. **Volte ao backend (Passo 3)** → Environment Variables → atualize:
   - `AI_SERVICE_URL` = `https://smartfinance-ai.onrender.com`

8. **Copie o Deploy Hook:**
   - Render → Settings → **Deploy Hook** → copie a URL
   - Guarde como `RENDER_DEPLOY_HOOK_AI` (usada no Passo 6)

9. **Verifique o health check:**
   ```
   GET https://smartfinance-ai.onrender.com/health
   → {"status":"ok","service":"smartfinance-ai"}
   ```

---

## PASSO 5 — Frontend Angular (Vercel)

1. Atualize `frontend/src/environments/environment.prod.ts` com a URL real do backend:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://smartfinance-api.onrender.com',
   }
   ```
   Faça commit e push para o GitHub.

2. Acesse [vercel.com](https://vercel.com) → **Add New Project**
3. Importe o repositório GitHub do SmartFinance
4. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Other` (o `vercel.json` já define tudo)
   - As demais configurações são lidas automaticamente do `vercel.json`
5. Clique em **Deploy** e aguarde
6. Anote a URL: `https://smartfinance-XXXXX.vercel.app`

---

## PASSO 6 — Ajustar CORS e CI/CD

### Atualizar CORS no backend
Render → smartfinance-api → Environment Variables:
- `CORS_ORIGINS` = `https://smartfinance-XXXXX.vercel.app`

Clique em **Manual Deploy** para aplicar.

### GitHub Secrets para CI/CD
No repositório GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret | Valor |
|--------|-------|
| `RENDER_DEPLOY_HOOK_BACKEND` | URL copiada no Passo 3 |
| `RENDER_DEPLOY_HOOK_AI` | URL copiada no Passo 4 |

---

## PASSO 7 — Verificação final

```bash
# 1. Health check da IA
curl https://smartfinance-ai.onrender.com/health

# 2. Login na API de produção
curl -X POST https://smartfinance-api.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","password":"SuaSenha123!"}'

# 3. Acesse o frontend
# https://smartfinance-XXXXX.vercel.app
# Faça login, crie uma conta, registre uma transação
# Verifique se o saldo atualiza e a IA detecta anomalias
```

---

## Resumo das URLs de produção

| Serviço | URL |
|---------|-----|
| Frontend | `https://smartfinance-XXXXX.vercel.app` |
| Backend API | `https://smartfinance-api.onrender.com` |
| IA Service | `https://smartfinance-ai.onrender.com` |
| Banco de dados | Neon.tech (acesso interno via `DATABASE_URL`) |
| Redis | Upstash (acesso interno via `REDIS_URL`) |

---

## Observações

- O plano gratuito do Render **hiberna** serviços após 15 minutos sem requisições. O primeiro request após hibernação pode levar ~30s.
- O Neon.tech pausa o banco após 5 dias sem atividade no plano gratuito — o primeiro acesso o acorda automaticamente.
- A integração Vercel+GitHub faz **deploy automático** a cada push na `main` — não precisa de workflow CI/CD para o frontend.
