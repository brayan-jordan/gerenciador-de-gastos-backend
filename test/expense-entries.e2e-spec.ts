import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { App } from 'supertest/types'
import {
  cleanDatabase,
  createTestApp,
  registerAndLogin,
} from './helpers'

describe('ExpenseEntryController (e2e)', () => {
  let app: INestApplication<App>
  let cookieA: string
  let cookieB: string

  beforeAll(async () => {
    app = await createTestApp()
    await cleanDatabase(app)
    cookieA = (await registerAndLogin(app)).cookie
    cookieB = (await registerAndLogin(app)).cookie
  })

  afterAll(async () => {
    await cleanDatabase(app)
    await app.close()
  })

  const validPayload = {
    description: 'Mercado',
    amountInCents: 15090,
    date: '2026-06-18',
  }

  describe('POST /expense-entries', () => {
    it('cria lançamento (201)', async () => {
      const response = await request(app.getHttpServer())
        .post('/expense-entries')
        .set('Cookie', cookieA)
        .send(validPayload)
        .expect(201)

      expect(response.body.id).toBeDefined()
      expect(response.body.description).toBe('Mercado')
      expect(response.body.amountInCents).toBe(15090)
      expect(response.body.date).toBe('2026-06-18')
    })

    it('exige autenticação (401)', async () => {
      await request(app.getHttpServer())
        .post('/expense-entries')
        .send(validPayload)
        .expect(401)
    })

    it('rejeita valor zero (400)', async () => {
      await request(app.getHttpServer())
        .post('/expense-entries')
        .set('Cookie', cookieA)
        .send({ ...validPayload, amountInCents: 0 })
        .expect(400)
    })

    it('rejeita valor negativo (400)', async () => {
      await request(app.getHttpServer())
        .post('/expense-entries')
        .set('Cookie', cookieA)
        .send({ ...validPayload, amountInCents: -1 })
        .expect(400)
    })

    it('rejeita data inválida (400)', async () => {
      await request(app.getHttpServer())
        .post('/expense-entries')
        .set('Cookie', cookieA)
        .send({ ...validPayload, date: 'nao-e-data' })
        .expect(400)
    })
  })

  describe('GET /expense-entries', () => {
    it('lista apenas lançamentos do usuário autenticado (200)', async () => {
      await request(app.getHttpServer())
        .post('/expense-entries')
        .set('Cookie', cookieA)
        .send({ description: 'Farmácia', amountInCents: 3200, date: '2026-06-17' })
        .expect(201)

      await request(app.getHttpServer())
        .post('/expense-entries')
        .set('Cookie', cookieB)
        .send({ description: 'Lançamento B', amountInCents: 5000, date: '2026-06-17' })
        .expect(201)

      const response = await request(app.getHttpServer())
        .get('/expense-entries')
        .set('Cookie', cookieA)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      for (const item of response.body) {
        expect(item.description).not.toBe('Lançamento B')
      }
    })

    it('retorna array vazio quando não há lançamentos (200)', async () => {
      const freshCookie = (await registerAndLogin(app)).cookie
      const response = await request(app.getHttpServer())
        .get('/expense-entries')
        .set('Cookie', freshCookie)
        .expect(200)

      expect(response.body).toEqual([])
    })

    it('exige autenticação (401)', async () => {
      await request(app.getHttpServer()).get('/expense-entries').expect(401)
    })
  })

  describe('GET /expense-entries/:id', () => {
    it('retorna lançamento do próprio usuário (200)', async () => {
      const created = await request(app.getHttpServer())
        .post('/expense-entries')
        .set('Cookie', cookieA)
        .send({ description: 'Academia', amountInCents: 9000, date: '2026-06-01' })
        .expect(201)

      const response = await request(app.getHttpServer())
        .get(`/expense-entries/${created.body.id}`)
        .set('Cookie', cookieA)
        .expect(200)

      expect(response.body.id).toBe(created.body.id)
    })

    it('retorna 404 para id de outro usuário', async () => {
      const created = await request(app.getHttpServer())
        .post('/expense-entries')
        .set('Cookie', cookieB)
        .send({ description: 'B privado', amountInCents: 1000, date: '2026-06-10' })
        .expect(201)

      await request(app.getHttpServer())
        .get(`/expense-entries/${created.body.id}`)
        .set('Cookie', cookieA)
        .expect(404)
    })

    it('retorna 404 para id inexistente', async () => {
      await request(app.getHttpServer())
        .get('/expense-entries/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookieA)
        .expect(404)
    })

    it('retorna 400 para UUID inválido', async () => {
      await request(app.getHttpServer())
        .get('/expense-entries/nao-uuid')
        .set('Cookie', cookieA)
        .expect(400)
    })
  })

  describe('PATCH /expense-entries/:id', () => {
    it('atualiza parcialmente (200)', async () => {
      const created = await request(app.getHttpServer())
        .post('/expense-entries')
        .set('Cookie', cookieA)
        .send({ description: 'Antes', amountInCents: 1000, date: '2026-06-15' })
        .expect(201)

      const response = await request(app.getHttpServer())
        .patch(`/expense-entries/${created.body.id}`)
        .set('Cookie', cookieA)
        .send({ description: 'Depois' })
        .expect(200)

      expect(response.body.description).toBe('Depois')
      expect(response.body.amountInCents).toBe(1000)
      expect(response.body.date).toBe('2026-06-15')
    })

    it('retorna 404 para lançamento de outro usuário', async () => {
      const created = await request(app.getHttpServer())
        .post('/expense-entries')
        .set('Cookie', cookieB)
        .send({ description: 'B entry', amountInCents: 2000, date: '2026-06-12' })
        .expect(201)

      await request(app.getHttpServer())
        .patch(`/expense-entries/${created.body.id}`)
        .set('Cookie', cookieA)
        .send({ description: 'Hack' })
        .expect(404)
    })

    it('rejeita amountInCents inválido (400)', async () => {
      const created = await request(app.getHttpServer())
        .post('/expense-entries')
        .set('Cookie', cookieA)
        .send({ description: 'Válido', amountInCents: 5000, date: '2026-06-14' })
        .expect(201)

      await request(app.getHttpServer())
        .patch(`/expense-entries/${created.body.id}`)
        .set('Cookie', cookieA)
        .send({ amountInCents: 0 })
        .expect(400)
    })
  })

  describe('DELETE /expense-entries/:id', () => {
    it('hard delete bem-sucedido (204)', async () => {
      const created = await request(app.getHttpServer())
        .post('/expense-entries')
        .set('Cookie', cookieA)
        .send({ description: 'Deletar', amountInCents: 3000, date: '2026-06-05' })
        .expect(201)

      await request(app.getHttpServer())
        .delete(`/expense-entries/${created.body.id}`)
        .set('Cookie', cookieA)
        .expect(204)
    })

    it('lançamento removido não aparece na listagem', async () => {
      const created = await request(app.getHttpServer())
        .post('/expense-entries')
        .set('Cookie', cookieA)
        .send({ description: 'Sumir', amountInCents: 500, date: '2026-06-03' })
        .expect(201)

      await request(app.getHttpServer())
        .delete(`/expense-entries/${created.body.id}`)
        .set('Cookie', cookieA)
        .expect(204)

      const list = await request(app.getHttpServer())
        .get('/expense-entries')
        .set('Cookie', cookieA)
        .expect(200)

      expect(list.body.find((i: { id: string }) => i.id === created.body.id)).toBeUndefined()
    })

    it('retorna 404 para lançamento de outro usuário', async () => {
      const created = await request(app.getHttpServer())
        .post('/expense-entries')
        .set('Cookie', cookieB)
        .send({ description: 'B del', amountInCents: 100, date: '2026-06-02' })
        .expect(201)

      await request(app.getHttpServer())
        .delete(`/expense-entries/${created.body.id}`)
        .set('Cookie', cookieA)
        .expect(404)
    })

    it('retorna 404 para id inexistente', async () => {
      await request(app.getHttpServer())
        .delete('/expense-entries/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookieA)
        .expect(404)
    })
  })
})
