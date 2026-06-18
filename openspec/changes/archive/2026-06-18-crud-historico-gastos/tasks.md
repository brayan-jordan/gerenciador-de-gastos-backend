## 1. Modelo e Banco de Dados

- [x] 1.1 Criar tabela `expense_entries` no schema Drizzle com campos: `id`, `userId`, `description`, `amountInCents`, `date`, `createdAt`, `updatedAt`
- [x] 1.2 Exportar o novo model em `src/models/schema.ts`
- [x] 1.3 Gerar migration via `drizzle-kit generate` e aplicar com `db:migrate` (dev e test)

## 2. Contracts (DTOs)

- [x] 2.1 Criar `src/contracts/create-expense-entry.contract.ts` com campos obrigatórios: `description` (string), `amountInCents` (inteiro positivo), `date` (string ISO `YYYY-MM-DD`)
- [x] 2.2 Criar `src/contracts/update-expense-entry.contract.ts` com todos os campos opcionais (partial do create)

## 3. Presenter

- [x] 3.1 Criar `src/presenters/expense-entry.presenter.ts` com todos os campos do lançamento e método `toHttp` estático

## 4. Service

- [x] 4.1 Criar `src/services/expense-entry.service.ts` com método `create(userId, dto)`
- [x] 4.2 Adicionar método `findAll(userId)` — retorna apenas lançamentos do userId
- [x] 4.3 Adicionar método `findOne(userId, id)` — retorna o lançamento ou lança `NotFoundException`
- [x] 4.4 Adicionar método `update(userId, id, dto)` — valida ownership, atualiza campos e `updatedAt`
- [x] 4.5 Adicionar método `remove(userId, id)` — valida ownership, deleta fisicamente (hard delete)

## 5. Controller

- [x] 5.1 Criar `src/controllers/expense-entry.controller.ts` com os 5 endpoints (POST, GET, GET :id, PATCH :id, DELETE :id)
- [x] 5.2 Injetar `@CurrentUser()` em cada endpoint para obter o userId
- [x] 5.3 Adicionar todos os decorators OpenAPI (`@ApiTags`, `@ApiOperation`, `@ApiCreatedResponse`, `@ApiOkResponse`, `@ApiNoContentResponse`, `@ApiNotFoundResponse`, `@ApiCookieAuth`)

## 6. Module

- [x] 6.1 Criar `src/expense-entry.module.ts` com controller e service declarados
- [x] 6.2 Registrar `ExpenseEntryModule` em `src/app.module.ts`

## 7. Testes

- [x] 7.1 Criar testes unitários para `ExpenseEntryService` (todos os métodos, incluindo cenários de ownership e not found)
- [x] 7.2 Criar testes e2e para os 5 endpoints com cenários de autenticação, isolamento entre usuários e validações de entrada
