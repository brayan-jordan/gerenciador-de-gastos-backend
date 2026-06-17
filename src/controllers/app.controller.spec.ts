import { Test, type TestingModule } from '@nestjs/testing'
import { AppService } from '../services/app.service'
import { AppController } from './app.controller'

describe('AppController', () => {
  let controller: AppController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile()

    controller = module.get<AppController>(AppController)
  })

  it('returns the hello message', () => {
    expect(controller.getHello()).toBe('Hello World!')
  })
})
