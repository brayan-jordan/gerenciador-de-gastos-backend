import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { App } from 'supertest/types'
import { cleanDatabase, createTestApp, registerAndLogin } from './helpers'

describe('AppController (e2e)', () => {
  let app: INestApplication<App>

  beforeAll(async () => {
    app = await createTestApp()
    await cleanDatabase(app)
  })

  afterAll(async () => {
    await cleanDatabase(app)
    await app.close()
  })

  it('GET / autenticado retorna 200 e Hello World!', async () => {
    const { cookie } = await registerAndLogin(app)

    await request(app.getHttpServer())
      .get('/')
      .set('Cookie', cookie)
      .expect(200)
      .expect('Hello World!')
  })

  it('GET / sem cookie retorna 401', async () => {
    await request(app.getHttpServer()).get('/').expect(401)
  })

  it('GET / com token inválido retorna 401', async () => {
    await request(app.getHttpServer())
      .get('/')
      .set('Cookie', 'access_token=token-invalido')
      .expect(401)
  })
})
