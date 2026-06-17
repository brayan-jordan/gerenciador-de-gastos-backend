import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test, type TestingModule } from '@nestjs/testing'
import { compare } from 'bcryptjs'
import { DATABASE } from '../database/database'
import { UserService } from './user.service'

describe('UserService', () => {
  let service: UserService
  let inserted: { name: string; email: string; password: string } | undefined
  let updatedSet: unknown

  // Resultados configuráveis por teste para cada operação do Drizzle.
  let selectResult: unknown[]
  let returningResult: unknown[]

  beforeEach(async () => {
    inserted = undefined
    updatedSet = undefined
    selectResult = []
    returningResult = []

    // `from()` é "thenable" (usado por findAll sem where) e também expõe
    // `where()` (usado por findOne/findByEmail), ambos resolvendo selectResult.
    const makeFrom = () => {
      const result = Promise.resolve(selectResult)
      return Object.assign(result, {
        where: () => Promise.resolve(selectResult),
      })
    }

    const db = {
      select: () => ({ from: makeFrom }),
      insert: () => ({
        values: (value: typeof inserted) => {
          inserted = value
          return {
            returning: () => Promise.resolve([{ id: 'user-1', ...value }]),
          }
        },
      }),
      update: () => ({
        set: (value: unknown) => {
          updatedSet = value
          return {
            where: () => ({
              returning: () => Promise.resolve(returningResult),
            }),
          }
        },
      }),
      delete: () => ({
        where: () => ({
          returning: () => Promise.resolve(returningResult),
        }),
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: DATABASE, useValue: db }],
    }).compile()

    service = module.get<UserService>(UserService)
  })

  describe('create', () => {
    it('stores the password as a hash, never plaintext', async () => {
      const password = 'senha-secreta'

      const user = await service.create({
        name: 'João',
        email: 'joao@example.com',
        password,
      })

      expect(inserted?.password).toBeDefined()
      expect(inserted?.password).not.toBe(password)
      expect(await compare(password, inserted?.password as string)).toBe(true)
      expect(user.id).toBe('user-1')
    })

    it('throws Conflict when the email already exists', async () => {
      selectResult = [
        {
          id: 'existing',
          name: 'Existente',
          email: 'joao@example.com',
          password: 'hash',
        },
      ]

      await expect(
        service.create({
          name: 'João',
          email: 'joao@example.com',
          password: 'senha-secreta',
        }),
      ).rejects.toBeInstanceOf(ConflictException)
    })
  })

  describe('findAll', () => {
    it('returns all users', async () => {
      selectResult = [{ id: 'a' }, { id: 'b' }]
      await expect(service.findAll()).resolves.toEqual(selectResult)
    })
  })

  describe('findOne', () => {
    it('returns the user when found', async () => {
      selectResult = [{ id: 'user-1', name: 'João' }]
      await expect(service.findOne('user-1')).resolves.toEqual({
        id: 'user-1',
        name: 'João',
      })
    })

    it('throws NotFound when missing', async () => {
      selectResult = []
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      )
    })
  })

  describe('findByEmail', () => {
    it('returns the user when found', async () => {
      selectResult = [{ id: 'user-1', email: 'joao@example.com' }]
      await expect(service.findByEmail('joao@example.com')).resolves.toEqual({
        id: 'user-1',
        email: 'joao@example.com',
      })
    })

    it('returns undefined when not found', async () => {
      selectResult = []
      await expect(
        service.findByEmail('ghost@example.com'),
      ).resolves.toBeUndefined()
    })
  })

  describe('update', () => {
    it('updates and returns the user', async () => {
      returningResult = [{ id: 'user-1', name: 'Novo' }]
      const result = await service.update('user-1', { name: 'Novo' })
      expect(updatedSet).toEqual({ name: 'Novo' })
      expect(result).toEqual({ id: 'user-1', name: 'Novo' })
    })

    it('throws NotFound when the user does not exist', async () => {
      returningResult = []
      await expect(
        service.update('missing', { name: 'Novo' }),
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('remove', () => {
    it('removes an existing user', async () => {
      returningResult = [{ id: 'user-1' }]
      await expect(service.remove('user-1')).resolves.toBeUndefined()
    })

    it('throws NotFound when the user does not exist', async () => {
      returningResult = []
      await expect(service.remove('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      )
    })
  })
})
