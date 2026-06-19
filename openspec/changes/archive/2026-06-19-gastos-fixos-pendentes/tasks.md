## 1. Schema e Migration

- [x] 1.1 Adicionar coluna `fixedExpenseId` nullable em `src/models/expense-entry.ts` com FK para `fixed_expenses.id`
- [x] 1.2 Rodar `npm run db:generate` para gerar o SQL de migration
- [x] 1.3 Aplicar a migration no banco de desenvolvimento via Node/postgres (coluna nullable, sem UPDATE necessário)
- [x] 1.4 Aplicar a migration no banco de teste (`gerenciador_de_gastos_test`) da mesma forma

## 2. Presenter de expense-entry

- [x] 2.1 Adicionar campo `fixedExpenseId: string | null` com `@ApiProperty` em `src/presenters/expense-entry.presenter.ts` e incluí-lo no método `toHttp`

## 3. Lógica de recorrência (service helper)

- [x] 3.1 Criar função pura `isRecurrenceInMonth(referenceDate: string, recurrence: Recurrence, targetMonth: string): boolean` em `src/services/fixed-expense.service.ts` (ou arquivo helper dedicado) implementando as regras: monthly → sempre; quarterly → diff % 3 === 0; semiannual → diff % 6 === 0; annual → mesmo número de mês; diff negativo → false

## 4. Endpoint GET /fixed-expenses/pending

- [x] 4.1 Adicionar contrato de query `PendingFixedExpenseQuery` com campo `month: string` validado por regex `YYYY-MM` em `src/contracts/`
- [x] 4.2 Adicionar método `findPending(userId: string, month: string): Promise<FixedExpense[]>` em `src/services/fixed-expense.service.ts` usando `isRecurrenceInMonth` e excluindo gastos já confirmados (subquery em `expense_entries` por `fixedExpenseId` e `date LIKE 'YYYY-MM%'`)
- [x] 4.3 Adicionar endpoint `GET /fixed-expenses/pending` em `src/controllers/fixed-expense.controller.ts` — atenção: deve ser declarado **antes** de `GET /fixed-expenses/:id` para não conflitar com o roteamento

## 5. Endpoint POST /fixed-expenses/:id/confirm

- [x] 5.1 Criar contrato `ConfirmFixedExpenseContract` com `month: string` (obrigatório, regex `YYYY-MM`) e `amountInCents?: number` (opcional, `@Min(1)`) em `src/contracts/confirm-fixed-expense.contract.ts`
- [x] 5.2 Adicionar método `confirm(userId: string, id: string, data: ConfirmFixedExpenseContract): Promise<ExpenseEntry>` em `src/services/fixed-expense.service.ts` que: busca o gasto fixo (404 se inativo/inexistente/outro usuário), verifica dupla confirmação (409 se já existe entry com mesmo `fixedExpenseId` e `date LIKE month%`), cria `expense_entry` com `date = month + '-01'`, `amountInCents` do body ou do gasto fixo base, e `fixedExpenseId`
- [x] 5.3 Adicionar endpoint `POST /fixed-expenses/:id/confirm` em `src/controllers/fixed-expense.controller.ts` retornando 201 com `ExpenseEntryPresenter`

## 6. Testes e2e

- [x] 6.1 Atualizar `test/expense-entries.e2e-spec.ts`: verificar que `fixedExpenseId` aparece nos responses de GET (como `null` para lançamentos manuais)
- [x] 6.2 Criar bloco `GET /fixed-expenses/pending` em `test/fixed-expenses.e2e-spec.ts`: mês sem gastos incidentes retorna vazio; gasto mensal aparece; gasto anual no mês errado não aparece; gasto anual no mês certo aparece; gasto já confirmado não aparece; month ausente → 400; month inválido → 400; sem auth → 401
- [x] 6.3 Criar bloco `POST /fixed-expenses/:id/confirm` em `test/fixed-expenses.e2e-spec.ts`: confirmação com valor base → 201 com expense_entry correto; confirmação com valor customizado → 201; dupla confirmação → 409; gasto de outro usuário → 404; gasto inativo → 404; month ausente → 400; amountInCents inválido → 400; sem auth → 401
- [x] 6.4 Rodar `npm run test:e2e` e confirmar 100% de cobertura
