## 1. Schema e Migration

- [x] 1.1 Adicionar campo `referenceDate: date('reference_date').notNull()` em `src/models/fixed-expense.ts` e atualizar os tipos `FixedExpense` e `NewFixedExpense`
- [x] 1.2 Rodar `pnpm db:generate` para gerar o arquivo SQL de migration em `./drizzle/`
- [x] 1.3 Editar o SQL gerado: adicionar a coluna como nullable, fazer `UPDATE fixed_expenses SET reference_date = '1970-01-01' WHERE reference_date IS NULL`, depois `ALTER COLUMN reference_date SET NOT NULL`
- [x] 1.4 Aplicar a migration no banco de desenvolvimento via `psql` ou `postgres` direto (não via `db:migrate`)
- [x] 1.5 Aplicar a migration no banco de teste (`gerenciador_de_gastos_test`) da mesma forma

## 2. Contratos (DTOs)

- [x] 2.1 Adicionar campo `referenceDate: string` com `@IsDateString()` e `@ApiProperty` em `src/contracts/create-fixed-expense.contract.ts`
- [x] 2.2 Adicionar campo `referenceDate?: string` com `@IsOptional()`, `@IsDateString()` e `@ApiProperty` em `src/contracts/update-fixed-expense.contract.ts`

## 3. Presenter

- [x] 3.1 Adicionar campo `referenceDate: string` com `@ApiProperty` em `src/presenters/fixed-expense.presenter.ts` e incluí-lo no método estático `toHttp`

## 4. Service

- [x] 4.1 Passar `referenceDate` do contrato para o insert em `src/services/fixed-expense.service.ts` no método de criação
- [x] 4.2 Passar `referenceDate` (quando presente) para o update em `src/services/fixed-expense.service.ts` no método de atualização

## 5. Testes e2e

- [x] 5.1 Atualizar todos os fixtures de criação em `test/fixed-expenses.e2e-spec.ts` para incluir `referenceDate` válido (ex: `'2024-01-01'`)
- [x] 5.2 Adicionar cenário: criação sem `referenceDate` retorna 400
- [x] 5.3 Adicionar cenário: criação com `referenceDate` em formato inválido retorna 400
- [x] 5.4 Adicionar cenário: PATCH com `referenceDate` válido atualiza e retorna o novo valor
- [x] 5.5 Adicionar cenário: PATCH com `referenceDate` inválido retorna 400
- [x] 5.6 Verificar que `referenceDate` aparece nas respostas de GET (listagem e por ID)
- [x] 5.7 Rodar `pnpm test:e2e` e confirmar 100% de cobertura dos cenários de gastos fixos
