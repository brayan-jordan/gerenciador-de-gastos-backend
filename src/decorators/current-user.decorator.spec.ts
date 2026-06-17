import type { ExecutionContext } from '@nestjs/common'
import { currentUserFactory } from './current-user.decorator'

describe('currentUserFactory', () => {
  it('returns request.user from the execution context', () => {
    const user = { sub: 'user-1' }
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext

    expect(currentUserFactory(undefined, ctx)).toEqual(user)
  })
})
