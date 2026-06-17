## Context

O projeto é um backend NestJS 11 com Drizzle ORM (postgres-js) e validação de env via Zod. Hoje o usuário possui apenas `id` e `name`, não há autenticação e todas as rotas são públicas. A documentação usa Scalar em `/docs`. O Biome está configurado com `useImportType: off` e parameter decorators ligados — classes injetadas e DTOs nunca usam `import type`. O projeto segue um padrão de decorators obrigatório (`@ApiTags`, `@ApiOperation`, `@ApiResponse`) para novos endpoints.

Este change introduz autenticação completa: hash de senha, JWT em cookie httpOnly, guard global e marcação de rotas públicas.

## Goals / Non-Goals

**Goals:**
- Cadastro exigindo `email` (único) e `password` (armazenada como hash).
- Sign-in que emite JWT e grava em cookie `httpOnly`.
- Logout que limpa o cookie.
- Guard JWT global protegendo todas as rotas por padrão; `GET /` protegida.
- Decorator `@Public()` para liberar cadastro e sign-in.
- Documentação Scalar/Swagger mantida para as novas rotas.

**Non-Goals:**
- Refresh tokens / rotação de token.
- Recuperação de senha, verificação de email, RBAC/permissões.
- Rate limiting e bloqueio por tentativas (pode vir depois).

## Decisions

### Hash de senha: bcryptjs
Usar `bcryptjs` (puro JS, sem build nativo no Windows) com salt rounds = 10. Alternativa `argon2` foi considerada, mas exige binário nativo — `bcryptjs` é mais simples para o ambiente atual e suficiente para o escopo.

### JWT via @nestjs/jwt com segredo simétrico (HS256)
Usar `@nestjs/jwt` com `JWT_SECRET` validado no `env.ts` (Zod). Payload mínimo: `{ sub: userId }`, expiração curta (ex.: `7d`). Chaves assimétricas (RS256) foram consideradas, mas adicionam complexidade de gestão de chaves desnecessária neste estágio.

### Token transportado em cookie httpOnly
O sign-in grava o JWT em cookie `httpOnly`, `sameSite: 'lax'`, `secure` em produção. Isso mitiga XSS (token inacessível ao JS do browser). `cookie-parser` é registrado no `main.ts` para leitura. Alternativa Authorization header foi descartada porque o requisito é explicitamente salvar em cookie.

### Guard global + decorator @Public
Registrar `JwtAuthGuard` como `APP_GUARD` global — tudo protegido por padrão (fail-safe). Rotas de cadastro e sign-in recebem `@Public()`, lido via `Reflector` com `SetMetadata`. O guard lê o token de `request.cookies`, valida e injeta o usuário em `request.user`. Decorator `@CurrentUser()` expõe o usuário ao controller.

### Módulo de autenticação dedicado
Criar `AuthModule` (controller `SessionsController`, `AuthService`, configuração do `JwtModule`). O `UserService` ganha `findByEmail` e o hashing acontece no `create`. Presenter de usuário continua sem expor `password`.

## Risks / Trade-offs

- [Senha em hash precisa de migração de schema] → Drizzle migration adiciona colunas `email` (unique, not null) e `password` (not null); como ainda é projeto inicial sem dados de produção, recriar/aplicar migração é seguro.
- [Cookie sem `secure` em dev] → `secure` condicionado ao ambiente; documentar que produção exige HTTPS.
- [bcryptjs é mais lento/menos robusto que argon2] → aceitável para o escopo; salt rounds 10 equilibra custo.
- [Guard global pode bloquear rotas existentes inadvertidamente] → mitigado por `@Public()` explícito e testes cobrindo rotas protegidas e públicas.
- [Sem CSRF protection] → cookie `sameSite: 'lax'` reduz risco; CSRF token fica como melhoria futura (Non-Goal).

## Migration Plan

1. Adicionar dependências: `bcryptjs`, `@nestjs/jwt`, `cookie-parser` (+ `@types/cookie-parser`, `@types/bcryptjs`).
2. Atualizar `env.ts` com `JWT_SECRET`.
3. Atualizar schema do usuário (`email`, `password`) e gerar migração Drizzle (`db:generate` + `db:migrate`).
4. Implementar hashing no cadastro, `AuthModule`, guard global e decorators.
5. Registrar `cookie-parser` no `main.ts` e `JwtAuthGuard` como `APP_GUARD`.
6. Marcar `POST /users` e `POST /sessions` como `@Public()`; deixar `GET /` protegida.
7. Rollback: remover `APP_GUARD` e reverter migração caso necessário.

## Open Questions

- Tempo de expiração do JWT (sugerido `7d`) — confirmar com regra de negócio. 
R: Tempo de expiração 1d
- Nome do cookie (sugerido `access_token`).
R: access_token
