import { ApiProperty } from '@nestjs/swagger';

export enum Role {
  User = '8503db05-8c47-4a9d-ace4-c98ec5144b71',
  Administrator = '15193bb9-a613-4e6f-9f72-8f995011f05e',
  Api = '8f5abd7a-d55d-4c43-9bcf-2371b2a828a2',
}

export class RoleExtraModels {
  @ApiProperty({ enum: Object.keys(Role), enumName: 'Role' })
  role: Role;
}
