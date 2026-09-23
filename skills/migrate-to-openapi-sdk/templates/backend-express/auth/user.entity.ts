// Internal, server-only shape of a user record — never exported to the
// frontend. `passwordHash` must never appear in a response DTO.
//
// DEMO-GRADE STAND-IN: if the target app already has a User/Account model
// (a Mongoose schema, a Prisma/TypeORM model — the "M" in MERN, most often),
// use THAT instead of this file — don't create a second, competing user
// store. This file only exists for repos that have no user concept yet.
export interface UserEntity {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
}
