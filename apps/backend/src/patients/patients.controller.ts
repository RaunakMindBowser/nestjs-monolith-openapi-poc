import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ErrorResponseDto } from '../error-response.dto';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientResponseDto } from './dto/patient-response.dto';

@ApiTags('Patients')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Get()
  @ApiOperation({ operationId: 'listPatients', summary: 'List all patients' })
  @ApiResponse({ status: 200, type: [PatientResponseDto] })
  list(): PatientResponseDto[] {
    return this.patients.list();
  }

  @Post()
  @ApiOperation({ operationId: 'createPatient', summary: 'Register a new patient' })
  @ApiResponse({ status: 201, type: PatientResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  create(@Body() dto: CreatePatientDto): PatientResponseDto {
    return this.patients.create(dto);
  }

  @Get(':id')
  @ApiOperation({ operationId: 'getPatient', summary: 'Get a single patient by ID' })
  @ApiResponse({ status: 200, type: PatientResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  get(@Param('id') id: string): PatientResponseDto {
    return this.patients.get(id);
  }

  @Patch(':id')
  @ApiOperation({ operationId: 'updatePatient', summary: 'Update a patient (partial)' })
  @ApiResponse({ status: 200, type: PatientResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto): PatientResponseDto {
    return this.patients.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ operationId: 'deletePatient', summary: 'Delete a patient' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  remove(@Param('id') id: string): void {
    this.patients.remove(id);
  }
}
