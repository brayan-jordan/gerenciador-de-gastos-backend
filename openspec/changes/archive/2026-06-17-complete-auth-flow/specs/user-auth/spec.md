## ADDED Requirements

### Requirement: Cadastro de usuário com email e senha
O sistema SHALL permitir o cadastro de um usuário fornecendo `name`, `email` e `password`. O `email` SHALL ser único no sistema. A senha SHALL ser armazenada de forma criptografada (hash) e NUNCA em texto puro. A resposta do cadastro SHALL NOT incluir a senha (nem em hash).

#### Scenario: Cadastro bem-sucedido
- **WHEN** uma requisição `POST /users` é enviada com `name`, `email` válido e `password`
- **THEN** o sistema cria o usuário, armazena a senha como hash e responde `201` com `id`, `name` e `email` (sem a senha)

#### Scenario: Email já cadastrado
- **WHEN** uma requisição `POST /users` é enviada com um `email` que já existe
- **THEN** o sistema responde `409 Conflict` e não cria um novo usuário

#### Scenario: Dados inválidos
- **WHEN** uma requisição `POST /users` é enviada com email em formato inválido ou senha ausente/curta
- **THEN** o sistema responde `400 Bad Request` sem criar o usuário

### Requirement: Sign-in com emissão de JWT em cookie
O sistema SHALL expor uma rota de sign-in que valida `email` e `password`. Em caso de sucesso, SHALL emitir um JWT contendo o identificador do usuário e gravá-lo em um cookie `httpOnly`. As credenciais SHALL ser verificadas comparando a senha fornecida com o hash armazenado.

#### Scenario: Login bem-sucedido
- **WHEN** uma requisição `POST /sessions` é enviada com `email` e `password` corretos
- **THEN** o sistema responde com sucesso e define um cookie `httpOnly` contendo o JWT do usuário

#### Scenario: Credenciais inválidas
- **WHEN** uma requisição `POST /sessions` é enviada com email inexistente ou senha incorreta
- **THEN** o sistema responde `401 Unauthorized` e não define o cookie de sessão

### Requirement: Logout limpa o cookie de sessão
O sistema SHALL expor uma rota de logout que remove o cookie de autenticação, encerrando a sessão do usuário.

#### Scenario: Logout
- **WHEN** uma requisição `POST /sessions/logout` é enviada
- **THEN** o sistema limpa o cookie de autenticação e responde com sucesso

### Requirement: Proteção de rotas por autenticação
O sistema SHALL proteger rotas exigindo um JWT válido lido do cookie de sessão. Rotas SHALL ser protegidas por padrão; rotas explicitamente marcadas como públicas (ex.: cadastro e sign-in) SHALL permanecer acessíveis sem autenticação. A rota hello world (`GET /`) SHALL exigir autenticação.

#### Scenario: Acesso autenticado à rota protegida
- **WHEN** uma requisição `GET /` é enviada com um cookie contendo JWT válido
- **THEN** o sistema responde `200` com o conteúdo da rota

#### Scenario: Acesso não autenticado à rota protegida
- **WHEN** uma requisição `GET /` é enviada sem cookie de sessão ou com JWT inválido/expirado
- **THEN** o sistema responde `401 Unauthorized`

#### Scenario: Rota pública permanece acessível
- **WHEN** uma requisição é enviada para uma rota marcada como pública (ex.: `POST /users` ou `POST /sessions`) sem autenticação
- **THEN** o sistema processa a requisição normalmente sem exigir JWT
