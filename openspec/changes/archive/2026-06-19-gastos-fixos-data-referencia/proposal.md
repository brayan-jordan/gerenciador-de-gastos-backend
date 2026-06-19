## Why

Gastos fixos com recorrência não-mensal (ex: `quarterly`, `semiannual`, `annual`) não têm como determinar em quais meses ocorrem sem uma data de referência. Sem ela, não é possível calcular as próximas ocorrências a partir de um ponto inicial definido pelo usuário.

## What Changes

- Adicionar campo `referenceDate` (tipo `date`) à entidade `fixed_expenses`, obrigatório na criação
- O campo representa a data inicial a partir da qual a recorrência é contada (ex: se `referenceDate = 2024-01-15` e `recurrence = quarterly`, as ocorrências são em jan, abr, jul, out nos anos seguintes)
- Atualizar o endpoint de criação (POST) para exigir `referenceDate`
- Atualizar o endpoint de atualização (PATCH) para permitir alterar `referenceDate`
- Atualizar as respostas da API para incluir `referenceDate`
- Migração de banco: nova coluna `reference_date` NOT NULL com valor default para linhas existentes

## Capabilities

### New Capabilities
<!-- nenhuma nova capability isolada; a mudança é uma extensão da capability existente -->

### Modified Capabilities
- `fixed-expenses`: Adição do campo `referenceDate` obrigatório nos requisitos de criação, atualização e leitura de gastos fixos

## Impact

- `src/fixed-expenses/` — entidade, DTO de criação, DTO de atualização, schema Drizzle, migration
- `openspec/specs/fixed-expenses/spec.md` — atualização dos requisitos existentes para incluir `referenceDate`
- Testes e2e de gastos fixos precisam incluir `referenceDate` nas requisições e validações de resposta
