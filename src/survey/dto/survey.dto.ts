/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsString } from "class-validator";

export class createSurveyDto {
  @IsNotEmpty()
  token: string;
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  start_date: string;

  @IsString()
  @IsNotEmpty()
  end_date: string;

  @IsString()
  @IsNotEmpty()
  status: string;

}