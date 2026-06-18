import { NotFoundException } from '@nestjs/common'
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
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

describe('FixedExpenseService', () => {
  let service: FixedExpenseService
  let returningResult: unknown[]
  let selectResult: unknown[]

  beforeEach(async () => {
    returningResult = []
    selectResult = []

    const makeWhere = () => Promise.resolve(selectResult)

    const db = {
      select: () => ({
        from: () => ({
          where: makeWhere,
        }),
      }),
      insert: () => ({
        values: (value: unknown) => ({
          returning: () => Promise.resolve([{ id: MOCK_ID, ...value as object }]),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [FixedExpenseService, { provide: DATABASE, useValue: db }],
    }).compile()

    service = module.get<FixedExpenseService>(FixedExpenseService)
  })

  describe('create', () => {
    it('cria e retorna o gasto fixo com o userId correto', async () => {
      const dto = { description: 'Aluguel', amountInCents: 120000, recurrence: 'monthly' as const }
      const result = await service.create(MOCK_USER_ID, dto)
      expect(result.id).toBe(MOCK_ID)
    })
  })

  describe('findAll', () => {
    it('retorna lista de gastos fixos do usuário', async () => {
      selectResult = [MOCK_FIXED_EXPENSE]
      const result = await service.findAll(MOCK_USER_ID)
      expect(result).toEqual([MOCK_FIXED_EXPENSE])
    })

    it('retorna array vazio quando não há gastos fixos', async () => {
      selectResult = []
      const result = await service.findAll(MOCK_USER_ID)
      expect(result).toEqual([])
    })
  })

  describe('findOne', () => {
    it('retorna o gasto fixo quando encontrado', async () => {
      selectResult = [MOCK_FIXED_EXPENSE]
      const result = await service.findOne(MOCK_USER_ID, MOCK_ID)
      expect(result).toEqual(MOCK_FIXED_EXPENSE)
    })

    it('lança NotFoundException quando não encontrado', async () => {
      selectResult = []
      await expect(service.findOne(MOCK_USER_ID, 'missing')).rejects.toBeInstanceOf(NotFoundException)
    })

    it('lança NotFoundException quando pertence a outro usuário', async () => {
      selectResult = []
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
})
