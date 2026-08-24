import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from './user.entity';

@Injectable()
export class UsersService {
  private readonly users = new Map<string, UserEntity>();

  async create(email: string, password: string, name: string): Promise<UserEntity> {
    if (this.findByEmail(email)) {
      throw new ConflictException('Email already in use');
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
