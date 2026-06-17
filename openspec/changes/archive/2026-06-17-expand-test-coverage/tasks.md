## 1. Configuração de cobertura

- [x] 1.1 Configurar `coverage.thresholds` = 100 (lines, functions, branches, statements) em `vitest.config.ts`
- [x] 1.2 Definir `coverage.include` para o código com lógica (`src/services/**`, `src/controllers/**`, `src/guards/**`, `src/decorators/**`)
- [x] 1.3 Definir `coverage.exclude` para arquivos sem lógica testável (`src/main.ts`, `**/*.module.ts`, `src/env/**`, `src/database/**`, `src/models/**`, `**/*.spec.ts`, DTOs/presenters declarativos)

## 2. Helper de bootstrap e2e

- [x] 2.1 Criar helper de teste que cria a app a partir de `AppModule` aplicando `ValidationPipe({ whitelist, transform })` e `cookieParser()` (espelhando `main.ts`)
- [x] 2.2 Criar utilitários de banco para e2e: acesso ao provider `DATABASE` da app e função de limpeza da tabela `users`
- [x] 2.3 Criar utilitário para gerar email único por suíte e para autenticar (cadastrar + sign-in + extrair cookie)

## 3. Unit tests dos services

- [x] 3.1 Ampliar `user.service.spec.ts`: cobrir `findAll`, `findOne` (sucesso e NotFound), `findByEmail`, `update` (sucesso e NotFound), `remove` (sucesso e NotFound)
- [x] 3.2 Revisar `user.service.spec.ts`: `create` cobrindo hash e `ConflictException` (já existente — garantir ramos)
- [x] 3.3 Revisar `auth.service.spec.ts`: garantir cobertura dos 3 ramos (sucesso, usuário inexistente, senha incorreta)
- [x] 3.4 Garantir `app.service.spec.ts` cobrindo `getHello`

## 4. Unit/integração de guard e decorators (se necessário p/ 100%)

- [x] 4.1 Testar `JwtAuthGuard.canActivate`: rota pública (`@Public`) permite, sem token → Unauthorized, token inválido → Unauthorized, token válido → injeta `request.user`
- [x] 4.2 Cobrir `@CurrentUser` (retorno de `request.user`) e `@Public` via unit tests dedicados

## 5. e2e dos endpoints

- [x] 5.1 Corrigir `test/app.e2e-spec.ts`: `GET /` autenticado → 200 `Hello World!`; sem cookie → 401
- [x] 5.2 Criar `test/users.e2e-spec.ts`: `POST /users` (201, 409 duplicado, 400 inválido), `GET /users`, `GET /users/:id` (200 e 404), `PATCH /users/:id` (200 e 404), `DELETE /users/:id` (204 e 404), e validar que a senha nunca aparece nas respostas
- [x] 5.3 Criar `test/sessions.e2e-spec.ts`: `POST /sessions` (200 + cookie httpOnly; 401 credenciais inválidas), `POST /sessions/logout` (204 limpando cookie)
- [x] 5.4 Garantir setup/teardown (limpeza de `users`) e emails únicos em todas as suítes e2e

## 6. Verificação

- [x] 6.1 Rodar `npm run test:cov` e iterar até 100% em todas as métricas
- [x] 6.2 Rodar `npm run test:e2e` com Postgres acessível e `JWT_SECRET` definido; garantir todos verdes
- [x] 6.3 Rodar `npm run check` (Biome) e `npm run build`; encerrar quaisquer processos/portas abertos ao final
