## Why

A suíte de testes atual cobre apenas parte dos services (`AppService`, `AuthService`, `UserService`) e tem um único e2e (`GET /`) que, além de mínimo, **está quebrado** porque a rota passou a ser protegida (retorna 401, não mais 200). Não há garantia de que todos os endpoints e toda a lógica dos services funcionem nem proteção contra regressões. Queremos cobertura completa e um threshold que falhe o CI quando a cobertura cair.

## What Changes

- Cobrir **todo o código dos services** com testes unitários: `UserService` (findAll, findOne, update, remove, findByEmail e ramos de NotFound/Conflict), `AuthService` (já coberto, revisar ramos) e `AppService`.
- Cobrir **todos os endpoints com testes e2e**, cada arquivo podendo exercitar múltiplos cenários:
  - `GET /` (protegida): autenticado → 200; sem cookie → 401.
  - `POST /users`: sucesso 201, email duplicado 409, input inválido 400.
  - `GET /users`, `GET /users/:id`, `PATCH /users/:id`, `DELETE /users/:id`: sucesso e casos 404/400 (UUID inválido).
  - `POST /sessions`: sucesso (cookie httpOnly) e credenciais inválidas 401.
  - `POST /sessions/logout`: limpa cookie (204).
- Corrigir o e2e existente de `GET /` para o novo comportamento protegido.
- Configurar **threshold de cobertura 100%** (lines, functions, branches, statements) no Vitest e ajustar exclusões (entrypoints/config sem lógica).
- Padronizar setup/teardown de e2e contra o Postgres real (emails únicos por execução e limpeza da tabela `users`).

## Capabilities

### New Capabilities
- `test-coverage`: requisitos de cobertura de testes — unitários para todo o código de services, e2e para todos os endpoints (múltiplos cenários por arquivo) e um threshold mínimo de cobertura aplicado pela ferramenta.

### Modified Capabilities
<!-- Nenhuma. Os requisitos de comportamento de user-auth não mudam; apenas adicionamos verificação por testes. -->

## Impact

- **Arquivos de teste**: novos `test/users.e2e-spec.ts`, `test/sessions.e2e-spec.ts`, atualização de `test/app.e2e-spec.ts`; novos/ampliados `src/services/user.service.spec.ts`, `src/services/app.service.spec.ts`.
- **Configuração**: `vitest.config.ts` (thresholds de cobertura e exclusões), possivelmente `vitest.config.e2e.ts` (setup global de limpeza do banco).
- **Dependências**: nenhuma nova esperada (`supertest`, `@vitest/coverage-v8`, `@nestjs/testing` já presentes).
- **Pré-requisito de execução**: e2e exigem Postgres acessível via `DATABASE_URL` e `JWT_SECRET` definido no ambiente de teste.
