## ADDED Requirements

### Requirement: Confirmar gasto fixo para um mês
O sistema SHALL permitir que um usuário autenticado confirme um gasto fixo para um determinado mês, criando um `expense_entry` vinculado. O body SHALL aceitar `month` (formato `YYYY-MM`, obrigatório) e `amountInCents` (opcional; se omitido usa o valor do gasto fixo base). O campo `date` do `expense_entry` criado SHALL ser o primeiro dia do mês informado (`YYYY-MM-01`). O `expense_entry` SHALL ser vinculado ao gasto fixo via `fixedExpenseId`. O sistema SHALL impedir dupla confirmação do mesmo gasto fixo no mesmo mês.

#### Scenario: Confirmação bem-sucedida com valor do gasto fixo base
- **WHEN** usuário autenticado envia POST `/fixed-expenses/:id/confirm` com `{ "month": "2024-01" }` e o gasto fixo existe, está ativo e ainda não foi confirmado em janeiro
- **THEN** sistema cria um `expense_entry` com `amountInCents` do gasto fixo base, `date = "2024-01-01"`, `fixedExpenseId` igual ao id do gasto fixo, e retorna 201 com os dados do lançamento criado

#### Scenario: Confirmação com valor customizado
- **WHEN** usuário autenticado envia POST `/fixed-expenses/:id/confirm` com `{ "month": "2024-01", "amountInCents": 95000 }`
- **THEN** sistema cria o `expense_entry` com `amountInCents = 95000` e retorna 201

#### Scenario: Dupla confirmação no mesmo mês retorna 409
- **WHEN** usuário autenticado envia POST `/fixed-expenses/:id/confirm` com `month` de um mês em que o gasto fixo já foi confirmado
- **THEN** sistema retorna 409 Conflict

#### Scenario: Gasto fixo de outro usuário retorna 404
- **WHEN** usuário autenticado envia POST `/fixed-expenses/:id/confirm` com ID de gasto fixo pertencente a outro usuário
- **THEN** sistema retorna 404 Not Found

#### Scenario: Gasto fixo inativo retorna 404
- **WHEN** usuário autenticado envia POST `/fixed-expenses/:id/confirm` com ID de gasto fixo com `isActive = false`
- **THEN** sistema retorna 404 Not Found

#### Scenario: Month ausente retorna 400
- **WHEN** usuário autenticado envia POST `/fixed-expenses/:id/confirm` sem o campo `month`
- **THEN** sistema retorna 400 Bad Request com mensagem de validação

#### Scenario: Month em formato inválido retorna 400
- **WHEN** usuário autenticado envia POST `/fixed-expenses/:id/confirm` com `month` fora do formato `YYYY-MM`
- **THEN** sistema retorna 400 Bad Request com mensagem de validação

#### Scenario: amountInCents inválido retorna 400
- **WHEN** usuário autenticado envia POST `/fixed-expenses/:id/confirm` com `amountInCents <= 0`
- **THEN** sistema retorna 400 Bad Request com mensagem de validação

#### Scenario: Exige autenticação
- **WHEN** requisição POST `/fixed-expenses/:id/confirm` chega sem cookie `access_token` válido
- **THEN** sistema retorna 401 Unauthorized
