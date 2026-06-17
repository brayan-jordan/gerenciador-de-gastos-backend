import { UnauthorizedException } from '@nestjs/common'
import type { ExecutionContext } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { JwtService } from '@nestjs/jwt'
import { JwtAuthGuard } from './jwt-auth.guard'

function makeContext(cookies: Record<string, string> = {}): {
  ctx: ExecutionContext
  request: { cookies: Record<string, string>; user?: unknown }
} {
  const request = { cookies } as {
    cookies: Record<string, string>
    user?: unknown
  }
  const ctx = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext
  return { ctx, request }
}

describe('JwtAuthGuard', () => {
  function build(
    isPublic: boolean,
    verify: (token: string) => Promise<unknown>,
  ) {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(isPublic),
    } as unknown as Reflector
    const jwtService = {
      verifyAsync: vi.fn((token: string) => verify(token)),
    } as unknown as JwtService
    return new JwtAuthGuard(jwtService, reflector)
  }

  it('allows public routes without a token', async () => {
    const guard = build(true, async () => ({ sub: 'x' }))
    const { ctx } = makeContext()
    await expect(guard.canActivate(ctx)).resolves.toBe(true)
  })

  it('throws when no token cookie is present', async () => {
    const guard = build(false, async () => ({ sub: 'x' }))
    const { ctx } = makeContext()
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    )
  })

  it('injects the user and allows a valid token', async () => {
    const payload = { sub: 'user-1' }
    const guard = build(false, async () => payload)
    const { ctx, request } = makeContext({ access_token: 'valid' })

    await expect(guard.canActivate(ctx)).resolves.toBe(true)
    expect(request.user).toEqual(payload)
  })

  it('throws when the token is invalid', async () => {
    const guard = build(false, async () => {
      throw new Error('invalid')
    })
    const { ctx } = makeContext({ access_token: 'broken' })

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    )
  })
})
