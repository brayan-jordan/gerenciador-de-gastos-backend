import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { hash } from 'bcryptjs'
import { eq } from 'drizzle-orm'
import type { CreateUserContract } from '../contracts/create-user.contract'
import type { UpdateUserContract } from '../contracts/update-user.contract'
import { DATABASE, type Database } from '../database/database'
import { type User, users } from '../models/user'

const SALT_ROUNDS = 10

@Injectable()
export class UserService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(data: CreateUserContract): Promise<User> {
    const existing = await this.findByEmail(data.email)

    if (existing) {
      throw new ConflictException(`Email ${data.email} já está em uso`)
    }

    const hashedPassword = await hash(data.password, SALT_ROUNDS)

    const [user] = await this.db
      .insert(users)
      .values({ ...data, password: hashedPassword })
      .returning()

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

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))

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
