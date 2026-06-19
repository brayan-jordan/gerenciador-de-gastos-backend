## Context

O módulo `fixed-expenses` já possui CRUD completo com validação por JWT, soft delete e enum de recorrência (`monthly`, `quarterly`, `semiannual`, `annual`). O schema Drizzle está em `src/models/fixed-expense.ts`, as migrations geradas ficam em `./drizzle/`. Contratos de entrada/saída vivem em `src/contracts/`. A migration de adicionar coluna NOT NULL em tabela com linhas existentes exige tratativa especial (ver memory `project_drizzle_migrate_notnull`).

## Goals / Non-Goals

**Goals:**
- Adicionar campo `referenceDate` (data ISO `YYYY-MM-DD`) à tabela `fixed_expenses`
- Exigir `referenceDate` na criação; permitir atualização via PATCH
- Incluir `referenceDate` em todas as respostas de gasto fixo
- Garantir migration segura sem travar com linhas existentes

**Non-Goals:**
- Calcular próximas ocorrências ou gerar projeções (lógica futura)
- Alterar o enum `recurrence`
- Mudanças nos módulos de expense-entry ou usuários

## Decisions

### 1. Tipo do campo: `date` (sem horário)
`referenceDate` representa um dia calendário, não um instante. Drizzle expõe `date('reference_date')` que mapeia para `DATE` no Postgres e retorna `string` no formato `YYYY-MM-DD` no select. Alternativa (`timestamp`) adicionaria complexidade de fuso sem benefício.

### 2. Validação no contrato: `@IsDateString()` de class-validator
Valida formato ISO 8601 (`YYYY-MM-DD` ou `YYYY-MM-DDTHH:mm:ssZ`). É o decorador padrão já usado em outros projetos NestJS. Alternativa (`@IsISO8601()`) é equivalente mas menos semântica.

### 3. Migration segura para NOT NULL
A memória do projeto (`project_drizzle_migrate_notnull`) registra que `db:migrate` trava ao adicionar coluna NOT NULL em tabela com linhas. Estratégia:
1. Gerar migration com `db:generate`
2. Editar o SQL gerado: adicionar a coluna como `NULLABLE` primeiro, fazer `UPDATE` com valor padrão, depois `ALTER COLUMN SET NOT NULL`
3. Aplicar via `psql` / `postgres` direto (não via `db:migrate`)

### 4. Presenter: expor `referenceDate` como string ISO
O presenter atual de fixed-expense será atualizado para incluir o campo. Nenhuma transformação de tipo necessária — Drizzle retorna `string` para colunas `date`.

## Risks / Trade-offs

- **[Risco] Linhas existentes sem `referenceDate`** → Mitigation: usar `'1970-01-01'` como valor default na migration para linhas legadas; documentar no SQL da migration.
- **[Risco] Testes e2e quebram sem `referenceDate`** → Mitigation: atualizar todos os fixtures de criação nos testes antes de rodar a suite.
- **[Trade-off] `date` retorna `string` no Drizzle** → aceito; evita overhead de conversão de `Date` object e é mais direto para APIs REST.

## Migration Plan

1. Alterar `src/models/fixed-expense.ts` — adicionar `referenceDate: date('reference_date').notNull()`
2. Rodar `pnpm db:generate` para gerar SQL em `./drizzle/`
3. Editar o SQL gerado para aplicar estratégia ADD NULLABLE → UPDATE → SET NOT NULL
4. Aplicar o SQL diretamente no banco via `psql` (prod e test)
5. Atualizar contratos, presenter, testes e2e
