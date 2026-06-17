## 1. Dependências e configuração

- [x] 1.1 Instalar dependências: `bcryptjs`, `@nestjs/jwt`, `cookie-parser` e devDeps `@types/bcryptjs`, `@types/cookie-parser`
- [x] 1.2 Adicionar `JWT_SECRET` (string, min 1) ao `envSchema` em `src/env/env.ts`
- [x] 1.3 Registrar `cookieParser()` no `src/main.ts`

## 2. Modelo e migração

- [x] 2.1 Adicionar colunas `email` (text, not null, unique) e `password` (text, not null) em `src/models/user.ts`
- [x] 2.2 Gerar migração Drizzle (`pnpm db:generate`) e aplicar (`pnpm db:migrate`)

## 3. Contratos e presenter

- [x] 3.1 Atualizar `CreateUserContract` para incluir `email` e `password` (com `@ApiProperty` e validações)
- [x] 3.2 Criar `AuthenticateContract` (sign-in) com `email` e `password`
- [x] 3.3 Garantir que `UserPresenter` não exponha `password`

## 4. Hash de senha no cadastro

- [x] 4.1 No `UserService.create`, gerar hash da senha com bcryptjs (salt rounds 10) antes de inserir
- [x] 4.2 Adicionar `UserService.findByEmail` para consulta por email
- [x] 4.3 Lançar `ConflictException` quando o email já existir no cadastro

## 5. Módulo de autenticação

- [x] 5.1 Criar `AuthModule` configurando `JwtModule` com `JWT_SECRET` e expiração (1d)
- [x] 5.2 Criar `AuthService` com `signIn` (valida credenciais, compara hash, gera JWT `{ sub: userId }`)
- [x] 5.3 Criar `SessionsController` com `POST /sessions` (grava JWT em cookie httpOnly) e `POST /sessions/logout` (limpa cookie), com decorators de documentação

## 6. Guard e decorators

- [x] 6.1 Criar decorator `@Public()` via `SetMetadata`
- [x] 6.2 Criar decorator `@CurrentUser()` para expor o usuário autenticado
- [x] 6.3 Criar `JwtAuthGuard` que lê o JWT do cookie, valida via `JwtService`, injeta `request.user` e respeita `@Public()`
- [x] 6.4 Registrar `JwtAuthGuard` como `APP_GUARD` global no `AppModule`

## 7. Aplicar proteção e rotas públicas

- [x] 7.1 Marcar `POST /users` e as rotas de `SessionsController` apropriadas como `@Public()`
- [x] 7.2 Manter `GET /` (hello world) protegida (sem `@Public()`)

## 8. Testes e verificação

- [x] 8.1 Testes unitários para `AuthService.signIn` (sucesso e credenciais inválidas)
- [x] 8.2 Teste do `UserService.create` garantindo senha em hash e email duplicado retornando conflito
- [x] 8.3 Verificar fluxo end-to-end: cadastro → sign-in (cookie definido) → `GET /` autenticado → logout (cookie limpo) → `GET /` retorna 401
- [x] 8.4 Rodar `pnpm check` (Biome) e garantir que o processo de teste seja encerrado após a verificação
