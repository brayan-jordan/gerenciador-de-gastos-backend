import { Test, type TestingModule } from '@nestjs/testing'
import type { AuthenticatedUser } from '../decorators/current-user.decorator'
import { FixedExpenseService } from '../services/fixed-expense.service'
import { FixedExpenseController } from './fixed-expense.controller'

const USER: AuthenticatedUser = { sub: 'user-1' }
const MOCK_ID = 'fe-1'

const MOCK_FIXED_EXPENSE = {
  id: MOCK_ID,
  userId: USER.sub,
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
  userId: USER.sub,
  fixedExpenseId: MOCK_ID,
  description: 'Aluguel',
  amountInCents: 120000,
  date: '2024-06-01',
  createdAt: new Date('2024-06-01'),
  updatedAt: new Date('2024-06-01'),
}

describe('FixedExpenseController', () => {
  let controller: FixedExpenseController
  let service: {
    create: ReturnType<typeof vi.fn>
    findAll: ReturnType<typeof vi.fn>
    findPending: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    confirm: ReturnType<typeof vi.fn>
    remove: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    service = {
      create: vi.fn(),
      findAll: vi.fn(),
      findPending: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      confirm: vi.fn(),
      remove: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FixedExpenseController],
      providers: [{ provide: FixedExpenseService, useValue: service }],
    }).compile()

    controller = module.get<FixedExpenseController>(FixedExpenseController)
  })

  it('create retorna o presenter do gasto fixo criado', async () => {
    service.create.mockResolvedValue(MOCK_FIXED_EXPENSE)
    const result = await controller.create(USER, {
      description: 'Aluguel',
      amountInCents: 120000,
      recurrence: 'monthly',
      referenceDate: '2024-01-01',
    })
    expect(service.create).toHaveBeenCalledWith(USER.sub, expect.objectContaining({ description: 'Aluguel' }))
    expect(result.id).toBe(MOCK_ID)
    expect(result.referenceDate).toBe('2024-01-01')
  })

  it('findAll mapeia todos os gastos fixos através do presenter', async () => {
    service.findAll.mockResolvedValue([MOCK_FIXED_EXPENSE])
    const result = await controller.findAll(USER)
    expect(service.findAll).toHaveBeenCalledWith(USER.sub)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(MOCK_ID)
  })

  it('findPending retorna lista de gastos pendentes para o mês', async () => {
    service.findPending.mockResolvedValue([MOCK_FIXED_EXPENSE])
    const result = await controller.findPending(USER, { month: '2024-06' })
    expect(service.findPending).toHaveBeenCalledWith(USER.sub, '2024-06')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(MOCK_ID)
  })

  it('findOne retorna o presenter do gasto fixo', async () => {
    service.findOne.mockResolvedValue(MOCK_FIXED_EXPENSE)
    const result = await controller.findOne(USER, MOCK_ID)
    expect(service.findOne).toHaveBeenCalledWith(USER.sub, MOCK_ID)
    expect(result.id).toBe(MOCK_ID)
  })

  it('update retorna o presenter do gasto fixo atualizado', async () => {
    service.update.mockResolvedValue({ ...MOCK_FIXED_EXPENSE, description: 'Novo' })
    const result = await controller.update(USER, MOCK_ID, { description: 'Novo' })
    expect(service.update).toHaveBeenCalledWith(USER.sub, MOCK_ID, { description: 'Novo' })
    expect(result.description).toBe('Novo')
  })

  it('confirm retorna o presenter do expense_entry criado', async () => {
    service.confirm.mockResolvedValue(MOCK_ENTRY)
    const result = await controller.confirm(USER, MOCK_ID, { month: '2024-06' })
    expect(service.confirm).toHaveBeenCalledWith(USER.sub, MOCK_ID, { month: '2024-06' })
    expect(result.fixedExpenseId).toBe(MOCK_ID)
    expect(result.date).toBe('2024-06-01')
  })

  it('remove delega ao service', async () => {
    service.remove.mockResolvedValue(undefined)
    await controller.remove(USER, MOCK_ID)
    expect(service.remove).toHaveBeenCalledWith(USER.sub, MOCK_ID)
  })
})
