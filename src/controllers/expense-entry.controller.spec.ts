import { Test, type TestingModule } from '@nestjs/testing'
import type { AuthenticatedUser } from '../decorators/current-user.decorator'
import { ExpenseEntryService } from '../services/expense-entry.service'
import { ExpenseEntryController } from './expense-entry.controller'

const USER: AuthenticatedUser = { sub: 'user-1' }
const MOCK_ID = 'entry-1'

const MOCK_ENTRY = {
  id: MOCK_ID,
  userId: USER.sub,
  fixedExpenseId: null,
  description: 'Mercado',
  amountInCents: 15090,
  date: '2026-06-18',
  createdAt: new Date('2026-06-18'),
  updatedAt: new Date('2026-06-18'),
}

describe('ExpenseEntryController', () => {
  let controller: ExpenseEntryController
  let service: {
    create: ReturnType<typeof vi.fn>
    findAll: ReturnType<typeof vi.fn>
    findOne: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    remove: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    service = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpenseEntryController],
      providers: [{ provide: ExpenseEntryService, useValue: service }],
    }).compile()

    controller = module.get<ExpenseEntryController>(ExpenseEntryController)
  })

  it('create retorna o presenter do lançamento criado', async () => {
    service.create.mockResolvedValue(MOCK_ENTRY)
    const result = await controller.create(USER, { description: 'Mercado', amountInCents: 15090, date: '2026-06-18' })
    expect(service.create).toHaveBeenCalledWith(USER.sub, expect.objectContaining({ description: 'Mercado' }))
    expect(result.id).toBe(MOCK_ID)
    expect(result.fixedExpenseId).toBeNull()
  })

  it('findAll mapeia todos os lançamentos através do presenter', async () => {
    service.findAll.mockResolvedValue([MOCK_ENTRY])
    const result = await controller.findAll(USER)
    expect(service.findAll).toHaveBeenCalledWith(USER.sub)
    expect(result).toHaveLength(1)
    expect(result[0].fixedExpenseId).toBeNull()
  })

  it('findOne retorna o presenter do lançamento', async () => {
    service.findOne.mockResolvedValue(MOCK_ENTRY)
    const result = await controller.findOne(USER, MOCK_ID)
    expect(service.findOne).toHaveBeenCalledWith(USER.sub, MOCK_ID)
    expect(result.id).toBe(MOCK_ID)
    expect(result.fixedExpenseId).toBeNull()
  })

  it('update retorna o presenter do lançamento atualizado', async () => {
    service.update.mockResolvedValue({ ...MOCK_ENTRY, description: 'Farmácia' })
    const result = await controller.update(USER, MOCK_ID, { description: 'Farmácia' })
    expect(service.update).toHaveBeenCalledWith(USER.sub, MOCK_ID, { description: 'Farmácia' })
    expect(result.description).toBe('Farmácia')
  })

  it('remove delega ao service', async () => {
    service.remove.mockResolvedValue(undefined)
    await controller.remove(USER, MOCK_ID)
    expect(service.remove).toHaveBeenCalledWith(USER.sub, MOCK_ID)
  })
})
