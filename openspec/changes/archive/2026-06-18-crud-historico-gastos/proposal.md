## Why

O sistema precisa de um registro histórico de lançamentos financeiros por usuário — a estrutura central que acumulará gastos ao longo do tempo. Sem esse módulo não há como o sistema apresentar extrato, saldo ou análise de gastos; futuramente os gastos fixos cadastrados alimentarão esse histórico de forma automática, mas já é necessário suportar criação manual.

## What Changes

- Novo módulo `expense-entries` com CRUD completo (criar, listar, buscar, atualizar, deletar)
- Entidade `expense_entries` no banco com os campos: descrição, valor em centavos, data do gasto, userId e datas de auditoria
- Todos os endpoints protegidos por autenticação JWT; cada usuário só acessa seus próprios lançamentos
- Hard delete (remoção física), diferente dos gastos fixos que usam soft delete — lançamentos removidos não precisam ser preservados para rastreabilidade nessa fase
- Spec de API documentada via OpenAPI/Scalar

## Capabilities

### New Capabilities

- `expense-entries`: CRUD de lançamentos no histórico de gastos vinculados ao usuário autenticado

### Modified Capabilities

<!-- Nenhuma spec existente muda de requisitos -->

## Impact

- **Banco de dados**: nova tabela `expense_entries` via Drizzle migration
- **API**: novos endpoints sob `/expense-entries`
- **Auth**: reutiliza guard JWT e decorator `@CurrentUser()` já existentes
- **Futuro**: esta tabela receberá lançamentos gerados automaticamente a partir de `fixed_expenses`
