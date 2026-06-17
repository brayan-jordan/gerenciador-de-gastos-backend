import { Test, type TestingModule } from '@nestjs/testing'
import type { Response } from 'express'
import { EnvService } from '../env/env.service'
import { AuthService } from '../services/auth.service'
import { SessionsController } from './sessions.controller'

function mockResponse() {
  return {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  } as unknown as Response & {
    cookie: ReturnType<typeof vi.fn>
    clearCookie: ReturnType<typeof vi.fn>
  }
}

describe('SessionsController', () => {
  let controller: SessionsController
  let authService: { signIn: ReturnType<typeof vi.fn> }
  let envValue: string

  async function build() {
    authService = { signIn: vi.fn().mockResolvedValue('signed-jwt') }
    const envService = { get: vi.fn().mockReturnValue(envValue) }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: EnvService, useValue: envService },
      ],
    }).compile()

    controller = module.get<SessionsController>(SessionsController)
  }

  it('signIn sets a secure httpOnly cookie in production', async () => {
    envValue = 'production'
    await build()
    const res = mockResponse()

    await controller.signIn(
      { email: 'joao@example.com', password: 'senha-secreta' },
      res,
    )

    expect(authService.signIn).toHaveBeenCalledWith({
      email: 'joao@example.com',
      password: 'senha-secreta',
    })
    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      'signed-jwt',
      expect.objectContaining({ httpOnly: true, secure: true }),
    )
  })

  it('signIn sets a non-secure cookie outside production', async () => {
    envValue = 'development'
    await build()
    const res = mockResponse()

    await controller.signIn(
      { email: 'joao@example.com', password: 'senha-secreta' },
      res,
    )

    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      'signed-jwt',
      expect.objectContaining({ secure: false }),
    )
  })

  it('logout clears the access_token cookie', async () => {
    envValue = 'development'
    await build()
    const res = mockResponse()

    controller.logout(res)

    expect(res.clearCookie).toHaveBeenCalledWith('access_token')
  })
})
