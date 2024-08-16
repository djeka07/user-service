import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class AuthBody {
  @IsEmail()
  @ApiProperty({
    example: 'test@test.com',
    description: 'The e-mail of the user',
  })
  email: string;
  @ApiProperty({
    example: 'SuperStrongPassword',
    description: 'The password of the user',
  })
  @IsNotEmpty()
  password: string;
  @ApiProperty({
    example: '1834f72f-6625-4bec-b999-095f811d9c73',
    description: 'The application id you want to login against',
  })
  @IsNotEmpty()
  applicationId: string;
}

export class RegisterRequest {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;
  @IsNotEmpty()
  @ApiProperty()
  firstName: string;
  @IsNotEmpty()
  @ApiProperty()
  lastName: string;
  @IsNotEmpty()
  @ApiProperty()
  password: string;
  @IsNotEmpty()
  @ApiProperty()
  confirmPassword: string;
}

export class ResetRequest {
  @ApiProperty()
  @IsEmail()
  email: string;
  @ApiProperty()
  @IsNotEmpty()
  applicationId: string;
}

export class UpdatePasswordRequest {
  @IsNotEmpty()
  @ApiProperty()
  password: string;
  @IsNotEmpty()
  @ApiProperty()
  confirmPassword: string;
}

export class Token {
  @ApiProperty({ example: 'Bearer' })
  type: string;
  @ApiProperty({ example: 'accessToken' })
  accessToken: string;
  @ApiProperty({ example: 'refreshToken' })
  refreshToken: string;
  @ApiProperty({ example: 3600 })
  expiresIn: number;
}

export class Payload {
  email: string;
  roles: string[];
  id: string;
  applicationId: string;
  refresh?: boolean;
}
