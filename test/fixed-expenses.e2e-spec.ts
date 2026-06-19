import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { App } from 'supertest/types'
import {
  cleanDatabase,
  createTestApp,
  registerAndLogin,
} from './helpers'

describe('FixedExpenseController (e2e)', () => {
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
    description: 'Aluguel',
    amountInCents: 120000,
    recurrence: 'monthly',
    referenceDate: '2024-01-01',
  }

  describe('POST /fixed-expenses', () => {
    it('cria gasto fixo (201)', async () => {
      const response = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send(validPayload)
        .expect(201)

      expect(response.body.id).toBeDefined()
      expect(response.body.description).toBe('Aluguel')
      expect(response.body.amountInCents).toBe(120000)
      expect(response.body.recurrence).toBe('monthly')
      expect(response.body.referenceDate).toBe('2024-01-01')
      expect(response.body.isActive).toBe(true)
    })

    it('exige autenticação (401)', async () => {
      await request(app.getHttpServer())
        .post('/fixed-expenses')
        .send(validPayload)
        .expect(401)
    })

    it('rejeita recorrência inválida (400)', async () => {
      await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ ...validPayload, recurrence: 'daily' })
        .expect(400)
    })

    it('rejeita valor zero (400)', async () => {
      await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ ...validPayload, amountInCents: 0 })
        .expect(400)
    })

    it('rejeita valor negativo (400)', async () => {
      await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ ...validPayload, amountInCents: -1 })
        .expect(400)
    })

    it('rejeita ausência de referenceDate (400)', async () => {
      const { referenceDate: _, ...withoutRef } = validPayload
      await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send(withoutRef)
        .expect(400)
    })

    it('rejeita referenceDate em formato inválido (400)', async () => {
      await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ ...validPayload, referenceDate: '01/01/2024' })
        .expect(400)
    })
  })

  describe('GET /fixed-expenses', () => {
    it('lista apenas gastos do usuário autenticado (200)', async () => {
      await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Internet', amountInCents: 9900, recurrence: 'monthly', referenceDate: '2024-01-01' })
        .expect(201)

      await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieB)
        .send({ description: 'Gasto B', amountInCents: 5000, recurrence: 'annual', referenceDate: '2024-01-01' })
        .expect(201)

      const response = await request(app.getHttpServer())
        .get('/fixed-expenses')
        .set('Cookie', cookieA)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      for (const item of response.body) {
        expect(item.description).not.toBe('Gasto B')
        expect(item.referenceDate).toBeDefined()
      }
    })

    it('retorna array vazio quando não há gastos (200)', async () => {
      const freshCookie = (await registerAndLogin(app)).cookie
      const response = await request(app.getHttpServer())
        .get('/fixed-expenses')
        .set('Cookie', freshCookie)
        .expect(200)

      expect(response.body).toEqual([])
    })

    it('exige autenticação (401)', async () => {
      await request(app.getHttpServer()).get('/fixed-expenses').expect(401)
    })
  })

  describe('GET /fixed-expenses/:id', () => {
    it('retorna gasto fixo do próprio usuário (200)', async () => {
      const created = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Streamings', amountInCents: 4500, recurrence: 'monthly', referenceDate: '2024-03-15' })
        .expect(201)

      const response = await request(app.getHttpServer())
        .get(`/fixed-expenses/${created.body.id}`)
        .set('Cookie', cookieA)
        .expect(200)

      expect(response.body.id).toBe(created.body.id)
      expect(response.body.referenceDate).toBe('2024-03-15')
    })

    it('retorna 404 para id de outro usuário', async () => {
      const created = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieB)
        .send({ description: 'Gasto B privado', amountInCents: 1000, recurrence: 'quarterly', referenceDate: '2024-01-01' })
        .expect(201)

      await request(app.getHttpServer())
        .get(`/fixed-expenses/${created.body.id}`)
        .set('Cookie', cookieA)
        .expect(404)
    })

    it('retorna 404 para id inexistente', async () => {
      await request(app.getHttpServer())
        .get('/fixed-expenses/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookieA)
        .expect(404)
    })

    it('retorna 400 para UUID inválido', async () => {
      await request(app.getHttpServer())
        .get('/fixed-expenses/nao-uuid')
        .set('Cookie', cookieA)
        .expect(400)
    })
  })

  describe('PATCH /fixed-expenses/:id', () => {
    it('atualiza parcialmente (200)', async () => {
      const created = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Antes', amountInCents: 1000, recurrence: 'monthly', referenceDate: '2024-01-01' })
        .expect(201)

      const response = await request(app.getHttpServer())
        .patch(`/fixed-expenses/${created.body.id}`)
        .set('Cookie', cookieA)
        .send({ description: 'Depois' })
        .expect(200)

      expect(response.body.description).toBe('Depois')
      expect(response.body.amountInCents).toBe(1000)
      expect(response.body.referenceDate).toBe('2024-01-01')
    })

    it('atualiza referenceDate (200)', async () => {
      const created = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Ref update', amountInCents: 2000, recurrence: 'quarterly', referenceDate: '2024-01-01' })
        .expect(201)

      const response = await request(app.getHttpServer())
        .patch(`/fixed-expenses/${created.body.id}`)
        .set('Cookie', cookieA)
        .send({ referenceDate: '2024-04-01' })
        .expect(200)

      expect(response.body.referenceDate).toBe('2024-04-01')
    })

    it('rejeita referenceDate em formato inválido (400)', async () => {
      const created = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Ref inválido', amountInCents: 3000, recurrence: 'monthly', referenceDate: '2024-01-01' })
        .expect(201)

      await request(app.getHttpServer())
        .patch(`/fixed-expenses/${created.body.id}`)
        .set('Cookie', cookieA)
        .send({ referenceDate: 'não-é-data' })
        .expect(400)
    })

    it('retorna 404 para gasto de outro usuário', async () => {
      const created = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieB)
        .send({ description: 'B gasto', amountInCents: 2000, recurrence: 'monthly', referenceDate: '2024-01-01' })
        .expect(201)

      await request(app.getHttpServer())
        .patch(`/fixed-expenses/${created.body.id}`)
        .set('Cookie', cookieA)
        .send({ description: 'Hack' })
        .expect(404)
    })

    it('rejeita amountInCents inválido (400)', async () => {
      const created = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Válido', amountInCents: 5000, recurrence: 'monthly', referenceDate: '2024-01-01' })
        .expect(201)

      await request(app.getHttpServer())
        .patch(`/fixed-expenses/${created.body.id}`)
        .set('Cookie', cookieA)
        .send({ amountInCents: 0 })
        .expect(400)
    })
  })

  describe('DELETE /fixed-expenses/:id', () => {
    it('soft delete bem-sucedido (204)', async () => {
      const created = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Deletar', amountInCents: 3000, recurrence: 'annual', referenceDate: '2024-01-01' })
        .expect(201)

      await request(app.getHttpServer())
        .delete(`/fixed-expenses/${created.body.id}`)
        .set('Cookie', cookieA)
        .expect(204)
    })

    it('gasto removido não aparece na listagem', async () => {
      const created = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Sumir', amountInCents: 500, recurrence: 'monthly', referenceDate: '2024-01-01' })
        .expect(201)

      await request(app.getHttpServer())
        .delete(`/fixed-expenses/${created.body.id}`)
        .set('Cookie', cookieA)
        .expect(204)

      const list = await request(app.getHttpServer())
        .get('/fixed-expenses')
        .set('Cookie', cookieA)
        .expect(200)

      expect(list.body.find((i: { id: string }) => i.id === created.body.id)).toBeUndefined()
    })

    it('retorna 404 para gasto de outro usuário', async () => {
      const created = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieB)
        .send({ description: 'B del', amountInCents: 100, recurrence: 'semiannual', referenceDate: '2024-01-01' })
        .expect(201)

      await request(app.getHttpServer())
        .delete(`/fixed-expenses/${created.body.id}`)
        .set('Cookie', cookieA)
        .expect(404)
    })

    it('retorna 404 para id inexistente', async () => {
      await request(app.getHttpServer())
        .delete('/fixed-expenses/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookieA)
        .expect(404)
    })
  })
})
