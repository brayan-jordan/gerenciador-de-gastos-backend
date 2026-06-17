import { type ExecutionContext, createParamDecorator } from '@nestjs/common'

export interface AuthenticatedUser {
  sub: string
}

export function currentUserFactory(
  _data: unknown,
  context: ExecutionContext,
): AuthenticatedUser {
  const request = context.switchToHttp().getRequest()
  return request.user
}

export const CurrentUser = createParamDecorator(currentUserFactory)
