import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { ConflictError } from '../http-errors';
import type { UserEntity } from './user.entity';

// DEMO-GRADE STAND-IN — see user.entity.ts. If the target app already has a
// real user store (a Mongoose model, most commonly, in a MERN repo), delete
// this file and point AuthService at that instead: it only needs
// `findByEmail`, `findById`, and a way to create a user with a
// bcrypt-hashed password.
export class UsersService {
  private readonly users = new Map<string, UserEntity>();

  async create(email: string, password: string, name: string): Promise<UserEntity> {
    if (this.findByEmail(email)) {
      throw new ConflictError('Email already in use');
    }
    const user: UserEntity = {
      id: randomUUID(),
      email,
      name,
      passwordHash: await bcrypt.hash(password, 10),
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  findByEmail(email: string): UserEntity | undefined {
    return [...this.users.values()].find((u) => u.email === email);
  }

  findById(id: string): UserEntity | undefined {
    return this.users.get(id);
  }
}
