import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { DATABASE } from '../database/database'
import { FixedExpenseService } from './fixed-expense.service'

const MOCK_USER_ID = 'user-1'
const MOCK_ID = 'fe-1'

const MOCK_FIXED_EXPENSE = {
  id: MOCK_ID,
  userId: MOCK_USER_ID,
  description: 'Aluguel',
  amountInCents: 120000,
  recurrence: 'monthly' as const,
  referenceDate: '2024-01-01',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

const MOCK_ENTRY = {
  id: 'entry-1',
  userId: MOCK_USER_ID,
  fixedExpenseId: MOCK_ID,
  description: 'Aluguel',
  amountInCents: 120000,
  date: '2024-06-01',
  createdAt: new Date('2024-06-01'),
  updatedAt: new Date('2024-06-01'),
}

describe('FixedExpenseService', () => {
  let service: FixedExpenseService
  let returningResult: unknown[]
  let selectQueue: unknown[][]

  function makeDb() {
    let selectCallIndex = 0
    return {
      select: () => ({
        from: () => ({
          where: () => {
            const result = selectQueue[selectCallIndex] ?? []
            selectCallIndex++
            return Promise.resolve(result)
          },
        }),
      }),
      insert: () => ({
        values: (value: unknown) => ({
          returning: () => Promise.resolve([{ id: 'entry-1', ...value as object }]),
        }),
      }),
      update: () => ({
        set: () => ({
          where: () => ({
            returning: () => Promise.resolve(returningResult),
          }),
        }),
      }),
    }
  }

  beforeEach(async () => {
    returningResult = []
    selectQueue = []

    const module: TestingModule = await Test.createTestingModule({
      providers: [FixedExpenseService, { provide: DATABASE, useValue: makeDb() }],
    }).compile()

    service = module.get<FixedExpenseService>(FixedExpenseService)
  })

  describe('create', () => {
    it('cria e retorna o gasto fixo com o userId correto', async () => {
      const dto = { description: 'Aluguel', amountInCents: 120000, recurrence: 'monthly' as const, referenceDate: '2024-01-01' }
      const result = await service.create(MOCK_USER_ID, dto)
      expect(result.id).toBe('entry-1')
    })
  })

  describe('findAll', () => {
    it('retorna lista de gastos fixos do usuário', async () => {
      selectQueue = [[MOCK_FIXED_EXPENSE]]
      const result = await service.findAll(MOCK_USER_ID)
      expect(result).toEqual([MOCK_FIXED_EXPENSE])
    })

    it('retorna array vazio quando não há gastos fixos', async () => {
      selectQueue = [[]]
      const result = await service.findAll(MOCK_USER_ID)
      expect(result).toEqual([])
    })
  })

  describe('findOne', () => {
    it('retorna o gasto fixo quando encontrado', async () => {
      selectQueue = [[MOCK_FIXED_EXPENSE]]
      const result = await service.findOne(MOCK_USER_ID, MOCK_ID)
      expect(result).toEqual(MOCK_FIXED_EXPENSE)
    })

    it('lança NotFoundException quando não encontrado', async () => {
      selectQueue = [[]]
      await expect(service.findOne(MOCK_USER_ID, 'missing')).rejects.toBeInstanceOf(NotFoundException)
    })

    it('lança NotFoundException quando pertence a outro usuário', async () => {
      selectQueue = [[]]
      await expect(service.findOne('other-user', MOCK_ID)).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('update', () => {
    it('atualiza e retorna o gasto fixo', async () => {
      returningResult = [{ ...MOCK_FIXED_EXPENSE, description: 'Novo' }]
      const result = await service.update(MOCK_USER_ID, MOCK_ID, { description: 'Novo' })
      expect(result.description).toBe('Novo')
    })

    it('lança NotFoundException quando não encontrado ou de outro usuário', async () => {
      returningResult = []
      await expect(
        service.update(MOCK_USER_ID, 'missing', { description: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('remove', () => {
    it('realiza soft delete com sucesso', async () => {
      returningResult = [MOCK_FIXED_EXPENSE]
      await expect(service.remove(MOCK_USER_ID, MOCK_ID)).resolves.toBeUndefined()
    })

    it('lança NotFoundException quando não encontrado ou de outro usuário', async () => {
      returningResult = []
      await expect(service.remove(MOCK_USER_ID, 'missing')).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('findPending', () => {
    it('retorna gastos mensais que incidem no mês alvo e não foram confirmados', async () => {
      selectQueue = [[MOCK_FIXED_EXPENSE], []]
      const result = await service.findPending(MOCK_USER_ID, '2024-06')
      expect(result).toEqual([MOCK_FIXED_EXPENSE])
    })

    it('exclui gastos já confirmados no mês', async () => {
      selectQueue = [[MOCK_FIXED_EXPENSE], [{ fixedExpenseId: MOCK_ID }]]
      const result = await service.findPending(MOCK_USER_ID, '2024-06')
      expect(result).toEqual([])
    })

    it('exclui gasto anual quando o mês não corresponde', async () => {
      const annual = { ...MOCK_FIXED_EXPENSE, recurrence: 'annual' as const, referenceDate: '2024-03-01' }
      selectQueue = [[annual], []]
      const result = await service.findPending(MOCK_USER_ID, '2024-05')
      expect(result).toEqual([])
    })

    it('inclui gasto anual quando o mês corresponde', async () => {
      const annual = { ...MOCK_FIXED_EXPENSE, recurrence: 'annual' as const, referenceDate: '2024-03-01' }
      selectQueue = [[annual], []]
      const result = await service.findPending(MOCK_USER_ID, '2025-03')
      expect(result).toEqual([annual])
    })

    it('exclui gasto quando mês alvo é anterior à referenceDate', async () => {
      selectQueue = [[MOCK_FIXED_EXPENSE], []]
      const result = await service.findPending(MOCK_USER_ID, '2023-12')
      expect(result).toEqual([])
    })

    it('inclui gasto trimestral no mês correto (diff % 3 === 0)', async () => {
      const quarterly = { ...MOCK_FIXED_EXPENSE, recurrence: 'quarterly' as const, referenceDate: '2024-01-01' }
      selectQueue = [[quarterly], []]
      const result = await service.findPending(MOCK_USER_ID, '2024-04')
      expect(result).toEqual([quarterly])
    })

    it('exclui gasto trimestral em mês incorreto', async () => {
      const quarterly = { ...MOCK_FIXED_EXPENSE, recurrence: 'quarterly' as const, referenceDate: '2024-01-01' }
      selectQueue = [[quarterly], []]
      const result = await service.findPending(MOCK_USER_ID, '2024-02')
      expect(result).toEqual([])
    })
  })

  describe('confirm', () => {
    it('cria expense_entry com valores do gasto fixo base', async () => {
      selectQueue = [[MOCK_FIXED_EXPENSE], []]
      const result = await service.confirm(MOCK_USER_ID, MOCK_ID, { month: '2024-06' })
      expect(result.fixedExpenseId).toBe(MOCK_ID)
      expect(result.amountInCents).toBe(120000)
      expect(result.date).toBe('2024-06-01')
    })

    it('usa amountInCents customizado quando fornecido', async () => {
      selectQueue = [[MOCK_FIXED_EXPENSE], []]
      const result = await service.confirm(MOCK_USER_ID, MOCK_ID, { month: '2024-06', amountInCents: 95000 })
      expect(result.amountInCents).toBe(95000)
    })

    it('lança ConflictException em dupla confirmação no mesmo mês', async () => {
      selectQueue = [[MOCK_FIXED_EXPENSE], [MOCK_ENTRY]]
      await expect(
        service.confirm(MOCK_USER_ID, MOCK_ID, { month: '2024-06' }),
      ).rejects.toBeInstanceOf(ConflictException)
    })

    it('lança NotFoundException quando gasto fixo não encontrado', async () => {
      selectQueue = [[]]
      await expect(
        service.confirm(MOCK_USER_ID, 'missing', { month: '2024-06' }),
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('lança BadRequestException quando mês não incide na recorrência', async () => {
      const annual = { ...MOCK_FIXED_EXPENSE, recurrence: 'annual' as const, referenceDate: '2024-03-01' }
      selectQueue = [[annual]]
      await expect(
        service.confirm(MOCK_USER_ID, MOCK_ID, { month: '2024-05' }),
      ).rejects.toBeInstanceOf(BadRequestException)
    })
  })
})
