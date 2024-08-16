import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponse {
  @ApiProperty({ examples: [401, 403, 500] })
  statusCode: number;
  @ApiProperty()
  message: string;
  @ApiProperty()
  timestamp: string;
  @ApiProperty()
  path: string;
  @ApiProperty()
  'x-request-id': string;
}
