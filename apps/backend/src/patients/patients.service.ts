import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PatientEntity } from './patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientResponseDto } from './dto/patient-response.dto';

@Injectable()
export class PatientsService {
  private readonly patients = new Map<string, PatientEntity>();

  list(): PatientResponseDto[] {
    return [...this.patients.values()].map(toResponseDto);
  }

  create(dto: CreatePatientDto): PatientResponseDto {
    const entity: PatientEntity = {
      id: randomUUID(),
      mrn: `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
      firstName: dto.firstName,
      lastName: dto.lastName,
      dateOfBirth: new Date(dto.dateOfBirth),
      gender: dto.gender,
      email: dto.email,
      ssn: '000-00-0000', // demo only — never sourced from client input
      riskScore: Math.round(Math.random() * 100),
      createdAt: new Date(),
    };
    this.patients.set(entity.id, entity);
    return toResponseDto(entity);
  }

  get(id: string): PatientResponseDto {
    const entity = this.findOrThrow(id);
    return toResponseDto(entity);
  }

  update(id: string, dto: UpdatePatientDto): PatientResponseDto {
    const entity = this.findOrThrow(id);
    const updated: PatientEntity = {
      ...entity,
      firstName: dto.firstName ?? entity.firstName,
      lastName: dto.lastName ?? entity.lastName,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : entity.dateOfBirth,
      gender: dto.gender ?? entity.gender,
      email: dto.email ?? entity.email,
    };
    this.patients.set(id, updated);
    return toResponseDto(updated);
  }

  remove(id: string): void {
    this.findOrThrow(id);
    this.patients.delete(id);
  }

  private findOrThrow(id: string): PatientEntity {
    const entity = this.patients.get(id);
    if (!entity) throw new NotFoundException('Patient not found');
    return entity;
  }
}

// The one place PatientEntity meets PatientResponseDto. Everything not
// explicitly copied here (ssn, riskScore) simply cannot reach the client.
function toResponseDto(entity: PatientEntity): PatientResponseDto {
  const dto = new PatientResponseDto();
  dto.id = entity.id;
  dto.mrn = entity.mrn;
  dto.firstName = entity.firstName;
  dto.lastName = entity.lastName;
  dto.dateOfBirth = entity.dateOfBirth.toISOString().slice(0, 10);
  dto.gender = entity.gender;
  dto.email = entity.email;
  dto.createdAt = entity.createdAt.toISOString();
  return dto;
}
