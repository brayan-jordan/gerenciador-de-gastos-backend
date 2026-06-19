## MODIFIED Requirements

### Requirement: Criar lançamento no histórico
O sistema SHALL permitir que um usuário autenticado crie um lançamento de gasto com descrição, valor em centavos (inteiro positivo) e data do gasto. O lançamento SHALL ser vinculado ao userId do token JWT. O campo `fixedExpenseId` SHALL ser aceito opcionalmente no body; quando presente, SHALL ser uma FK válida para um gasto fixo do próprio usuário. Os campos `createdAt` e `updatedAt` SHALL ser preenchidos automaticamente.

#### Scenario: Criação com dados válidos
- **WHEN** usuário autenticado envia POST `/expense-entries` com descrição, valor em centavos e data válidos
- **THEN** sistema cria o lançamento e retorna 201 com os dados do lançamento criado (incluindo `fixedExpenseId: null`)

#### Scenario: Criação sem autenticação
- **WHEN** requisição POST `/expense-entries` chega sem cookie `access_token` válido
- **THEN** sistema retorna 401 Unauthorized

#### Scenario: Criação com valor zero ou negativo
- **WHEN** usuário autenticado envia POST `/expense-entries` com `amountInCents <= 0`
- **THEN** sistema retorna 400 Bad Request com mensagem de validação

#### Scenario: Criação com data inválida
- **WHEN** usuário autenticado envia POST `/expense-entries` com `date` em formato inválido
- **THEN** sistema retorna 400 Bad Request com mensagem de validação

### Requirement: Listar lançamentos do usuário
O sistema SHALL retornar apenas os lançamentos pertencentes ao userId do token JWT, incluindo o campo `fixedExpenseId` em cada item. Lançamentos de outros usuários SHALL ser invisíveis.

#### Scenario: Listagem com lançamentos existentes
- **WHEN** usuário autenticado envia GET `/expense-entries`
- **THEN** sistema retorna 200 com array contendo apenas seus lançamentos, cada um com `fixedExpenseId` (null ou UUID)

#### Scenario: Listagem vazia
- **WHEN** usuário autenticado envia GET `/expense-entries` e não possui lançamentos
- **THEN** sistema retorna 200 com array vazio

#### Scenario: Isolamento entre usuários
- **WHEN** usuário A envia GET `/expense-entries` e usuário B possui lançamentos
- **THEN** sistema retorna apenas os lançamentos de usuário A, nunca os de usuário B

### Requirement: Buscar lançamento por ID
O sistema SHALL retornar um lançamento específico, incluindo `fixedExpenseId`, somente se ele pertencer ao userId autenticado.

#### Scenario: Busca de lançamento próprio existente
- **WHEN** usuário autenticado envia GET `/expense-entries/:id` com UUID de um lançamento seu
- **THEN** sistema retorna 200 com os dados do lançamento, incluindo `fixedExpenseId`

#### Scenario: Busca de lançamento inexistente ou de outro usuário
- **WHEN** usuário autenticado envia GET `/expense-entries/:id` com UUID inexistente ou de outro usuário
- **THEN** sistema retorna 404 Not Found

### Requirement: Atualizar lançamento
O sistema SHALL permitir atualização parcial (PATCH) dos campos `description`, `amountInCents` e `date` de um lançamento. Somente o proprietário pode atualizar. `updatedAt` SHALL ser atualizado automaticamente.

#### Scenario: Atualização parcial com dados válidos
- **WHEN** usuário autenticado envia PATCH `/expense-entries/:id` com um ou mais campos válidos
- **THEN** sistema atualiza os campos informados, mantém os demais, e retorna 200 com os dados atualizados

#### Scenario: Atualização de lançamento de outro usuário
- **WHEN** usuário autenticado envia PATCH `/expense-entries/:id` com ID pertencente a outro usuário
- **THEN** sistema retorna 404 Not Found

#### Scenario: Atualização com valor inválido
- **WHEN** usuário autenticado envia PATCH `/expense-entries/:id` com `amountInCents <= 0`
- **THEN** sistema retorna 400 Bad Request

### Requirement: Remover lançamento (hard delete)
O sistema SHALL remover fisicamente o lançamento ao receber DELETE. Somente o proprietário pode deletar.

#### Scenario: Remoção bem-sucedida
- **WHEN** usuário autenticado envia DELETE `/expense-entries/:id` de um lançamento seu
- **THEN** sistema remove o registro e retorna 204 No Content

#### Scenario: Lançamento removido não aparece na listagem
- **WHEN** usuário realiza DELETE de um lançamento e depois GET `/expense-entries`
- **THEN** o lançamento deletado não aparece na listagem

#### Scenario: Remoção de lançamento de outro usuário
- **WHEN** usuário autenticado envia DELETE `/expense-entries/:id` com ID de outro usuário
- **THEN** sistema retorna 404 Not Found
