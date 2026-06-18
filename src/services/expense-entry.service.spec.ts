import { NotFoundException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { DATABASE } from '../database/database'
import { ExpenseEntryService } from './expense-entry.service'

const MOCK_USER_ID = 'user-1'
const MOCK_ID = 'entry-1'

const MOCK_ENTRY = {
  id: MOCK_ID,
  userId: MOCK_USER_ID,
  description: 'Mercado',
  amountInCents: 15090,
  date: '2026-06-18',
  createdAt: new Date('2026-06-18'),
  updatedAt: new Date('2026-06-18'),
}

describe('ExpenseEntryService', () => {
  let service: ExpenseEntryService
  let returningResult: unknown[]
  let selectResult: unknown[]

  beforeEach(async () => {
    returningResult = []
    selectResult = []

    const db = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve(selectResult),
        }),
      }),
      insert: () => ({
        values: (value: unknown) => ({
          returning: () => Promise.resolve([{ id: MOCK_ID, ...(value as object) }]),
        }),
      }),
      update: () => ({
        set: () => ({
          where: () => ({
            returning: () => Promise.resolve(returningResult),
          }),
        }),
      }),
      delete: () => ({
        where: () => ({
          returning: () => Promise.resolve(returningResult),
        }),
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpenseEntryService, { provide: DATABASE, useValue: db }],
    }).compile()

    service = module.get<ExpenseEntryService>(ExpenseEntryService)
  })

  describe('create', () => {
    it('cria e retorna o lançamento com o userId correto', async () => {
      const dto = { description: 'Mercado', amountInCents: 15090, date: '2026-06-18' }
      const result = await service.create(MOCK_USER_ID, dto)
      expect(result.id).toBe(MOCK_ID)
    })
  })

  describe('findAll', () => {
    it('retorna lista de lançamentos do usuário', async () => {
      selectResult = [MOCK_ENTRY]
      const result = await service.findAll(MOCK_USER_ID)
      expect(result).toEqual([MOCK_ENTRY])
    })

    it('retorna array vazio quando não há lançamentos', async () => {
      selectResult = []
      const result = await service.findAll(MOCK_USER_ID)
      expect(result).toEqual([])
    })
  })

  describe('findOne', () => {
    it('retorna o lançamento quando encontrado', async () => {
      selectResult = [MOCK_ENTRY]
      const result = await service.findOne(MOCK_USER_ID, MOCK_ID)
      expect(result).toEqual(MOCK_ENTRY)
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
    it('atualiza e retorna o lançamento', async () => {
      returningResult = [{ ...MOCK_ENTRY, description: 'Farmácia' }]
      const result = await service.update(MOCK_USER_ID, MOCK_ID, { description: 'Farmácia' })
      expect(result.description).toBe('Farmácia')
    })

    it('lança NotFoundException quando não encontrado ou de outro usuário', async () => {
      returningResult = []
      await expect(
        service.update(MOCK_USER_ID, 'missing', { description: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('remove', () => {
    it('remove fisicamente o lançamento', async () => {
      returningResult = [MOCK_ENTRY]
      await expect(service.remove(MOCK_USER_ID, MOCK_ID)).resolves.toBeUndefined()
    })

    it('lança NotFoundException quando não encontrado ou de outro usuário', async () => {
      returningResult = []
      await expect(service.remove(MOCK_USER_ID, 'missing')).rejects.toBeInstanceOf(NotFoundException)
    })
  })
})
