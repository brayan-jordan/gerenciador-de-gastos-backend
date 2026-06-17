import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { App } from 'supertest/types'
import {
  cleanDatabase,
  createTestApp,
  registerAndLogin,
  uniqueEmail,
} from './helpers'

describe('SessionsController (e2e)', () => {
  let app: INestApplication<App>

  beforeAll(async () => {
    app = await createTestApp()
    await cleanDatabase(app)
  })

  afterAll(async () => {
    await cleanDatabase(app)
    await app.close()
  })

  describe('POST /sessions', () => {
    it('autentica com credenciais válidas e define cookie httpOnly (200)', async () => {
      const email = uniqueEmail('signin')
      const password = 'senha-secreta'
      await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Login', email, password })
        .expect(201)

      const response = await request(app.getHttpServer())
        .post('/sessions')
        .send({ email, password })
        .expect(200)

      const setCookie = response.headers['set-cookie']
      const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie
      expect(cookie).toContain('access_token=')
      expect(cookie).toContain('HttpOnly')
    })

    it('rejeita credenciais inválidas (401)', async () => {
      const email = uniqueEmail('bad')
      await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Bad', email, password: 'senha-correta' })
        .expect(201)

      await request(app.getHttpServer())
        .post('/sessions')
        .send({ email, password: 'senha-errada' })
        .expect(401)
    })

    it('rejeita email inexistente (401)', async () => {
      await request(app.getHttpServer())
        .post('/sessions')
        .send({ email: uniqueEmail('ghost'), password: 'qualquer' })
        .expect(401)
    })
  })

  describe('POST /sessions/logout', () => {
    it('limpa o cookie de sessão (204) quando autenticado', async () => {
      const { cookie: authCookie } = await registerAndLogin(app)

      const response = await request(app.getHttpServer())
        .post('/sessions/logout')
        .set('Cookie', authCookie)
        .expect(204)

      const setCookie = response.headers['set-cookie']
      const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie
      expect(cookie).toContain('access_token=;')
    })

    it('exige autenticação (401)', async () => {
      await request(app.getHttpServer()).post('/sessions/logout').expect(401)
    })
  })
})
