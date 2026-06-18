## Why

O sistema de gerenciamento de gastos precisa de uma funcionalidade central para cadastrar gastos recorrentes (fixos), que são a base para projeções financeiras e a construção automática de lançamentos mensais. Sem esse módulo, o usuário não tem como registrar compromissos financeiros previsíveis como aluguel, assinaturas e parcelas.

## What Changes

- Novo módulo `fixed-expenses` com CRUD completo (criar, listar, buscar, atualizar, deletar)
- Entidade `fixed_expenses` no banco com os campos: descrição, valor em centavos, recorrência, userId, datas de auditoria e flag de ativo
- Enum `recurrence` com valores: `monthly`, `quarterly`, `semiannual`, `annual`
- Todos os endpoints protegidos por autenticação JWT; usuário só acessa seus próprios registros
- Soft delete (campo `isActive`) para preservar histórico ao "remover" um gasto fixo
- Spec de API documentada via OpenAPI/Scalar

## Capabilities

### New Capabilities

- `fixed-expenses`: CRUD de gastos fixos vinculados ao usuário autenticado, com controle de recorrência e soft delete

### Modified Capabilities

<!-- Nenhuma spec existente muda de requisitos -->

## Impact

- **Banco de dados**: nova tabela `fixed_expenses` via Drizzle migration
- **API**: novos endpoints sob `/fixed-expenses`
- **Auth**: módulo reutiliza guard JWT existente de `user-auth`
- **Futuro**: esta tabela será a fonte para geração de lançamentos compilados mensais
