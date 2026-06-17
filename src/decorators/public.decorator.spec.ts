import { IS_PUBLIC_KEY, Public } from './public.decorator'

describe('Public decorator', () => {
  it('sets the public metadata flag on the target', () => {
    class Target {
      @Public()
      handler() {}
    }

    const flag = Reflect.getMetadata(IS_PUBLIC_KEY, Target.prototype.handler)
    expect(flag).toBe(true)
  })
})
