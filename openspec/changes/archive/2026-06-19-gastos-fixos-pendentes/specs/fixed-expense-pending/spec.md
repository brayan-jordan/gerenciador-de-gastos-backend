## ADDED Requirements

### Requirement: Listar gastos fixos pendentes por mês
O sistema SHALL retornar os gastos fixos ativos do usuário autenticado que incidem no mês informado e que ainda não possuem um `expense_entry` vinculado (`fixedExpenseId`) com `date` dentro daquele mês. O parâmetro `month` no formato `YYYY-MM` SHALL ser obrigatório. A lógica de recorrência SHALL seguir as regras: `monthly` incide em todo mês a partir do mês de `referenceDate`; `quarterly` incide se a diferença em meses entre o mês alvo e o mês de `referenceDate` for divisível por 3; `semiannual` se divisível por 6; `annual` se o número do mês (1–12) coincidir com o mês de `referenceDate`. Gastos fixos cujo `referenceDate` seja posterior ao mês alvo SHALL ser excluídos.

#### Scenario: Listagem com gastos pendentes no mês
- **WHEN** usuário autenticado envia GET `/fixed-expenses/pending?month=2024-01` e possui gastos fixos ativos que incidem em janeiro e ainda não foram confirmados
- **THEN** sistema retorna 200 com array contendo esses gastos fixos com seus campos completos (incluindo `referenceDate`)

#### Scenario: Gasto anual não aparece em mês incorreto
- **WHEN** usuário autenticado envia GET `/fixed-expenses/pending?month=2024-02` e possui gasto fixo `annual` com `referenceDate` em março
- **THEN** sistema retorna 200 sem incluir esse gasto fixo anual na lista

#### Scenario: Gasto anual aparece no mês correto
- **WHEN** usuário autenticado envia GET `/fixed-expenses/pending?month=2024-03` e possui gasto fixo `annual` com `referenceDate` em qualquer março
- **THEN** sistema retorna 200 incluindo esse gasto fixo na lista

#### Scenario: Gasto trimestral aparece nos meses corretos
- **WHEN** usuário autenticado envia GET `/fixed-expenses/pending?month=2024-04` e possui gasto fixo `quarterly` com `referenceDate = 2024-01-xx`
- **THEN** sistema retorna 200 incluindo esse gasto fixo (diferença = 3 meses, divisível por 3)

#### Scenario: Gasto já confirmado no mês não aparece
- **WHEN** usuário autenticado envia GET `/fixed-expenses/pending?month=2024-01` e o gasto fixo mensal já foi confirmado nesse mês (existe `expense_entry` com `fixedExpenseId` e `date` em `2024-01`)
- **THEN** sistema retorna 200 sem incluir esse gasto fixo na lista

#### Scenario: Mês anterior à referenceDate não retorna o gasto
- **WHEN** usuário autenticado envia GET `/fixed-expenses/pending?month=2023-12` e o gasto fixo tem `referenceDate = 2024-01-01`
- **THEN** sistema retorna 200 sem incluir esse gasto fixo

#### Scenario: Parâmetro month ausente retorna 400
- **WHEN** usuário autenticado envia GET `/fixed-expenses/pending` sem o parâmetro `month`
- **THEN** sistema retorna 400 Bad Request com mensagem de validação

#### Scenario: Parâmetro month em formato inválido retorna 400
- **WHEN** usuário autenticado envia GET `/fixed-expenses/pending?month=01-2024`
- **THEN** sistema retorna 400 Bad Request com mensagem de validação

#### Scenario: Exige autenticação
- **WHEN** requisição GET `/fixed-expenses/pending?month=2024-01` chega sem cookie `access_token` válido
- **THEN** sistema retorna 401 Unauthorized

#### Scenario: Isolamento entre usuários
- **WHEN** usuário A envia GET `/fixed-expenses/pending?month=2024-01` e usuário B possui gastos fixos pendentes
- **THEN** sistema retorna apenas os pendentes de usuário A
