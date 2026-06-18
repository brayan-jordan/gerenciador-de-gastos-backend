## 1. Modelo e Banco de Dados

- [x] 1.1 Criar enum `recurrence` no schema Drizzle (`pgEnum`) com valores `monthly`, `quarterly`, `semiannual`, `annual`
- [x] 1.2 Criar tabela `fixed_expenses` no schema Drizzle com campos: `id`, `userId`, `description`, `amountInCents`, `recurrence`, `isActive`, `createdAt`, `updatedAt`
- [x] 1.3 Exportar o novo model em `src/models/schema.ts`
- [x] 1.4 Gerar migration via `drizzle-kit generate` e aplicar com `db:migrate`

## 2. Decorator CurrentUser

- [x] 2.1 Criar `src/decorators/current-user.decorator.ts` que extrai `request.user.sub` como userId

## 3. Contracts (DTOs)

- [x] 3.1 Criar `src/contracts/create-fixed-expense.contract.ts` com campos obrigatórios: `description` (string), `amountInCents` (inteiro positivo), `recurrence` (enum)
- [x] 3.2 Criar `src/contracts/update-fixed-expense.contract.ts` com todos os campos opcionais (partial do create)

## 4. Presenter

- [x] 4.1 Criar `src/presenters/fixed-expense.presenter.ts` com todos os campos do gasto fixo e método `toHttp` estático

## 5. Service

- [x] 5.1 Criar `src/services/fixed-expense.service.ts` com método `create(userId, dto)`
- [x] 5.2 Adicionar método `findAll(userId)` — retorna apenas registros com `isActive = true` do userId
- [x] 5.3 Adicionar método `findOne(userId, id)` — retorna o registro ou lança `NotFoundException`
- [x] 5.4 Adicionar método `update(userId, id, dto)` — valida ownership, atualiza campos e `updatedAt`
- [x] 5.5 Adicionar método `remove(userId, id)` — valida ownership, muda `isActive = false`

## 6. Controller

- [x] 6.1 Criar `src/controllers/fixed-expense.controller.ts` com os 5 endpoints (POST, GET, GET :id, PATCH :id, DELETE :id)
- [x] 6.2 Injetar `@CurrentUser()` em cada endpoint para obter o userId
- [x] 6.3 Adicionar todos os decorators OpenAPI (`@ApiTags`, `@ApiOperation`, `@ApiCreatedResponse`, `@ApiOkResponse`, `@ApiNoContentResponse`, `@ApiNotFoundResponse`, `@ApiBearerAuth` / cookie auth)

## 7. Module

- [x] 7.1 Criar `src/fixed-expense.module.ts` com controller e service declarados
- [x] 7.2 Registrar `FixedExpenseModule` em `src/app.module.ts`

## 8. Testes

- [x] 8.1 Criar testes unitários para `FixedExpenseService` (todos os métodos, incluindo cenários de ownership e not found)
- [x] 8.2 Criar testes e2e para os 5 endpoints com cenários de autenticação, isolamento entre usuários e validações de entrada
