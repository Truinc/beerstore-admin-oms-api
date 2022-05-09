import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import JwtAccessGuard from '@beerstore/core/guards/jwt-access.guard';
import { CustomersService } from './customers.service';
import { Customer } from './entity/customer.entity';
import { CreateCustomerDto, ChangePasswordDto } from './dto/createCustomer.dto';
import { UpdateCustomerDto } from './dto/updateCustomer.dto';
import { CreateAddressDto } from './dto/createAddress.dto';
import { UpdateAddressDto } from './dto/updateAddress.dto';

@ApiTags('customer')
@ApiBearerAuth()
@ApiExtraModels(Customer)
@Controller('customer')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @ApiBody({
    description:
      'BigCom customer api: https://developer.bigcommerce.com/api-reference/b3A6MzU5MDQ1NjU-create-a-new-customer',
    type: CreateCustomerDto,
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async create(
    @Body()
    createCustomerDto: CreateCustomerDto,
  ) {
    return this.customersService.createCustomer(createCustomerDto);
  }

  @ApiParam({
    name: 'id',
    type: 'string',
    example: '19288',
    description:
      'https://developer.bigcommerce.com/api-reference/b3A6MzU5MDQ1Njc-get-a-customer',
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  async getCustomer(@Param('id', ParseIntPipe) id: number) {
    const customer = await this.customersService.getCustomer(id);
    return customer;
  }

  @ApiParam({
    name: 'id',
    type: 'string',
    example: '19288',
    description:
      'https://developer.bigcommerce.com/api-reference/b3A6MzU5MDQ1Njk-update-a-customer',
  })
  @ApiBody({ type: UpdateCustomerDto })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Put(':id')
  async editCustomer(
    @Param('id', ParseIntPipe) customerId: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.updateCustomer(customerId, updateCustomerDto);
  }

  @ApiParam({
    name: 'id',
    type: 'string',
    example: '19288',
    description:
      'https://developer.bigcommerce.com/api-reference/b3A6MzU5MDQ1Njc-get-a-customer',
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteCustomer(@Param('id', ParseIntPipe) customerId: number) {
    return this.customersService.deleteCustomer(customerId);
  }

  @ApiBody({
    description:
      'BigCom customer api: https://developer.bigcommerce.com/api-reference/b3A6MzU5MDQ2MjM-create-a-customer-address',
    type: CreateAddressDto,
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post('/address/create')
  async createCustomerAddresss(@Body() createAddressDto: CreateAddressDto) {
    const response = await this.customersService.createCustomerAddresses(
      createAddressDto,
    );
    return response;
  }

  @ApiQuery({
    name: 'customerId',
    type: 'string',
    description:
      'https://developer.bigcommerce.com/api-reference/b3A6MzU5MDQ2MjI-get-all-customer-addresses',
    example: '19289,113',
  })
  @ApiQuery({
    name: 'search',
    type: 'string',
    required: false,
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get('/address/read')
  async getCustomerAddresses(
    @Query('customerId') customerId: string,
    @Query('search') search: string,
  ) {
    return this.customersService.getCustomerAddresses(customerId, search);
  }

  @ApiBody({
    description:
      'BigCom api: https://developer.bigcommerce.com/api-reference/b3A6MzI5OTY3NTg-update-customers',
    type: UpdateAddressDto,
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('/address/update')
  async updateCustomerAddresss(
    @Body()
    updateAddressDto: UpdateAddressDto,
  ) {
    return this.customersService.updateCustomerAddresss(updateAddressDto);
  }

  @ApiQuery({
    name: 'addressId',
    type: 'string',
    description:
      'https://developer.bigcommerce.com/api-reference/b3A6MzU5MDQ2MjU-delete-a-customer-address',
    example: '19289,113',
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('/address/delete')
  async deleteCustomerAddress(@Query('addressId') addressId: string) {
    return this.customersService.deleteCustomerAddress(addressId);
  }

  @ApiParam({
    name: 'id',
    type: 'string',
    example: '19288',
  })
  @ApiBody({ type: ChangePasswordDto })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Put('changePassword/:id')
  async changepassword(
    @Param('id', ParseIntPipe) customerId: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    try {
      return this.customersService.changePassword(
        customerId,
        changePasswordDto,
      );
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @ApiQuery({
    name: 'search',
    required: true,
    description:
      'Canadapost api: https://www.canadapost-postescanada.ca/info/mc/personal/postalcode/fpc.jsf',
  })
  @ApiQuery({
    name: 'country',
    required: false,
    example: 'CAN',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    example: 'en',
  })
  @ApiQuery({
    name: 'lastId',
    required: false,
    description: 'CA|CP|ENG|QC-QUYON',
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get('address/autocomplete')
  async FindcanadapostAddress(
    @Query('search') SearchTerm: string,
    @Query('country', new DefaultValuePipe('CAN')) Country: string,
    @Query('language', new DefaultValuePipe('en')) LanguagePreference: string,
    @Query('lastId') LastId: string,
  ) {
    return this.customersService.FindcanadapostAddress(
      SearchTerm,
      Country,
      LanguagePreference,
      LastId,
    );
  }

  @ApiQuery({
    name: 'id',
    required: true,
    example: 'CA|CP|A|149967',
    description: 'please enter here address Id.',
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get('address/getaddressbyid')
  async getCanadapostAddressById(@Query('id') Id: string) {
    return this.customersService.getCanadapostAddressById(Id);
  }

  @ApiQuery({
    name: 'address',
    required: true,
    description: 'please enter here address .',
  })
  @UseGuards(JwtAccessGuard)
  @HttpCode(HttpStatus.OK)
  @Get('tbg/check-delivery')
  async isDeliveryPossible(@Query('address') Id: string) {
    return this.customersService.validateDeliveryAddress(Id);
  }
}
