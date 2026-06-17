import { UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, type TestingModule } from '@nestjs/testing'
import { hash } from 'bcryptjs'
import { AuthService } from './auth.service'
import { UserService } from './user.service'

describe('AuthService', () => {
  let service: AuthService
  let userService: { findByEmail: ReturnType<typeof vi.fn> }
  let jwtService: { signAsync: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    userService = { findByEmail: vi.fn() }
    jwtService = { signAsync: vi.fn().mockResolvedValue('signed-jwt') }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  it('returns a JWT when credentials are valid', async () => {
    const password = 'senha-secreta'
    userService.findByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'João',
      email: 'joao@example.com',
      password: await hash(password, 10),
    })

    const token = await service.signIn({
      email: 'joao@example.com',
      password,
    })

    expect(token).toBe('signed-jwt')
    expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 'user-1' })
  })

  it('throws Unauthorized when the user does not exist', async () => {
    userService.findByEmail.mockResolvedValue(undefined)

    await expect(
      service.signIn({ email: 'ghost@example.com', password: 'whatever' }),
    ).rejects.toBeInstanceOf(UnauthorizedException)
    expect(jwtService.signAsync).not.toHaveBeenCalled()
  })

  it('throws Unauthorized when the password does not match', async () => {
    userService.findByEmail.mockResolvedValue({
      id: 'user-1',
      name: 'João',
      email: 'joao@example.com',
      password: await hash('senha-correta', 10),
    })

    await expect(
      service.signIn({ email: 'joao@example.com', password: 'senha-errada' }),
    ).rejects.toBeInstanceOf(UnauthorizedException)
    expect(jwtService.signAsync).not.toHaveBeenCalled()
  })
})
