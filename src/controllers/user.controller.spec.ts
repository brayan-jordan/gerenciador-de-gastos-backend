import { Test, type TestingModule } from '@nestjs/testing'
import { UserService } from '../services/user.service'
import { UserController } from './user.controller'

const userRow = {
  id: 'user-1',
  name: 'João',
  email: 'joao@example.com',
  password: 'hash',
}

describe('UserController', () => {
  let controller: UserController
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
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: service }],
    }).compile()

    controller = module.get<UserController>(UserController)
  })

  it('create returns the presenter without the password', async () => {
    service.create.mockResolvedValue(userRow)
    const result = await controller.create({
      name: 'João',
      email: 'joao@example.com',
      password: 'senha-secreta',
    })
    expect(result).toEqual({
      id: 'user-1',
      name: 'João',
      email: 'joao@example.com',
    })
    expect((result as { password?: string }).password).toBeUndefined()
  })

  it('findAll maps every user through the presenter', async () => {
    service.findAll.mockResolvedValue([userRow, { ...userRow, id: 'user-2' }])
    const result = await controller.findAll()
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 'user-1',
      name: 'João',
      email: 'joao@example.com',
    })
  })

  it('findOne returns the presenter', async () => {
    service.findOne.mockResolvedValue(userRow)
    const result = await controller.findOne('user-1')
    expect(service.findOne).toHaveBeenCalledWith('user-1')
    expect(result).toEqual({
      id: 'user-1',
      name: 'João',
      email: 'joao@example.com',
    })
  })

  it('update returns the presenter', async () => {
    service.update.mockResolvedValue({ ...userRow, name: 'Novo' })
    const result = await controller.update('user-1', { name: 'Novo' })
    expect(service.update).toHaveBeenCalledWith('user-1', { name: 'Novo' })
    expect(result.name).toBe('Novo')
  })

  it('remove delegates to the service', async () => {
    service.remove.mockResolvedValue(undefined)
    await controller.remove('user-1')
    expect(service.remove).toHaveBeenCalledWith('user-1')
  })
})
