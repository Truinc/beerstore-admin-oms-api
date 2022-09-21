import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const appInsights = require('applicationinsights');

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private configService: ConfigService) {}
  catch(exception: HttpException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status = exception.getStatus();
    const data = exception.getResponse();
    const logdata = {
      statusCode: status,
      method: request['method'],
      body: request['body'],
      user: request['user'],
      headers: request['headers'],
      message: data['message'],
      error: data['error'],
      url: request.url,
    };
    this.appInsightslog(logdata);
    response.status(status).json({
      statusCode: status,
      message: data['message'],
      error: data['error'],
    });
  }
  appInsightslog(data: any) {
    appInsights
      .setup(this.configService.get('appInsights').instrumentationKey)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true)
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(true)
      .setDistributedTracingMode(appInsights.DistributedTracingModes.AI)
      .start();
    const client = appInsights.defaultClient;
    client.trackEvent({
      name: `OMS ${data.url}`,
      properties: data,
    });
  }
}
