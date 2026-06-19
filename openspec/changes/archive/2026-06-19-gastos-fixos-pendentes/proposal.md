## Why

Gastos fixos e histórico de gastos existem como entidades separadas, mas o usuário precisa de um fluxo para confirmar gastos fixos recorrentes no mês corrente — visualizando apenas os que são devidos naquele mês e que ainda não foram registrados no histórico, com possibilidade de ajustar o valor antes de salvar.

## What Changes

- Novo endpoint `GET /fixed-expenses/pending?month=YYYY-MM` que retorna os gastos fixos ativos cuja recorrência incide no mês informado e que ainda não foram confirmados (sem `expense_entry` vinculado naquele mês)
- Novo endpoint `POST /fixed-expenses/:id/confirm` que recebe o mês e opcionalmente um valor customizado, cria um `expense_entry` vinculado ao gasto fixo e marca a confirmação
- Coluna `fixedExpenseId` (nullable) adicionada à tabela `expense_entries` para rastrear origem
- Migration segura para adicionar `fixed_expense_id` nullable

## Capabilities

### New Capabilities
- `fixed-expense-pending`: Listagem de gastos fixos pendentes por mês, com lógica de recorrência e exclusão de já confirmados
- `fixed-expense-confirm`: Confirmação de um gasto fixo para um mês, criando o lançamento no histórico com valor possivelmente customizado

### Modified Capabilities
- `expense-entries`: Campo `fixedExpenseId` opcional passa a fazer parte da estrutura retornada e pode ser informado via confirmação (não diretamente no POST /expense-entries)

## Impact

- `src/models/expense-entry.ts` — nova coluna `fixedExpenseId` nullable com FK para `fixed_expenses`
- `src/models/fixed-expense.ts` — sem alteração estrutural
- Novos service methods: `findPending(userId, month)` e `confirm(userId, id, month, amountInCents?)`
- `src/controllers/fixed-expense.controller.ts` — 2 novos endpoints
- `src/presenters/expense-entry.presenter.ts` — expor `fixedExpenseId`
- Migration em `./drizzle/` para `fixed_expense_id` nullable
- Testes e2e: novos cenários para os 2 endpoints e para `fixedExpenseId` na resposta de expense-entries
