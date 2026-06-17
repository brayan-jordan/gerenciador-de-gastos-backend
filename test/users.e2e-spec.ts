import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { App } from 'supertest/types'
import {
  cleanDatabase,
  createTestApp,
  registerAndLogin,
  uniqueEmail,
} from './helpers'

describe('UserController (e2e)', () => {
  let app: INestApplication<App>
  let cookie: string

  beforeAll(async () => {
    app = await createTestApp()
    await cleanDatabase(app)
    // Usuário autenticado para acessar as rotas protegidas de usuário.
    cookie = (await registerAndLogin(app)).cookie
  })

  afterAll(async () => {
    await cleanDatabase(app)
    await app.close()
  })

  describe('POST /users', () => {
    it('cria um usuário (201) sem expor a senha', async () => {
      const email = uniqueEmail('create')
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Novo', email, password: 'senha-secreta' })
        .expect(201)

      expect(response.body).toMatchObject({ name: 'Novo', email })
      expect(response.body.id).toBeDefined()
      expect(response.body.password).toBeUndefined()
    })

    it('rejeita email duplicado (409)', async () => {
      const email = uniqueEmail('dup')
      await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'A', email, password: 'senha-secreta' })
        .expect(201)

      await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'B', email, password: 'senha-secreta' })
        .expect(409)
    })

    it('rejeita input inválido (400)', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({ name: '', email: 'nao-email', password: '123' })
        .expect(400)
    })
  })

  describe('GET /users', () => {
    it('lista usuários (200) sem expor senha', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Cookie', cookie)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      for (const user of response.body) {
        expect(user.password).toBeUndefined()
      }
    })

    it('exige autenticação (401)', async () => {
      await request(app.getHttpServer()).get('/users').expect(401)
    })
  })

  describe('GET /users/:id', () => {
    it('busca usuário existente (200)', async () => {
      const created = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Buscar',
          email: uniqueEmail('get'),
          password: 'senha-secreta',
        })
        .expect(201)

      const response = await request(app.getHttpServer())
        .get(`/users/${created.body.id}`)
        .set('Cookie', cookie)
        .expect(200)

      expect(response.body.id).toBe(created.body.id)
      expect(response.body.password).toBeUndefined()
    })

    it('retorna 404 para id inexistente', async () => {
      await request(app.getHttpServer())
        .get('/users/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookie)
        .expect(404)
    })

    it('retorna 400 para UUID inválido', async () => {
      await request(app.getHttpServer())
        .get('/users/nao-uuid')
        .set('Cookie', cookie)
        .expect(400)
    })
  })

  describe('PATCH /users/:id', () => {
    it('atualiza usuário existente (200)', async () => {
      const created = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Antes',
          email: uniqueEmail('patch'),
          password: 'senha-secreta',
        })
        .expect(201)

      const response = await request(app.getHttpServer())
        .patch(`/users/${created.body.id}`)
        .set('Cookie', cookie)
        .send({ name: 'Depois' })
        .expect(200)

      expect(response.body.name).toBe('Depois')
    })

    it('retorna 404 para id inexistente', async () => {
      await request(app.getHttpServer())
        .patch('/users/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookie)
        .send({ name: 'X' })
        .expect(404)
    })
  })

  describe('DELETE /users/:id', () => {
    it('remove usuário existente (204)', async () => {
      const created = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Deletar',
          email: uniqueEmail('del'),
          password: 'senha-secreta',
        })
        .expect(201)

      await request(app.getHttpServer())
        .delete(`/users/${created.body.id}`)
        .set('Cookie', cookie)
        .expect(204)

      await request(app.getHttpServer())
        .get(`/users/${created.body.id}`)
        .set('Cookie', cookie)
        .expect(404)
    })

    it('retorna 404 para id inexistente', async () => {
      await request(app.getHttpServer())
        .delete('/users/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookie)
        .expect(404)
    })
  })
})
