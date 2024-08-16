import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UpdateSelfPasswordRequest {
  @ApiProperty()
  @IsNotEmpty()
  public currentPassword: string;
  @ApiProperty()
  @IsNotEmpty()
  public password: string;
  @ApiProperty()
  @IsNotEmpty()
  public confirmPassword: string;
}
