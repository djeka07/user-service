import { ApiProperty } from '@nestjs/swagger';
import { RoleEntity } from './role.entity';
export class RoleResponse {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  constructor(role: RoleEntity) {
    this.id = role.roleId;
    this.name = role.name;
  }
}
