import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { RealIP } from 'nestjs-real-ip';
import JwtAccessGuard from '@beerstore/core/guards/jwt-access.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotAcceptableResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  Continue3DS,
  CreatePaymentDto,
  Createtokenization,
  InitiatePaymentDto,
  UpdatePaymentDto,
} from './dto/bambora.dto';
import { BamboraService } from './bambora.service';

@ApiTags('Payment')
@ApiBearerAuth()
@Controller('payment')
export class BamboraController {
  constructor(private bamboraService: BamboraService) {}

  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: Createtokenization, required: true })
  @UseGuards(JwtAccessGuard)
  @Post('/tokenization')
  async createTokenization(@Body() createtokenization: Createtokenization) {
    return await this.bamboraService.createToken(createtokenization);
  }

  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: CreatePaymentDto, required: true })
  @UseGuards(JwtAccessGuard)
  @Post('create')
  async CreatePayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @RealIP() ip: string,
  ) {
    console.log(ip);
    // let ip = req.socket?.remoteAddress;
    // if (req.headers['x-forwarded-for']) {
    //   ip = req.headers['x-forwarded-for']?.toString().split(',').shift();
    // }
    return await this.bamboraService.createPayment(createPaymentDto, ip);
  }

  @ApiUnprocessableEntityResponse()
  @ApiNotAcceptableResponse()
  @ApiOkResponse()
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: InitiatePaymentDto, required: true })
  @UseGuards(JwtAccessGuard)
  @Post('initiate')
  async initiatePayment(
    @Body() createPaymentDto: InitiatePaymentDto,
    @RealIP() ip: string,
  ) {
    console.log(ip);
    ip = '101.0.34.20';
    // if (ip == '::1') {
    // }
    return await this.bamboraService.initiatePayment(createPaymentDto, ip);
  }

  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: UpdatePaymentDto, required: true })
  @UseGuards(JwtAccessGuard)
  @Put('/:transactionId/update')
  async UpdatePaymentStatus(
    @Param('transactionId') transactionId: string,
    @Body() updatePaymentDto: UpdatePaymentDto, // if amount 0 then transaction cancel else payment complete
  ) {
    return await this.bamboraService.UpdatePaymentStatus(
      transactionId,
      updatePaymentDto,
    );
  }
  @HttpCode(HttpStatus.OK)
  @Post('callback/continue')
  async bamboraCallBacklurl(
    @Body() request: Continue3DS,
    @Res() res: Response,
  ) {
    try {
      await this.bamboraService.complete3DS(request);
      res
        .status(HttpStatus.OK)
        .send(
          '<div>Successful<input id="tbs-payment-status" type="hidden" value="true"></div>',
        );
    } catch (err) {
      res
        .status(HttpStatus.OK)
        .send(
          '<div>Faliure<input id="tbs-payment-status" type="hidden" value="false"></div>',
        );
    }
  }

  @ApiUnauthorizedResponse({ description: 'UnauthorizedResponse' })
  @ApiParam({
    name: 'tranasctionId',
    type: 'string',
    required: true,
    example: '10003233',
  })
  @UseGuards(JwtAccessGuard)
  @Get(':tranasctionId/get')
  async getPaymentByOrderId(@Param('tranasctionId') orderId: string) {
    return this.bamboraService.getPaymentInfoByTranasctionId(orderId);
  }
}
