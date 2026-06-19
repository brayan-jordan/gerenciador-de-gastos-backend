## MODIFIED Requirements

### Requirement: Criar gasto fixo
O sistema SHALL permitir que um usuário autenticado crie um gasto fixo vinculado ao seu próprio userId. O valor SHALL ser armazenado em centavos (inteiro positivo). A recorrência SHALL ser um dos valores do enum: `monthly`, `quarterly`, `semiannual`, `annual`. O campo `referenceDate` SHALL ser obrigatório e no formato ISO 8601 (`YYYY-MM-DD`), representando a data inicial a partir da qual a recorrência é contada. O campo `isActive` SHALL ser `true` por padrão. Os campos `createdAt` e `updatedAt` SHALL ser preenchidos automaticamente.

#### Scenario: Criação com dados válidos incluindo referenceDate
- **WHEN** usuário autenticado envia POST `/fixed-expenses` com descrição, valor em centavos, recorrência válidos e `referenceDate` no formato `YYYY-MM-DD`
- **THEN** sistema cria o registro com `isActive = true` e retorna 201 com os dados do gasto fixo criado, incluindo `referenceDate`

#### Scenario: Criação sem autenticação
- **WHEN** requisição POST `/fixed-expenses` chega sem cookie `access_token` válido
- **THEN** sistema retorna 401 Unauthorized

#### Scenario: Criação sem referenceDate
- **WHEN** usuário autenticado envia POST `/fixed-expenses` sem o campo `referenceDate`
- **THEN** sistema retorna 400 Bad Request com mensagem de validação

#### Scenario: Criação com referenceDate em formato inválido
- **WHEN** usuário autenticado envia POST `/fixed-expenses` com `referenceDate` fora do formato ISO 8601 (ex: `"15/01/2024"`)
- **THEN** sistema retorna 400 Bad Request com mensagem de validação

#### Scenario: Criação com recorrência inválida
- **WHEN** usuário autenticado envia POST `/fixed-expenses` com valor de recorrência fora do enum
- **THEN** sistema retorna 400 Bad Request com mensagem de validação

#### Scenario: Criação com valor negativo ou zero
- **WHEN** usuário autenticado envia POST `/fixed-expenses` com valor <= 0
- **THEN** sistema retorna 400 Bad Request com mensagem de validação

### Requirement: Listar gastos fixos do usuário
O sistema SHALL retornar apenas os gastos fixos com `isActive = true` pertencentes ao userId do token JWT, incluindo o campo `referenceDate` em cada item. Gastos de outros usuários SHALL ser invisíveis.

#### Scenario: Listagem com gastos existentes
- **WHEN** usuário autenticado envia GET `/fixed-expenses`
- **THEN** sistema retorna 200 com array contendo apenas seus gastos fixos ativos, cada um com `referenceDate`

#### Scenario: Listagem vazia
- **WHEN** usuário autenticado envia GET `/fixed-expenses` e não possui gastos fixos ativos
- **THEN** sistema retorna 200 com array vazio

#### Scenario: Isolamento entre usuários
- **WHEN** usuário A envia GET `/fixed-expenses` e usuário B possui gastos fixos
- **THEN** sistema retorna apenas os gastos de usuário A, nunca os de usuário B

### Requirement: Buscar gasto fixo por ID
O sistema SHALL retornar um gasto fixo específico, incluindo o campo `referenceDate`, somente se ele pertencer ao userId autenticado e estiver ativo (`isActive = true`).

#### Scenario: Busca de gasto próprio existente
- **WHEN** usuário autenticado envia GET `/fixed-expenses/:id` com UUID de um gasto seu ativo
- **THEN** sistema retorna 200 com os dados do gasto fixo, incluindo `referenceDate`

#### Scenario: Busca de gasto inexistente ou de outro usuário
- **WHEN** usuário autenticado envia GET `/fixed-expenses/:id` com UUID inválido, inativo ou de outro usuário
- **THEN** sistema retorna 404 Not Found

### Requirement: Atualizar gasto fixo
O sistema SHALL permitir atualização parcial (PATCH) dos campos `description`, `amountInCents`, `recurrence` e `referenceDate` de um gasto fixo. Somente o proprietário pode atualizar. `updatedAt` SHALL ser atualizado automaticamente.

#### Scenario: Atualização com novo referenceDate
- **WHEN** usuário autenticado envia PATCH `/fixed-expenses/:id` com `referenceDate` válido
- **THEN** sistema atualiza o campo e retorna 200 com os dados atualizados incluindo o novo `referenceDate`

#### Scenario: Atualização com referenceDate inválido
- **WHEN** usuário autenticado envia PATCH `/fixed-expenses/:id` com `referenceDate` fora do formato ISO 8601
- **THEN** sistema retorna 400 Bad Request com mensagem de validação

#### Scenario: Atualização parcial com dados válidos
- **WHEN** usuário autenticado envia PATCH `/fixed-expenses/:id` com um ou mais campos válidos (sem `referenceDate`)
- **THEN** sistema atualiza os campos informados, mantém os demais (incluindo `referenceDate` existente), e retorna 200 com os dados atualizados

#### Scenario: Atualização de gasto de outro usuário
- **WHEN** usuário autenticado envia PATCH `/fixed-expenses/:id` com ID de gasto pertencente a outro usuário
- **THEN** sistema retorna 404 Not Found

#### Scenario: Atualização com valor inválido
- **WHEN** usuário autenticado envia PATCH `/fixed-expenses/:id` com `amountInCents <= 0`
- **THEN** sistema retorna 400 Bad Request

### Requirement: Remover gasto fixo (soft delete)
O sistema SHALL realizar soft delete ao receber DELETE, mudando `isActive = false`. O registro permanece no banco. Somente o proprietário pode deletar.

#### Scenario: Soft delete bem-sucedido
- **WHEN** usuário autenticado envia DELETE `/fixed-expenses/:id` de um gasto seu ativo
- **THEN** sistema muda `isActive = false` e retorna 204 No Content

#### Scenario: Gasto removido não aparece na listagem
- **WHEN** usuário realiza DELETE de um gasto e depois GET `/fixed-expenses`
- **THEN** o gasto deletado não aparece na listagem

#### Scenario: Remoção de gasto de outro usuário
- **WHEN** usuário autenticado envia DELETE `/fixed-expenses/:id` com ID de gasto de outro usuário
- **THEN** sistema retorna 404 Not Found

### Requirement: Decorator CurrentUser para extração do usuário autenticado
O sistema SHALL expor um param decorator `@CurrentUser()` que extrai o payload do JWT (`sub` como userId) do request, reutilizável em qualquer controller.

#### Scenario: Extração do userId em controller protegido
- **WHEN** controller usa `@CurrentUser() userId: string` em um endpoint sem `@Public()`
- **THEN** o valor recebido é o `sub` do JWT do usuário autenticado
