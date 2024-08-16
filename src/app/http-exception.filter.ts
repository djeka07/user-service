import { LokiLoggerService } from '@djeka07/nestjs-loki-logger';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly loggerService: LokiLoggerService) {}
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const error = exception.getResponse();

    const r = Object.assign({}, error, {
      'x-request-id': request?.headers?.['x-request-id'],
      timestamp: new Date().toISOString(),
      path: request.url,
    });

    this.loggerService.error((error as { message: string })?.message, r);

    response
      .status(status)
      .setHeader('x-request-id', request?.headers?.['x-request-id'] ?? '')
      .json(r);
  }
}
