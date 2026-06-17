import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import type { CreateUserContract } from '../contracts/create-user.contract'
import type { UpdateUserContract } from '../contracts/update-user.contract'
import { DATABASE, type Database } from '../database/database'
import { type User, users } from '../models/user'

@Injectable()
export class UserService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(data: CreateUserContract): Promise<User> {
    const [user] = await this.db.insert(users).values(data).returning()
    return user
  }

  async findAll(): Promise<User[]> {
    return this.db.select().from(users)
  }

  async findOne(id: string): Promise<User> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id))

    if (!user) {
      throw new NotFoundException(`Usuário ${id} não encontrado`)
    }

    return user
  }

  async update(id: string, data: UpdateUserContract): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning()

    if (!user) {
      throw new NotFoundException(`Usuário ${id} não encontrado`)
    }

    return user
  }

  async remove(id: string): Promise<void> {
    const [user] = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning()

    if (!user) {
      throw new NotFoundException(`Usuário ${id} não encontrado`)
    }
  }
}
