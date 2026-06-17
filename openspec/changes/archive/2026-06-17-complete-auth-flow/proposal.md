## Why

O cadastro de usuários atual aceita apenas `name`, não há autenticação e qualquer rota é pública. Para um gerenciador de gastos pessoais, os dados são sensíveis e precisam estar protegidos por credenciais (email/senha) e por sessão autenticada. Precisamos de um fluxo completo de cadastro, login e logout antes de evoluir as funcionalidades de gastos.

## What Changes

- **BREAKING**: cadastro de usuário passa a exigir `email` e `password` (não mais apenas `name`); o campo `email` é único e a senha nunca é retornada nas respostas.
- Senha armazenada de forma criptografada (hash) no banco — nunca em texto puro.
- Nova rota `POST /sessions` (sign-in) que valida email/senha e emite um JWT gravado em cookie `httpOnly`.
- Nova rota `POST /sessions/logout` que limpa o cookie de autenticação.
- A rota de "hello world" (`GET /`) passa a ser protegida: só acessível com JWT válido.
- Guard de autenticação global baseado em JWT lido do cookie, com decorator para marcar rotas públicas.
- Novas dependências: hashing de senha e emissão/validação de JWT, parsing de cookies.

## Capabilities

### New Capabilities
- `user-auth`: cadastro de usuário com email/senha criptografada, sign-in com emissão de JWT em cookie httpOnly, logout que limpa o cookie, e proteção de rotas exigindo sessão autenticada (incluindo a rota hello world).

### Modified Capabilities
<!-- Nenhuma capability de spec existente; o CRUD de usuário atual não possui spec formal. -->

## Impact

- **Código**: `models/user.ts` (colunas `email`, `password`), `create-user.contract.ts`, `user.service.ts`, `user.controller.ts`, `app.controller.ts` (proteção), `app.module.ts`, `user.module.ts`, `main.ts` (cookie-parser), `env.ts` (segredo do JWT).
- **Novos arquivos**: módulo/serviço de autenticação, guard JWT, decorators (`@Public`, `@CurrentUser`), contrato de sign-in, presenter sem senha.
- **APIs**: novas rotas `POST /sessions` e `POST /sessions/logout`; `POST /users` muda payload; `GET /` exige autenticação.
- **Dependências**: `bcryptjs` (hash), `@nestjs/jwt` (JWT), `cookie-parser` (leitura de cookies).
- **Banco**: migração Drizzle adicionando `email` (unique, not null) e `password` (not null).
