import { IsBoolean, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateAdminUserDto {
  @IsString() username: string;
  @IsString() password: string;
  @IsString() @IsIn(['superadmin','hospital','patient']) role: string;
  @IsOptional() @IsString() first_name?: string;
  @IsOptional() @IsString() last_name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() hospital_name?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
  @IsOptional() @IsBoolean() is_staff?: boolean;
  @IsOptional() @IsBoolean() is_superuser?: boolean;
}

export class UpdateAdminUserDto {
  @IsOptional() @IsString() username?: string;
  @IsOptional() @IsString() password?: string;
  @IsOptional() @IsString() @IsIn(['superadmin','hospital','patient']) role?: string;
  @IsOptional() @IsString() first_name?: string;
  @IsOptional() @IsString() last_name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() hospital_name?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
  @IsOptional() @IsBoolean() is_staff?: boolean;
  @IsOptional() @IsBoolean() is_superuser?: boolean;
}
