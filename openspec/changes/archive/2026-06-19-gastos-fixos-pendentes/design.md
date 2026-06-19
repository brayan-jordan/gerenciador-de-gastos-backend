## Context

`fixed_expenses` tem `recurrence` (monthly/quarterly/semiannual/annual) e `referenceDate` (data inicial da recorrência). `expense_entries` registra gastos avulsos com `date`. Não há ligação entre eles. O objetivo é criar um fluxo de "confirmação": o usuário vê quais gastos fixos são devidos no mês e pode confirmá-los com valor possivelmente ajustado, gerando um `expense_entry` rastreável.

## Goals / Non-Goals

**Goals:**
- Endpoint `GET /fixed-expenses/pending?month=YYYY-MM` retornando gastos fixos que incidem no mês e ainda não foram confirmados
- Endpoint `POST /fixed-expenses/:id/confirm` criando um `expense_entry` vinculado ao gasto fixo
- Coluna `fixed_expense_id` nullable em `expense_entries` rastreando a origem
- `fixedExpenseId` exposto no presenter de `expense_entry`

**Non-Goals:**
- Confirmação em lote (múltiplos gastos fixos de uma vez)
- Notificações ou agendamentos automáticos
- Edição do gasto fixo base durante a confirmação (apenas o valor do lançamento é customizável)
- Cancelar/desfazer uma confirmação

## Decisions

### 1. Lógica de recorrência: cálculo por mês alvo vs. referenceDate
Para determinar se um gasto fixo incide no mês `YYYY-MM`, o backend calcula se o mês alvo é "alcançado" pela recorrência a partir de `referenceDate`:

- `monthly`: incide em **todo** mês (a partir do mês de referenceDate)
- `quarterly`: incide se `(mesAlvo - mesReferencia) % 3 === 0` (mesmo dia não importa, só mês/ano)
- `semiannual`: incide se `(mesAlvo - mesReferencia) % 6 === 0`
- `annual`: incide se mês e número do mês coincidem com o mês de `referenceDate` (ex: referenceDate = 2024-03-xx → incide todo março)

O cálculo de diferença em meses: `(anoAlvo - anoRef) * 12 + (mesAlvo - mesRef)`. Resultado negativo (mês anterior à referência) → não incide.

### 2. Rastreamento "já confirmado": fixedExpenseId + month no expense_entry
Alternativa considerada: tabela separada `fixed_expense_confirmations`. Rejeitada por adicionar uma entidade extra sem benefício — o `expense_entry` já é o registro canônico do gasto realizado. Uma FK nullable `fixed_expense_id` em `expense_entries` + query filtrando pelo mês (`date` começa com `YYYY-MM`) é suficiente para saber se já foi confirmado.

### 3. Date do expense_entry gerado na confirmação
O `expense_entry` criado pela confirmação usa o **primeiro dia do mês alvo** (`YYYY-MM-01`) como `date` por padrão. O front pode sobrescrever via campo opcional `date` no body do confirm.

### 4. Valor do confirm
O body de `POST /fixed-expenses/:id/confirm` aceita `amountInCents` opcional. Se omitido, usa `amountInCents` do gasto fixo base. Isso atende o requisito de "o valor pode ser alterado antes de salvar".

### 5. Rota `/fixed-expenses/pending` vs. `/fixed-expenses?pending=true`
Rota dedicada preferida: semântica clara, não polui o GET de listagem existente, e o parâmetro `month` é obrigatório (não faz sentido como filter opcional do GET geral).

## Risks / Trade-offs

- **[Risco] Mês alvo anterior à referenceDate** → Mitigation: diferença negativa em meses → não incide, retorno vazio para esse gasto fixo.
- **[Risco] Gasto fixo inativado entre pending e confirm** → Mitigation: o `confirm` verifica `isActive = true`; se inativo retorna 404.
- **[Trade-off] `fixed_expense_id` nullable em expense_entries** → lançamentos manuais ficam com `null`, o que é correto e esperado.

## Migration Plan

1. Alterar `src/models/expense-entry.ts` — adicionar `fixedExpenseId` nullable com FK
2. Rodar `npm run db:generate`
3. Aplicar SQL diretamente via Node/postgres (coluna nullable, sem UPDATE necessário)
4. Atualizar presenter de expense-entry para expor `fixedExpenseId`
