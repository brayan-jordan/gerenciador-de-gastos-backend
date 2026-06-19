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

  describe('GET /fixed-expenses/pending', () => {
    it('retorna gastos mensais pendentes no mês (200)', async () => {
      const created = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Mensal', amountInCents: 10000, recurrence: 'monthly', referenceDate: '2024-01-01' })
        .expect(201)

      const response = await request(app.getHttpServer())
        .get('/fixed-expenses/pending?month=2024-06')
        .set('Cookie', cookieA)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
      const found = response.body.find((fe: { id: string }) => fe.id === created.body.id)
      expect(found).toBeDefined()
    })

    it('gasto anual não aparece no mês incorreto (200)', async () => {
      const created = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Anual Março', amountInCents: 50000, recurrence: 'annual', referenceDate: '2024-03-01' })
        .expect(201)

      const response = await request(app.getHttpServer())
        .get('/fixed-expenses/pending?month=2024-02')
        .set('Cookie', cookieA)
        .expect(200)

      const found = response.body.find((fe: { id: string }) => fe.id === created.body.id)
      expect(found).toBeUndefined()
    })

    it('gasto anual aparece no mês correto (200)', async () => {
      const created = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Anual Maio', amountInCents: 60000, recurrence: 'annual', referenceDate: '2024-05-01' })
        .expect(201)

      const response = await request(app.getHttpServer())
        .get('/fixed-expenses/pending?month=2025-05')
        .set('Cookie', cookieA)
        .expect(200)

      const found = response.body.find((fe: { id: string }) => fe.id === created.body.id)
      expect(found).toBeDefined()
    })

    it('gasto trimestral aparece no mês correto (200)', async () => {
      const created = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Trimestral', amountInCents: 30000, recurrence: 'quarterly', referenceDate: '2024-01-01' })
        .expect(201)

      const response = await request(app.getHttpServer())
        .get('/fixed-expenses/pending?month=2024-04')
        .set('Cookie', cookieA)
        .expect(200)

      const found = response.body.find((fe: { id: string }) => fe.id === created.body.id)
      expect(found).toBeDefined()
    })

    it('gasto já confirmado não aparece nos pendentes', async () => {
      const created = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Confirmado', amountInCents: 20000, recurrence: 'monthly', referenceDate: '2024-01-01' })
        .expect(201)

      await request(app.getHttpServer())
        .post(`/fixed-expenses/${created.body.id}/confirm`)
        .set('Cookie', cookieA)
        .send({ month: '2024-07' })
        .expect(201)

      const response = await request(app.getHttpServer())
        .get('/fixed-expenses/pending?month=2024-07')
        .set('Cookie', cookieA)
        .expect(200)

      const found = response.body.find((fe: { id: string }) => fe.id === created.body.id)
      expect(found).toBeUndefined()
    })

    it('mês anterior à referenceDate não retorna gasto', async () => {
      const created = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Futuro', amountInCents: 10000, recurrence: 'monthly', referenceDate: '2025-01-01' })
        .expect(201)

      const response = await request(app.getHttpServer())
        .get('/fixed-expenses/pending?month=2024-12')
        .set('Cookie', cookieA)
        .expect(200)

      const found = response.body.find((fe: { id: string }) => fe.id === created.body.id)
      expect(found).toBeUndefined()
    })

    it('month ausente retorna 400', async () => {
      await request(app.getHttpServer())
        .get('/fixed-expenses/pending')
        .set('Cookie', cookieA)
        .expect(400)
    })

    it('month em formato inválido retorna 400', async () => {
      await request(app.getHttpServer())
        .get('/fixed-expenses/pending?month=01-2024')
        .set('Cookie', cookieA)
        .expect(400)
    })

    it('exige autenticação (401)', async () => {
      await request(app.getHttpServer())
        .get('/fixed-expenses/pending?month=2024-01')
        .expect(401)
    })

    it('isolamento entre usuários', async () => {
      const createdB = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieB)
        .send({ description: 'Gasto B pendente', amountInCents: 5000, recurrence: 'monthly', referenceDate: '2024-01-01' })
        .expect(201)

      const response = await request(app.getHttpServer())
        .get('/fixed-expenses/pending?month=2024-08')
        .set('Cookie', cookieA)
        .expect(200)

      const found = response.body.find((fe: { id: string }) => fe.id === createdB.body.id)
      expect(found).toBeUndefined()
    })
  })

  describe('POST /fixed-expenses/:id/confirm', () => {
    it('confirmação com valor base retorna 201 com expense_entry correto', async () => {
      const fixedExpense = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Confirm Base', amountInCents: 80000, recurrence: 'monthly', referenceDate: '2024-01-01' })
        .expect(201)

      const response = await request(app.getHttpServer())
        .post(`/fixed-expenses/${fixedExpense.body.id}/confirm`)
        .set('Cookie', cookieA)
        .send({ month: '2024-09' })
        .expect(201)

      expect(response.body.fixedExpenseId).toBe(fixedExpense.body.id)
      expect(response.body.amountInCents).toBe(80000)
      expect(response.body.date).toBe('2024-09-01')
      expect(response.body.description).toBe('Confirm Base')
    })

    it('confirmação com valor customizado retorna 201', async () => {
      const fixedExpense = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Confirm Custom', amountInCents: 50000, recurrence: 'monthly', referenceDate: '2024-01-01' })
        .expect(201)

      const response = await request(app.getHttpServer())
        .post(`/fixed-expenses/${fixedExpense.body.id}/confirm`)
        .set('Cookie', cookieA)
        .send({ month: '2024-10', amountInCents: 45000 })
        .expect(201)

      expect(response.body.amountInCents).toBe(45000)
      expect(response.body.fixedExpenseId).toBe(fixedExpense.body.id)
    })

    it('dupla confirmação no mesmo mês retorna 409', async () => {
      const fixedExpense = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Dupla', amountInCents: 10000, recurrence: 'monthly', referenceDate: '2024-01-01' })
        .expect(201)

      await request(app.getHttpServer())
        .post(`/fixed-expenses/${fixedExpense.body.id}/confirm`)
        .set('Cookie', cookieA)
        .send({ month: '2024-11' })
        .expect(201)

      await request(app.getHttpServer())
        .post(`/fixed-expenses/${fixedExpense.body.id}/confirm`)
        .set('Cookie', cookieA)
        .send({ month: '2024-11' })
        .expect(409)
    })

    it('gasto fixo de outro usuário retorna 404', async () => {
      const fixedExpenseB = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieB)
        .send({ description: 'B Confirm', amountInCents: 5000, recurrence: 'monthly', referenceDate: '2024-01-01' })
        .expect(201)

      await request(app.getHttpServer())
        .post(`/fixed-expenses/${fixedExpenseB.body.id}/confirm`)
        .set('Cookie', cookieA)
        .send({ month: '2024-09' })
        .expect(404)
    })

    it('gasto fixo inativo retorna 404', async () => {
      const fixedExpense = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Para Inativar', amountInCents: 5000, recurrence: 'monthly', referenceDate: '2024-01-01' })
        .expect(201)

      await request(app.getHttpServer())
        .delete(`/fixed-expenses/${fixedExpense.body.id}`)
        .set('Cookie', cookieA)
        .expect(204)

      await request(app.getHttpServer())
        .post(`/fixed-expenses/${fixedExpense.body.id}/confirm`)
        .set('Cookie', cookieA)
        .send({ month: '2024-09' })
        .expect(404)
    })

    it('month ausente retorna 400', async () => {
      const fixedExpense = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Month Missing', amountInCents: 5000, recurrence: 'monthly', referenceDate: '2024-01-01' })
        .expect(201)

      await request(app.getHttpServer())
        .post(`/fixed-expenses/${fixedExpense.body.id}/confirm`)
        .set('Cookie', cookieA)
        .send({})
        .expect(400)
    })

    it('amountInCents inválido retorna 400', async () => {
      const fixedExpense = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Amount Inválido', amountInCents: 5000, recurrence: 'monthly', referenceDate: '2024-01-01' })
        .expect(201)

      await request(app.getHttpServer())
        .post(`/fixed-expenses/${fixedExpense.body.id}/confirm`)
        .set('Cookie', cookieA)
        .send({ month: '2024-09', amountInCents: 0 })
        .expect(400)
    })

    it('mês fora da recorrência retorna 400', async () => {
      const fixedExpense = await request(app.getHttpServer())
        .post('/fixed-expenses')
        .set('Cookie', cookieA)
        .send({ description: 'Anual Fevereiro', amountInCents: 5000, recurrence: 'annual', referenceDate: '2024-02-01' })
        .expect(201)

      await request(app.getHttpServer())
        .post(`/fixed-expenses/${fixedExpense.body.id}/confirm`)
        .set('Cookie', cookieA)
        .send({ month: '2024-05' })
        .expect(400)
    })

    it('exige autenticação (401)', async () => {
      await request(app.getHttpServer())
        .post('/fixed-expenses/00000000-0000-0000-0000-000000000000/confirm')
        .send({ month: '2024-01' })
        .expect(401)
    })
  })
})
