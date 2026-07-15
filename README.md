# Gerenciador de Gastos — API

API para gerenciamento de gastos pessoais: cadastro e autenticação de usuários, registro de gastos, controle de gastos fixos recorrentes e histórico.

> 🔗 **Acesse a aplicação:** [gerenciador-de-gastos-frontend.onrender.com](https://gerenciador-de-gastos-frontend.onrender.com/)

---

## 🧭 Desenvolvido com OpenSpec

Este projeto foi construído seguindo um fluxo **spec-driven** com [OpenSpec](https://github.com/Fission-AI/OpenSpec). Em vez de codar direto, cada funcionalidade nasce de uma **especificação escrita antes da implementação**: descreve-se o comportamento esperado em requisitos e cenários (`WHEN` / `THEN`), e só então o código é escrito para satisfazê-los.

As especificações vivem versionadas no diretório [`openspec/`](./openspec):

- **`openspec/specs/`** — a "verdade" atual do sistema, organizada por capacidade (`user-auth`, `expense-entries`, `fixed-expenses`, `test-coverage`).
- **`openspec/changes/archive/`** — o histórico de cada mudança já aplicada, preservando a evolução do projeto.

**Benefícios na prática:**

- **Intenção antes do código** — o comportamento é definido e revisado antes da implementação, reduzindo retrabalho.
- **Documentação sempre viva** — as specs descrevem o que o sistema faz hoje, servindo de fonte única de verdade.
- **Cobertura orientada por cenários** — cada requisito vira caso de teste, elevando a confiança nas mudanças.
- **Trilha de evolução** — o histórico de changes deixa claro *o quê* mudou e *por quê*.

---

## ✨ Funcionalidades

- **Autenticação e usuários**
  - Cadastro com `name`, `email` e `password` (senha armazenada com hash, nunca em texto puro).
  - Sign-in com emissão de **JWT em cookie `httpOnly`** e logout que limpa a sessão.
  - Rotas protegidas por padrão; rotas públicas (cadastro/login) explicitamente marcadas.

- **Histórico de gastos (`expense-entries`)**
  - CRUD completo de lançamentos (valor em centavos, descrição e data).
  - Isolamento por usuário — cada um enxerga apenas os próprios lançamentos.

- **Gastos fixos (`fixed-expenses`)**
  - CRUD com **soft delete** e recorrência: `monthly`, `quarterly`, `semiannual`, `annual`.
  - **Data de referência** (`referenceDate`) que define o início da recorrência.
  - **Listagem de pendentes por mês** — calcula quais gastos fixos incidem no mês e ainda não foram confirmados.
  - **Confirmação de gasto fixo** — gera automaticamente um lançamento no histórico, com trava contra dupla confirmação no mesmo mês.

---

## 🛠️ Tecnologias

| Camada | Stack |
| --- | --- |
| Runtime / Framework | [NestJS 11](https://nestjs.com/) sobre Node.js + TypeScript |
| Banco de dados | PostgreSQL com [Drizzle ORM](https://orm.drizzle.team/) |
| Autenticação | JWT (`@nestjs/jwt`) em cookie `httpOnly` + bcrypt |
| Validação | `class-validator` / `class-transformer` e Zod (variáveis de ambiente) |
| Documentação da API | Swagger + [Scalar](https://scalar.com/) em `/docs` |
| Testes | [Vitest](https://vitest.dev/) (unitários + e2e) |
| Qualidade de código | [Biome](https://biomejs.dev/) (lint + format) |
| Infra | Docker / Docker Compose |

---

## 🚀 Como rodar

**Pré-requisitos:** Node.js, Docker e uma instância PostgreSQL (ou use o `docker-compose`).

```bash
# 1. Clonar
git clone https://github.com/brayan-jordan/gerenciador-de-gastos-backend.git
cd gerenciador-de-gastos-backend

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env   # ajuste os valores conforme necessário

# 4. Subir o banco (opcional, via Docker)
docker compose up -d

# 5. Rodar as migrations
npm run db:migrate

# 6. Iniciar em modo desenvolvimento
npm run start:dev
```

A documentação interativa da API fica disponível em `http://localhost:<PORT>/docs`.

---

## 🧪 Testes

```bash
npm run test        # testes unitários
npm run test:e2e    # testes end-to-end
npm run test:cov    # cobertura
```

---

## 📜 Scripts úteis

| Script | Descrição |
| --- | --- |
| `npm run start:dev` | Sobe a API em modo watch |
| `npm run check` | Roda lint + format com Biome |
| `npm run db:generate` | Gera migrations a partir do schema |
| `npm run db:migrate` | Aplica as migrations |
| `npm run db:studio` | Abre o Drizzle Studio |
