import { ApiProperty } from '@nestjs/swagger';
import { AppEntity } from '../app/app.entity';
import { UserEntity } from '../user/user.entity';

export class AuthEvent {
  @ApiProperty()
  userId: string;
  @ApiProperty()
  applicationId: string;

  constructor(user: UserEntity, application: AppEntity) {
    this.userId = user.userId;
    this.applicationId = application.appId;
  }
}
