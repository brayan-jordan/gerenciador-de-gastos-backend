## Context

O projeto segue padrão modular NestJS com Drizzle ORM (postgres-js), autenticação JWT via cookie (`access_token`) e documentação OpenAPI/Scalar. Já existem módulos `users`, `fixed-expenses` e `auth`. O guard global `JwtAuthGuard` injeta `request.user` em todos os endpoints não marcados `@Public()`. O decorator `@CurrentUser()` (em `src/decorators/current-user.decorator.ts`) extrai o payload JWT e já está disponível para reutilização.

## Goals / Non-Goals

**Goals:**
- CRUD completo de lançamentos históricos com isolamento por usuário autenticado
- Campo `date` como data do gasto (independente de `createdAt`) para permitir lançamentos retroativos
- Hard delete — lançamentos removidos pelo usuário são apagados fisicamente
- Endpoints documentados via Scalar

**Non-Goals:**
- Geração automática de lançamentos a partir de `fixed_expenses` (fase futura)
- Paginação ou filtros por data/período (escopo inicial)
- Categorização de lançamentos (escopo futuro)

## Decisions

### 1. Hard delete em vez de soft delete

O endpoint `DELETE` remove o registro fisicamente. Diferente de `fixed_expenses` (que usa `isActive` para preservar rastreabilidade), lançamentos históricos removidos pelo usuário não têm relacionamentos dependentes nessa fase.

**Por quê:** simplicidade de queries (sem filtro `isActive`); lançamentos são dados do usuário final que ele pode querer corrigir/remover sem rastro. Se no futuro lançamentos gerados automaticamente por gastos fixos precisarem ser rastreados, pode-se adicionar `sourceFixedExpenseId` e um soft delete nessa iteração.

**Alternativa descartada:** soft delete — adicionaria complexidade sem benefício imediato, pois não há relacionamentos dependentes.

### 2. Campo `date` separado de `createdAt`

A tabela terá `date date NOT NULL` (data do gasto) além de `createdAt timestamp` (data de inserção no sistema).

**Por quê:** o usuário pode registrar um lançamento retroativo (ex: esqueceu de registrar uma despesa de semana passada). Usar `createdAt` como data do gasto misturaria metadado de auditoria com dado de negócio.

**Tipo `date` vs `timestamp`:** usamos `date` (sem hora) porque a granularidade de dia é suficiente para um histórico de gastos pessoais; simplifica inputs e comparações.

### 3. Reutilização de `@CurrentUser()` e `JwtAuthGuard`

Sem alteração no decorator ou guard existentes. O controller usa `@CurrentUser() user: AuthenticatedUser` e acessa `user.sub` como `userId`.

### 4. Validação de ownership no service

O service filtra sempre por `userId` nas queries. Para `findOne`, `update` e `remove`, retorna `NotFoundException` se não encontrado ou não pertencente ao usuário — sem distinguir os dois casos para não vazar informação.

## Risks / Trade-offs

- **Sem soft delete:** se no futuro lançamentos automáticos (gerados por gastos fixos) precisarem ser rastreados, será necessário uma migration para adicionar `isActive` ou `sourceFixedExpenseId`. Mitigação: o design é fácil de evoluir.
- **Campo `date` como `date` (sem fuso):** para um app de finanças pessoais, fuso horário raramente importa na data de uma despesa. Se globalização for necessária no futuro, a migration para `timestamptz` é simples.

## Migration Plan

1. Criar tabela `expense_entries` via `drizzle-kit generate`
2. Aplicar em dev e test com `db:migrate` (tabela nova, sem risco)
3. Rollback: `DROP TABLE expense_entries;`
