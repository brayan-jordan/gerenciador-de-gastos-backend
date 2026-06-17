## Context

O projeto usa Vitest (globals on, swc) com duas configs: `vitest.config.ts` (unit, `src/**/*.spec.ts`, coverage v8) e `vitest.config.e2e.ts` (`test/**/*.e2e-spec.ts`). Hoje existem specs de `AppService`, `AuthService`, `UserService` e um e2e mínimo de `GET /` que está quebrado (rota agora protegida → 401). O `UserService` injeta `DATABASE` (Drizzle/postgres-js); o `AuthService` injeta `UserService` + `JwtService`. Os endpoints e2e exigem Postgres real via `DATABASE_URL` e `JWT_SECRET`. Decisão do usuário: cobertura-alvo **100%** e e2e contra **Postgres real com limpeza**.

## Goals / Non-Goals

**Goals:**
- 100% de cobertura (lines/functions/branches/statements) no escopo incluído.
- Unit tests para todos os ramos dos services com banco/JWT mockados.
- e2e para todos os endpoints, múltiplos cenários por arquivo, contra Postgres real.
- e2e repetíveis: emails únicos por execução + limpeza de `users`.
- Corrigir o e2e de `GET /` para o comportamento protegido.

**Non-Goals:**
- Trocar de runner ou introduzir Testcontainers/banco em memória.
- Testar bibliotecas de terceiros (drizzle, nest internals).
- Testes de carga/performance.

## Decisions

### Unit: fakes de DB e mocks de JwtService
Manter o padrão já existente em `user.service.spec.ts` (fake do query-builder Drizzle) e `auth.service.spec.ts` (`vi.fn()` para `UserService`/`JwtService`). Para 100%, cobrir explicitamente cada método e cada `throw`. Alternativa (banco real no unit) descartada: lentidão e flakiness.

### e2e: AppModule real + autenticação via cookie
Cada suíte e2e sobe `AppModule` com `app.init()`, aplicando o mesmo `ValidationPipe` e `cookieParser` do `main.ts` (extrair um helper de bootstrap de teste para não divergir do app real). Para rotas protegidas, o teste cadastra um usuário, faz `POST /sessions` e reaproveita o cookie retornado via `supertest` (agent ou header `Cookie`).

### e2e: isolamento de estado no Postgres real
Usar emails únicos por execução (sufixo derivado de um contador/label, sem `Date.now()` em código de teste determinístico — pode usar valor estável por suíte) e limpar a tabela `users` em `beforeAll`/`afterAll` via uma conexão Drizzle/postgres obtida do próprio app (`app.get(DATABASE)`). Isso evita colisões de unique e mantém os testes repetíveis.

### Cobertura 100% com exclusões explícitas
Configurar `coverage.thresholds` = 100 em `vitest.config.ts`. Excluir do cálculo arquivos sem lógica testável: `src/main.ts` (bootstrap), `**/*.module.ts`, `src/env/**`, `src/database/**`, `src/models/**`, `src/**/*.spec.ts`, contratos/presenters que são apenas DTOs declarativos quando não tiverem lógica. Incluir explicitamente `src/services/**`, `src/controllers/**`, `src/guards/**`, `src/decorators/**` conforme tiverem lógica. As exclusões são a forma de tornar 100% atingível sem testar código sem comportamento.

### Decorators e guard
`JwtAuthGuard` e `@CurrentUser`/`@Public` têm lógica (leitura de cookie, verificação, metadata). Cobrir o guard preferencialmente via e2e (rotas protegidas/públicas exercitam ambos os ramos) e, se necessário para 100%, um unit test direto do `canActivate` com `ExecutionContext` mockado.

## Risks / Trade-offs

- [e2e dependem de Postgres + JWT_SECRET no ambiente] → documentar pré-requisitos; CI precisa de serviço Postgres. Sem isso os e2e falham por conexão, não por lógica.
- [100% pode forçar exclusões generosas] → mitigar excluindo apenas arquivos comprovadamente sem lógica (entrypoints/config/DTO declarativo) e cobrir o resto de verdade; documentar cada exclusão.
- [Limpeza de `users` apaga dados de dev] → e2e devem rodar contra banco de teste; alertar que `DELETE FROM users` roda no `DATABASE_URL` configurado.
- [Flakiness por estado compartilhado] → emails únicos por suíte e teardown garantem repetibilidade.

## Migration Plan

1. Ajustar `vitest.config.ts`: thresholds 100% + listas include/exclude de coverage.
2. Extrair helper de bootstrap de teste (aplicar ValidationPipe + cookieParser) reaproveitável pelas suítes e2e.
3. Corrigir `test/app.e2e-spec.ts` (autenticado→200, anônimo→401).
4. Criar `test/users.e2e-spec.ts` e `test/sessions.e2e-spec.ts` com setup/teardown de banco.
5. Ampliar unit tests de services para cobrir todos os ramos.
6. Rodar `test:cov` (unit) e `test:e2e`; iterar até 100% e verde; encerrar processos/portas ao final.

## Open Questions

- O CI já provê Postgres para e2e? (assumindo banco local disponível por ora)
R: O CI/CD vai ser adaptado depois, por hora se preocupe em testes para ambiente local
- Banco de teste separado do de desenvolvimento? (recomendado; hoje usa o mesmo `DATABASE_URL`)
R: Sim os testes devem rodar em ambiente isolado
