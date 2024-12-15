import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAssingmentDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  classId: string;
  @IsString()
  @IsNotEmpty()
  title: string;
  @IsOptional()
  @IsString()
  description: string;
  @IsOptional()
  @IsDateString()
  dueDate: string;
  @IsOptional()
  @IsString()
  grade: string;
}

export class UpdateAssingmentDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  assignmentId: string;
  @IsOptional()
  @IsString()
  title: string;
  @IsOptional()
  @IsString()
  description: string;
  @IsOptional()
  @IsDateString()
  dueDate: string;
  @IsOptional()
  @IsString()
  grade: string;
}

export class DeleteAssingmentDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  assignmentId: string;
}
export class SubmitAssignmentDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  assignmentId: string;
  @IsOptional()
  @IsString()
  text: string;
}

export class GradeAssignmentDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  assignmentId: string;
  @IsNotEmpty()
  assignmentSubmitId: string;
  @IsNotEmpty()
  grade: string;
}

export class GetAssignmentListDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  @IsString()
  classId: string;
}

export class GetAssignmentInfoDto {
  @IsNotEmpty()
  token: string;
  @IsNotEmpty()
  @IsString()
  assignmentId: string;
}
