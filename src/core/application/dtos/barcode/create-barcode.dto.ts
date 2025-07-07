import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsObject } from "class-validator";

export class CreateBarcodeDto {
  @IsNotEmpty()
  @IsString()
  bcid: string;

  @IsNotEmpty()
  @IsString()
  text: string;

  @IsOptional()
  @IsNumber()
  scale?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsBoolean()
  includetext?: boolean;

  @IsOptional()
  @IsEnum(['center', 'offleft', 'left', 'right', 'offright', 'justify'])
  textxalign?: 'center' | 'offleft' | 'left' | 'right' | 'offright' | 'justify';

  @IsOptional()
  @IsString()
  bucket?: string;

  @IsOptional()
  @IsString()
  prefix?: string;

  @IsOptional()
  @IsString()
  extension?: string;

  @IsOptional()
  @IsEnum(['private', 'public-read', 'public-read-write', 'authenticated-read'])
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}
