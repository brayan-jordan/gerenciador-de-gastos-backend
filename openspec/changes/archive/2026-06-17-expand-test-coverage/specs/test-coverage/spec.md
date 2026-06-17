## ADDED Requirements

### Requirement: Cobertura unitária de todo o código dos services
O sistema SHALL ter testes unitários cobrindo todo o código dos services (`AppService`, `UserService`, `AuthService`), incluindo os caminhos de sucesso e os ramos de erro (`NotFoundException`, `ConflictException`, `UnauthorizedException`). Os testes unitários SHALL isolar dependências externas (banco, JwtService) por meio de mocks/fakes.

#### Scenario: Métodos de sucesso do UserService
- **WHEN** os testes unitários de `UserService` executam `create`, `findAll`, `findOne`, `findByEmail`, `update` e `remove` com dados válidos
- **THEN** cada método retorna o resultado esperado e o teste passa

#### Scenario: Ramos de erro do UserService
- **WHEN** `findOne`, `update` ou `remove` são chamados com um id inexistente, e `create` é chamado com email já existente
- **THEN** os testes verificam que `NotFoundException` (id inexistente) e `ConflictException` (email duplicado) são lançadas

#### Scenario: AuthService cobre sucesso e falhas
- **WHEN** os testes de `AuthService.signIn` executam com credenciais válidas, usuário inexistente e senha incorreta
- **THEN** verificam o JWT retornado no sucesso e `UnauthorizedException` nos dois casos de falha

### Requirement: Cobertura e2e de todos os endpoints
O sistema SHALL ter testes end-to-end cobrindo todos os endpoints HTTP expostos. Cada arquivo e2e MAY exercitar múltiplos cenários (sucesso e erro). Os testes e2e SHALL subir a aplicação real e SHALL preparar e limpar o estado do banco para serem repetíveis.

#### Scenario: Endpoint protegido hello world
- **WHEN** `GET /` é chamado com cookie de sessão válido e, separadamente, sem cookie
- **THEN** o teste verifica `200` com o corpo esperado no caso autenticado e `401` no caso não autenticado

#### Scenario: Endpoints de usuário
- **WHEN** os testes e2e exercitam `POST /users` (sucesso, email duplicado, input inválido), `GET /users`, `GET /users/:id`, `PATCH /users/:id` e `DELETE /users/:id` (sucesso e id inexistente/ inválido)
- **THEN** cada cenário retorna o status HTTP correto (`201`, `200`, `204`, `400`, `404`, `409`) e a senha nunca aparece nas respostas

#### Scenario: Endpoints de sessão
- **WHEN** os testes e2e exercitam `POST /sessions` (credenciais válidas e inválidas) e `POST /sessions/logout`
- **THEN** o sign-in válido responde com sucesso e define o cookie `httpOnly`, credenciais inválidas respondem `401`, e o logout responde `204` limpando o cookie

### Requirement: Threshold de cobertura aplicado pela ferramenta
O sistema SHALL configurar um limiar de cobertura de 100% (lines, functions, branches, statements) no relatório de cobertura do Vitest. A execução de cobertura SHALL falhar quando a cobertura ficar abaixo do limiar. Arquivos sem lógica testável (entrypoints, módulos de configuração, schemas) MAY ser excluídos do cálculo de cobertura de forma explícita.

#### Scenario: Cobertura abaixo do limiar falha
- **WHEN** `test:cov` é executado e a cobertura de qualquer métrica está abaixo de 100%
- **THEN** o comando termina com código de saída diferente de zero (falha)

#### Scenario: Cobertura no limiar passa
- **WHEN** `test:cov` é executado e todas as métricas atingem 100% dentro do escopo incluído
- **THEN** o comando termina com sucesso
