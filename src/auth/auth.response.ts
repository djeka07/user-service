import { ApiProperty } from '@nestjs/swagger';
import { AppResponse } from '../app/app.response';
import { AuthEntity } from './auth.entity';
export class OkResponse {
  @ApiProperty()
  statusCode: number;
  @ApiProperty()
  message: string;
  constructor(message: string, statusCode: number) {
    this.message = message;
    this.statusCode = statusCode;
  }
}

export class AuthResponse {
  @ApiProperty({ type: AppResponse })
  application: AppResponse;
  @ApiProperty()
  created: string;

  constructor(auth: AuthEntity) {
    this.application = new AppResponse(auth.application);
    this.created = auth.created;
  }
}

export class UsersLoggedInResponse {
  @ApiProperty({ type: Number })
  amount: number;

  constructor(amount: number) {
    this.amount = amount;
  }
}

export class VerifyPasswordTokenResponse {
  @ApiProperty()
  email: string;

  constructor(email: string) {
    this.email = email;
  }
}
