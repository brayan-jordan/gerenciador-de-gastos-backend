## Context

O projeto segue um padrão modular NestJS com Drizzle ORM (postgres-js), autenticação JWT via cookie (`access_token`), e documentação via OpenAPI/Scalar. O guard global `JwtAuthGuard` já injeta `request.user` com o payload do token para todos os endpoints não marcados com `@Public()`. A estrutura existente é: `src/models/`, `src/controllers/`, `src/services/`, `src/contracts/`, `src/presenters/`, um `*.module.ts` por domínio.

## Goals / Non-Goals

**Goals:**
- CRUD completo de gastos fixos com isolamento por usuário autenticado
- Soft delete para preservar histórico (campo `isActive`)
- Enum `recurrence` tipado no banco (postgres enum nativo via Drizzle)
- Decorator `@CurrentUser()` reutilizável para extrair userId do JWT em qualquer controller futuro
- Endpoints documentados via Scalar (decorators `@ApiTags`, `@ApiOperation`, etc.)

**Non-Goals:**
- Geração automática de lançamentos mensais a partir dos gastos fixos (fase futura)
- Paginação na listagem (escopo inicial; adicionar quando o volume exigir)
- Filtros por recorrência na listagem (escopo inicial)

## Decisions

### 1. Soft delete com `isActive` em vez de `deletedAt`

O endpoint `DELETE` muda `isActive = false` em vez de apagar o registro. Todos os `SELECT` filtram por `isActive = true`.

**Por quê:** gastos fixos serão referenciados pela coleção de gastos compilados no futuro; apagar o registro quebraria a rastreabilidade histórica.

**Alternativa descartada:** `deletedAt timestamp` — mais verboso para queries e desnecessário enquanto não há necessidade de saber quando foi deletado.

### 2. Enum postgres nativo para `recurrence`

Usar `pgEnum('recurrence', ['monthly', 'quarterly', 'semiannual', 'annual'])` do Drizzle, exposto como `RecurrenceEnum` no schema.

**Por quê:** o banco valida os valores sem necessidade de check constraint manual; o Drizzle infere os tipos TypeScript automaticamente.

**Alternativa descartada:** `text` com check constraint — perde tipagem automática no TS.

### 3. `@CurrentUser()` decorator para extração do userId

Um param decorator `CurrentUser` que lê `request.user.sub` (padrão JWT) injetado pelo guard.

**Por quê:** evita repetir `@Req() req` + cast manual em todo controller que precisar do userId. Segue o padrão DRY do projeto (já existe `@Public()`).

### 4. Campos de auditoria `createdAt` / `updatedAt`

Adicionar `createdAt` e `updatedAt` via `timestamp().defaultNow()` e `.notNull()`.

**Por quê:** consistência com o que a tabela `users` não tem mas deveria; gastos fixos precisarão de ordenação cronológica na listagem futura.

### 5. Validação de ownership no service

O service verifica se o gasto pertence ao `userId` antes de qualquer mutação (update/delete). Retorna `NotFoundException` se não encontrado ou não pertencer ao usuário — não distingue os dois casos para não vazar informação.

## Risks / Trade-offs

- **Migration NOT NULL em tabela com dados** → não aplicável aqui (tabela nova); mas seguir o padrão documentado no projeto de aplicar via SQL direto se necessário.
- **Enum postgres não é reversível facilmente** → se um novo valor de recorrência for adicionado no futuro, exige migration de ALTER TYPE. Mitigação: os 4 valores cobrem o escopo definido e são estáveis.
- **Soft delete aumenta complexidade de queries** → todo `findAll` e `findOne` deve incluir `where isActive = true AND userId = ?`. Centralizar no service evita esquecimento.

## Migration Plan

1. Criar enum `recurrence` e tabela `fixed_expenses` via `drizzle-kit generate`
2. Aplicar migration com `npm run db:migrate` (tabela nova, sem risco de NOT NULL em dados existentes)
3. Rollback: `DROP TABLE fixed_expenses; DROP TYPE recurrence;`
