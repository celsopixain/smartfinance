# PRD — SmartFinance
*Documento de Requisitos do Produto e Guia de Execução com Prompts para IA*

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

## 2. User Stories e Critérios de Aceite

| # | Como... | Quero... | Para... | Critério de Aceite |
|---|---------|----------|---------|-------------------|
| US-01 | Usuário novo | Me cadastrar e fazer login | Acessar minha conta com segurança | JWT emitido, senha com hash bcrypt, refresh token funcional |
| US-02 | Usuário logado | Registrar uma transação (receita ou despesa) | Manter meu histórico atualizado | Transação salva com valor, data, descrição e categoria; valor negativo rejeitado |
| US-03 | Usuário logado | Ver o Dashboard com saldo, receitas e despesas do mês | Ter visão geral rápida das finanças | Cards carregam em < 1.5s com dados reais da API |
| US-04 | Usuário logado | Ver a lista de últimas transações com paginação | Navegar pelo histórico sem lentidão | Paginação de 20 itens por página, ordenada por data desc |
| US-05 | Usuário logado | Ver a predição de gastos para o próximo mês por categoria | Me planejar financeiramente | Predição disponível após 3 meses de histórico; exibe valor previsto e % de variação |
| US-06 | Usuário logado | Receber alerta visual quando um gasto parecer anômalo | Identificar erros ou fraudes | Alerta disparado quando transação superar 2x a média histórica da categoria |

---

## 3. Arquitetura e Stack

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Front-end | Angular 20+ (Standalone, Signals, Zoneless) + Tailwind CSS | Produtividade, performance, DX moderna |
| Validação front | **Zod** | Type-safety dos dados recebidos da API no Angular |
| Back-end | Node.js + NestJS + Prisma ORM **v6** | Arquitetura sólida, type-safe, migrations automáticas (v7 ainda em early access) |
| Banco de Dados | PostgreSQL 16 | Padrão ouro para dados financeiros relacionais |
| Cache / Sessão | **Redis** (via ioredis) | Cache do Dashboard, blacklist de JWT, performance |
| IA / Predição | **Python + FastAPI + Scikit-learn** | Único ecossistema sério para ML (Pandas, NumPy) |
| CI/CD | **GitHub Actions** | Deploy automático a cada push, testes automatizados |
| Infra local | Docker + docker-compose | Um comando sobe tudo (Postgres + Redis) |
| Deploy DB | **Neon.tech** | Melhor plano gratuito, serverless PostgreSQL |
| Deploy Cache | **Upstash Redis** (free tier) | Redis gerenciado, plano gratuito generoso |
| Deploy API | **Render** | Suporta Node.js, variáveis de ambiente, gratuito |
| Deploy IA | **Render** (segundo serviço Python) | Suporta FastAPI nativamente |
| Deploy Front | **Vercel** | Melhor DX para Angular/SSG, CDN global |

---

## 4. Guia de Execução e Prompts

---

### ⚙️ ETAPA 0: Setup do Ambiente (Docker, .env, Repositório)
*Foco em garantir que todo desenvolvedor consiga rodar o projeto localmente com um único comando.*

> **Prompt:**
> Atue como um Engenheiro de DevOps e Desenvolvedor Full-Stack Sênior.
>
> **Contexto:** Vou iniciar o desenvolvimento do SmartFinance, um app financeiro com Angular 20+ no front, NestJS no back, PostgreSQL como banco de dados e Redis para cache e gerenciamento de sessões.
>
> **Tarefa:** Configure o ambiente de desenvolvimento local. Preciso de:
> 1. Um `docker-compose.yml` que suba o **PostgreSQL 16** e o **Redis 7** com as variáveis de ambiente definidas.
> 2. Um arquivo `.env.example` com todas as variáveis necessárias para o back-end NestJS (porta, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `AI_SERVICE_URL`).
> 3. A estrutura de pastas recomendada para o monorepo (pasta `/frontend`, `/backend`, `/ai`).
>
> **Restrições:**
> * O PostgreSQL e o Redis devem persistir dados em volumes Docker nomeados.
> * O `.env.example` não deve conter valores reais, apenas placeholders descritivos.
> * Traga apenas os arquivos de configuração, sem código de aplicação.

---

### 🟢 ETAPA 1: O Banco de Dados (PostgreSQL)
*Foco em criar um alicerce robusto que suporte transações rápidas e histórico para a IA.*

> **Prompt:**
> Atue como um Arquiteto de Software e Desenvolvedor Full-Stack Sênior.
>
> **Contexto:** Estou iniciando o desenvolvimento do SmartFinance, um aplicativo de controle financeiro pessoal com foco em UX premium e recursos de IA (orçamento preditivo e detecção de anomalias). O banco de dados será PostgreSQL 16 gerenciado via Prisma ORM.
>
> **Tarefa:** Desenhe a modelagem do banco de dados ideal para este projeto. Crie as tabelas em sintaxe PostgreSQL que suportem:
> 1. Usuários (com hash de senha, sem armazenar senha em texto plano).
> 2. Contas financeiras vinculadas ao usuário.
> 3. Transações (receitas/despesas) com categorias e subcategorias.
> 4. Orçamentos mensais vinculados a categorias.
> 5. Uma tabela otimizada para armazenar logs históricos que a IA usará para predições de gastos.
>
> **Restrições:**
> * Use sintaxe PostgreSQL exclusivamente.
> * Inclua índices nas colunas mais consultadas (user_id, data, categoria_id).
> * Traga o script SQL de criação das tabelas e uma breve explicação da estrutura de histórico para IA.
> * Não escreva código de front-end ou back-end nesta etapa.

---

### 🔐 ETAPA 2: Autenticação e Autorização (JWT + Redis)
*Foco em proteger todos os endpoints com tokens revogáveis antes de construir qualquer regra de negócio.*

> **Prompt:**
> Atue como um Desenvolvedor Back-end Sênior especialista em segurança e NestJS.
>
> **Contexto:** Estamos desenvolvendo o SmartFinance. O banco de dados PostgreSQL já está modelado e o Redis está disponível. Antes de qualquer outro módulo, precisamos de autenticação segura com suporte a revogação de tokens.
>
> **Tarefa:** Crie o módulo de autenticação no NestJS com:
> 1. **Registro de usuário** (POST `/auth/register`): recebe nome, email e senha; armazena a senha com **bcrypt** (salt rounds: 12); retorna o usuário criado sem expor o hash.
> 2. **Login** (POST `/auth/login`): valida credenciais e retorna um **Access Token JWT** (expira em 15min) e um **Refresh Token** (expira em 7 dias). Armazene o refresh token no **Redis** vinculado ao `user_id`.
> 3. Um **JwtAuthGuard** que, além de validar a assinatura do JWT, verifique se o token não está na **blacklist do Redis**.
> 4. **Refresh token** (POST `/auth/refresh`): valida o refresh token no Redis e emite novos tokens.
> 5. **Logout** (POST `/auth/logout`): adiciona o access token atual à blacklist no Redis com TTL igual ao tempo restante do token.
> 6. **Rate limiting** no endpoint de login usando `@nestjs/throttler` (máximo 5 tentativas por minuto por IP).
>
> **Restrições:**
> * Use `@nestjs/jwt`, `passport-jwt` e `ioredis` para comunicação com o Redis.
> * O `user_id` deve ser extraído do payload do JWT e jamais aceito como parâmetro do cliente.
> * Senhas nunca devem aparecer em logs ou respostas da API.
> * Mensagens de erro de login devem ser genéricas (nunca revelar se o email existe ou não).
> * Traga apenas o código dos arquivos principais do módulo Auth.

---

### 🟡 ETAPA 3: O Back-end — Módulo de Transações (NestJS + TypeScript)
*Foco em criar a API que vai receber, validar e guardar as transações financeiras.*

> **Prompt:**
> Atue como um Desenvolvedor Back-end Sênior especialista em Node.js e NestJS.
>
> **Contexto:** O SmartFinance já tem banco de dados modelado e autenticação JWT funcionando. Agora precisamos criar o módulo de Transações.
>
> **Tarefa:** Crie o `TransactionsModule` no NestJS com:
> 1. **Controller** com rotas protegidas pelo `JwtAuthGuard`:
>    - `POST /transactions` — criar transação
>    - `GET /transactions` — listar transações do usuário logado com paginação (query params: `page`, `limit`)
> 2. **Service** com a regra de negócio para salvar a transação e **rejeitar valores menores ou iguais a zero**.
> 3. **DTO de criação** com validações via `class-validator` (campos: `valor` number positivo, `data` ISO date, `descricao` string, `categoria_id` UUID, `tipo` enum RECEITA/DESPESA).
>
> **Restrições:**
> * Use **Prisma ORM** para comunicação com o banco.
> * Use **Redis** para cachear o resultado da listagem de transações por usuário (cache-key: `transactions:${user_id}:page:${page}`, TTL: 60 segundos). Invalide o cache ao criar uma nova transação.
> * O `user_id` deve vir exclusivamente do JWT (via `@Request()` do guard), nunca do body.
> * TypeScript estrito, arquitetura padrão NestJS.
> * Traga apenas o código dos arquivos principais do módulo.

---

### 🔵 ETAPA 4: O Front-end — Dashboard (Angular 20+ & Tailwind CSS)
*Foco em criar a interface visual do Dashboard bonito, moderno e performático.*

> **Prompt:**
> Atue como um Desenvolvedor Front-end especialista em Angular 20+ e design de UI com Tailwind CSS.
>
> **Contexto:** Estamos no módulo Front-end do SmartFinance. Preciso criar o componente do Dashboard principal.
>
> **Tarefa:** Crie o código (HTML e TypeScript) para um componente de Dashboard financeiro contendo:
> 1. Três cards no topo: Saldo Atual, Receitas do Mês e Despesas do Mês.
> 2. Uma tabela ou lista elegante com as "Últimas Transações" (máximo 10 itens).
> 3. Um botão de destaque para "Nova Transação".
> 4. Um indicador visual de carregamento (skeleton ou spinner) enquanto os dados são buscados.
>
> **Restrições:**
> * Use **Standalone Components** do Angular 20+.
> * Utilize classes do **Tailwind CSS** para layout moderno, minimalista e com suporte a **Dark Mode** (`dark:` prefix).
> * Use dados mockados no TypeScript apenas para preencher a tela neste primeiro momento.
> * Estruture o componente usando **Signals** (`signal()`, `computed()`) para estado reativo — sem RxJS para estado local.
> * Use a nova sintaxe de template com `@if`, `@for` e `@defer` (Angular 20+).
> * Configure o componente como **zoneless** (`ChangeDetectionStrategy.OnPush` + `provideExperimentalZonelessChangeDetection()`).
> * Traga apenas o código do HTML e do arquivo `.ts`.

---

### 🟣 ETAPA 5: Integração Front-end com Back-end
*Foco em fazer o Angular consumir os dados reais da API NestJS com autenticação.*

> **Prompt:**
> Atue como um Desenvolvedor Full-Stack focado em integração de sistemas.
>
> **Contexto:** O Dashboard em Angular 20+ e a API em NestJS estão funcionando isoladamente. A API usa JWT para autenticação.
>
> **Tarefa:**
> 1. Crie um `AuthService` no Angular que gerencie login, armazenamento do token (preferencialmente `sessionStorage` por segurança) e logout.
> 2. Crie um **functional interceptor** (`HttpInterceptorFn`) que injete automaticamente o `Authorization: Bearer <token>` em todas as requisições autenticadas.
> 3. Crie um `TransactionsService` usando a API `resource()` do Angular 20+ para buscar transações da API (`GET /transactions`), aproveitando o estado de `isLoading()` e `error()` nativos.
> 4. Mostre como usar o `resource()` no Dashboard para substituir os dados mockados pelos dados reais, incluindo o skeleton de carregamento via `@if (transactions.isLoading())`.
>
> **Restrições:**
> * Prefira **`resource()` e Signals** ao invés de RxJS para requisições HTTP — use RxJS apenas se necessário para streams contínuos.
> * Use **functional interceptor** (estilo moderno do Angular 20+), não a interface de classe `HttpInterceptor`.
> * Valide o schema dos dados retornados pela API usando **Zod** antes de atribuí-los aos Signals (ex: `TransactionSchema = z.object({...})`). Isso garante type-safety em runtime.
> * Trate erros de autenticação (401) redirecionando para a tela de login via `Router`.
> * Não armazene tokens em `localStorage` — use `sessionStorage` ou cookies `httpOnly`.

---

### 🔴 ETAPA 6: Inteligência Artificial — Predição de Gastos
*Foco em criar o algoritmo que analisa o histórico e projeta os gastos do próximo mês.*

> **Prompt:**
> Atue como um Engenheiro de Machine Learning e Desenvolvedor de APIs.
>
> **Contexto:** O SmartFinance tem banco de dados populado com transações. Precisamos do módulo de Orçamento Preditivo para o próximo mês.
>
> **Tarefa:**
> 1. Crie um serviço **Python + FastAPI** com dois endpoints:
>    - `POST /predict`: recebe `{ user_id, historico: [...] }` (gastos agrupados por categoria dos últimos 3 meses) e retorna a projeção do mês seguinte usando **Média Móvel Ponderada** (Pandas) ou **Regressão Linear Simples** (Scikit-learn).
>    - `POST /anomaly`: recebe `{ valor, categoria_id, user_id }` e retorna `{ is_anomaly: bool, score: float }` comparando com a média histórica da categoria.
> 2. Adicione um endpoint de health check `GET /health` para o Render monitorar o serviço.
> 3. No back-end NestJS, crie um `AiService` que chame o serviço FastAPI via HTTP (usando `@nestjs/axios`) e acione a detecção de anomalia automaticamente ao criar uma transação.
>
> **Restrições:**
> * Use exclusivamente **Python + FastAPI + Pandas + Scikit-learn** — sem Node.js para ML.
> * Dependências mínimas: `fastapi`, `uvicorn`, `pandas`, `scikit-learn`, `pydantic`. Gere o `requirements.txt`.
> * O retorno do `/predict` deve ser `{ categoria, valor_previsto, variacao_percentual }[]`.
> * O serviço FastAPI não deve ser acessível diretamente pelo front-end — apenas pelo NestJS.
> * A URL do serviço FastAPI deve vir da variável de ambiente `AI_SERVICE_URL` no NestJS.

---

### ⚫ ETAPA 7: Testes e Segurança
*Foco em blindar o código e garantir boas práticas antes do deploy.*

> **Prompt:**
> Atue como um Engenheiro de Software focado em Qualidade (QA) e Segurança.
>
> **Contexto:** O MVP do SmartFinance está codificado (Banco, Auth, API, Front e IA).
>
> **Tarefa:**
> 1. Crie testes unitários para o `TransactionsService` do NestJS garantindo que:
>    - Transações com valor negativo ou zero sejam rejeitadas.
>    - O `user_id` venha do JWT e não do body da requisição.
> 2. Crie um teste unitário para a função de detecção de anomalia da IA.
> 3. Aponte os 3 principais riscos de segurança OWASP remanescentes e como mitigá-los (ex: SQL Injection via Prisma, rate limiting no login, sanitização de inputs).
>
> **Restrições:**
> * Use **Jest** para os testes do NestJS.
> * Seja direto: código de teste + lista de riscos com solução objetiva.
> * Não repita conceitos já implementados nas etapas anteriores.

---

### 🟠 ETAPA 8: CI/CD com GitHub Actions
*Foco em automatizar testes e deploy a cada push, eliminando deploy manual.*

> **Prompt:**
> Atue como um Engenheiro de DevOps especialista em GitHub Actions.
>
> **Contexto:** O SmartFinance está completo e hospedado no GitHub. O back-end NestJS faz deploy no Render, o front-end Angular na Vercel e o serviço FastAPI no Render (segundo serviço).
>
> **Tarefa:** Crie os workflows do GitHub Actions:
> 1. **`ci.yml`** — roda a cada Pull Request: executa `jest` no back-end, `ng build` no front-end e `pytest` no serviço de IA. Bloqueia merge se falhar.
> 2. **`deploy-backend.yml`** — roda a cada push na branch `main`: aciona o deploy hook do Render para o serviço NestJS.
> 3. **`deploy-ai.yml`** — roda a cada push na branch `main` com mudanças em `/ai/**`: aciona o deploy hook do Render para o serviço FastAPI.
> 4. O deploy do front-end na Vercel é automático via integração nativa com GitHub — não precisa de workflow.
>
> **Restrições:**
> * As secrets (`RENDER_DEPLOY_HOOK_BACKEND`, `RENDER_DEPLOY_HOOK_AI`) devem ser configuradas no GitHub Secrets — nunca hardcoded.
> * Use `paths` filter no workflow da IA para evitar deploys desnecessários.
> * Traga apenas os arquivos `.yml` dos workflows.

---

### 🌐 ETAPA 9: Deploy (Colocando o App no Ar Gratuitamente)
*Foco em publicar o projeto na internet sem custos para validação e testes.*

> **Prompt:**
> Atue como um Engenheiro de DevOps Sênior.
>
> **Contexto:** O SmartFinance está pronto: Front em Angular 20+, API em NestJS, banco PostgreSQL via Prisma, Redis para cache, serviço de IA em FastAPI e CI/CD no GitHub Actions.
>
> **Tarefa:** Guia passo a passo para:
> 1. Subir o banco PostgreSQL no **Neon.tech** (criar projeto, obter a `DATABASE_URL`, rodar `prisma migrate deploy`).
> 2. Subir o Redis no **Upstash** (criar database, obter a `REDIS_URL` com TLS).
> 3. Fazer deploy da API NestJS no **Render** com todas as variáveis de ambiente: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `AI_SERVICE_URL`.
> 4. Fazer deploy do serviço FastAPI em um **segundo serviço no Render** (definir `requirements.txt` como base, comando: `uvicorn main:app --host 0.0.0.0 --port $PORT`).
> 5. Fazer deploy do Front-end Angular na **Vercel** (configurar `environment.prod.ts` com a URL da API NestJS em produção).
> 6. Configurar os **deploy hooks** do Render nas secrets do GitHub para ativar o CI/CD da Etapa 8.
>
> **Restrições:**
> * Formato "clique aqui → cole ali" — sem explicações teóricas sobre nuvem.
> * Inclua como configurar o CORS no NestJS para aceitar apenas o domínio da Vercel em produção.
> * Inclua como verificar que o Redis e a IA estão conectados após o deploy (health checks).
