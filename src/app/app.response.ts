import { ApiProperty } from '@nestjs/swagger';
import { AppEntity } from './app.entity';
import { UserResponse } from '../user/user.response';

export class AppResponse {
  @ApiProperty()
  appId: string;
  @ApiProperty()
  appName: string;

  constructor(app: AppEntity) {
    this.appId = app.appId;
    this.appName = app.appName;
  }
}

export class GetApplicationsResponse {
  @ApiProperty({ type: AppResponse, isArray: true })
  applications: AppResponse[];
  @ApiProperty()
  total: number;
  @ApiProperty()
  hasNextPage: boolean;

  constructor(applications: AppEntity[], total: number, hasNextPage: boolean) {
    this.applications = applications.map((a) => new AppResponse(a));
    this.total = total;
    this.hasNextPage = hasNextPage;
  }
}

export class GetApplicationUsersResponse {
  @ApiProperty()
  users: UserResponse[];
  @ApiProperty()
  total: number;
  @ApiProperty()
  hasNextPage: boolean;
}
