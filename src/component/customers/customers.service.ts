import {
  Injectable,
  BadRequestException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { map, catchError, lastValueFrom } from 'rxjs';
import { pick } from 'lodash';
import {
  CreateCustomerDto,
  CustomerAttributeDto,
  ChangePasswordDto,
} from './dto/createCustomer.dto';
import { CreateAddressDto } from './dto/createAddress.dto';
import { UpdateCustomerDto } from './dto/updateCustomer.dto';
import { Customer } from './entity/customer.entity';
import { Address, AddressType } from './entity/address.entity';
import { UpdateAddressDto } from './dto/updateAddress.dto';

type CustomerResponseType = {
  data: Array<Customer>;
  meta: { pagination: { total: number } };
};
@Injectable()
export class CustomersService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  mergeAttributeInTheCustomer = (
    customer: Customer,
    attribute: { data: { attribute_id: number; attribute_value: string }[] },
  ) => {
    if (attribute.data.length > 0) {
      attribute.data.forEach((item) => {
        if (
          item.attribute_id ==
          this.configService.get('CustomerAttribute').salutation_id
        ) {
          customer.salutation = item.attribute_value;
        }
        if (
          item.attribute_id ==
          this.configService.get('CustomerAttribute').dob_id
        ) {
          customer.dob = item.attribute_value;
        }
      });
    }
    return customer;
  };
  async getCustomer(customerId: number) {
    const customer = await lastValueFrom(
      this.httpService
        .get<Customer>(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v2/customers/${customerId}`,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => response.data),
          catchError((err) => {
            if (
              err &&
              err.response &&
              err.response.status &&
              err.response.status === 404
            ) {
              throw new NotFoundException(err.message);
            }

            throw new BadRequestException(err.message);
          }),
        ),
    );
    if (customer) {
      customer.dob = '';
      customer.salutation = '';
      const attributes = await this.GetCustomerAttribute(customerId);
      return this.mergeAttributeInTheCustomer(customer, attributes);
    }
    return customer;
  }

  async createCustomer(createCustomerDto: CreateCustomerDto) {
    try {
      const user = await this.getAllCustomer({
        ['email:in']: createCustomerDto.email,
        limit: 1,
      });

      if (
        user &&
        user.meta &&
        user.meta.pagination &&
        user.meta.pagination.total &&
        user.meta.pagination.total > 0
      ) {
        throw new NotAcceptableException('Email Already Exists');
      }
      const customAttribute = pick(createCustomerDto, ['dob', 'salutation']);

      delete createCustomerDto.salutation;
      delete createCustomerDto.dob;
      const payload = {
        ...createCustomerDto,
        _authentication: { password: createCustomerDto.password },
      };
      delete payload.password;
      const customer = await lastValueFrom(
        this.httpService
          .post<Customer>(
            `${this.configService.get('bigcom').url}/stores/${
              this.configService.get('bigcom').store
            }/v2/customers`,
            payload,
            {
              headers: {
                'x-auth-token': this.configService.get('bigcom').access_token,
              },
            },
          )
          .pipe(
            map((response) => {
              if (response.data) {
                return response.data;
              }
              return null;
            }),
            catchError((err) => {
              throw new BadRequestException(err.message);
            }),
          ),
      );
      if (customer && customer.id) {
        const attribute = await this.upsertCustomerAttribute(
          customer.id,
          customAttribute,
        );
        return this.mergeAttributeInTheCustomer(customer, attribute);
      }
      return customer;
    } catch (error) {
      throw error;
    }
  }

  async GetCustomerAttribute(
    customerId: number,
  ): Promise<{ data: { attribute_id: number; attribute_value: string }[] }> {
    const query = `/attribute-values?customer_id:in=${customerId}`;
    const attr = await lastValueFrom(
      this.httpService
        .get(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/customers${query}`,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => {
            if (response.data) {
              return response.data;
            }
            return null;
          }),
          catchError((err) => {
            throw new BadRequestException(err.message);
          }),
        ),
    );
    return attr;
  }

  async upsertCustomerAttribute(
    customerId: number,
    payload: CustomerAttributeDto,
  ): Promise<{ data: { attribute_id: number; attribute_value: string }[] }> {
    try {
      const query = '/attribute-values';
      const attributeArray = [
        {
          attribute_id:
            this.configService.get('CustomerAttribute').salutation_id,
          value: payload.salutation,
          customer_id: customerId,
        },
        {
          attribute_id: this.configService.get('CustomerAttribute').dob_id,
          value: payload.dob,
          customer_id: customerId,
        },
      ];
      return await lastValueFrom(
        this.httpService
          .put(
            `${this.configService.get('bigcom').url}/stores/${
              this.configService.get('bigcom').store
            }/v3/customers${query}`,
            attributeArray,
            {
              headers: {
                'x-auth-token': this.configService.get('bigcom').access_token,
              },
            },
          )
          .pipe(
            map((response) => response.data),
            catchError((err) => {
              throw err.response.data;
            }),
          ),
      );
    } catch (error) {
      throw error;
    }
  }

  async validatePassword(customerId: number, payload: object) {
    return await lastValueFrom(
      this.httpService
        .post(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v2/customers/${customerId}/validate`,
          payload,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => {
            if (response.data) {
              return response.data;
            }
          }),
          catchError((err) => {
            throw new BadRequestException(err.message);
          }),
        ),
    );
  }
  async changePassword(customerId: number, payload: ChangePasswordDto) {
    const validatePassword = await this.validatePassword(customerId, {
      password: payload.oldPassword,
    });
    if (validatePassword.success != true) {
      throw new BadRequestException(
        'Incorrect your old password. please retry!',
      );
    }
    Object.assign(payload, {
      _authentication: { password: payload.password },
    });
    delete payload.password;
    delete payload.oldPassword;
    return await lastValueFrom(
      this.httpService
        .put(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v2/customers/${customerId}`,
          payload,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => {
            if (response.data) {
              return response.data;
            }
          }),
          catchError((err) => {
            throw new BadRequestException(err.message);
          }),
        ),
    );
  }

  async updateCustomer(
    customerId: number,
    updateCustomerDto: UpdateCustomerDto,
  ) {
    const payload = {
      ...updateCustomerDto,
    };

    if (updateCustomerDto.dob) {
      delete payload.dob;
    }
    if (updateCustomerDto.salutation) {
      delete payload.salutation;
    }

    if (updateCustomerDto.password) {
      Object.assign(payload, {
        _authentication: { password: updateCustomerDto.password },
      });
      delete payload.password;
    }

    const customer = await lastValueFrom(
      this.httpService
        .put(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v2/customers/${customerId}`,
          payload,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => {
            if (response.data) {
              return response.data;
            }
            return null;
          }),
          catchError((err) => {
            throw new BadRequestException(err.message);
          }),
        ),
    );
    if (customer && customer.id) {
      const attributeParam: any = pick(updateCustomerDto, [
        'dob',
        'salutation',
      ]);
      if (Object.keys(attributeParam).length > 0) {
        const attribute = await this.upsertCustomerAttribute(
          customer.id,
          attributeParam as CustomerAttributeDto,
        );
        return this.mergeAttributeInTheCustomer(customer, attribute);
      }
    }
    return customer;
  }

  async deleteCustomer(customerId: number): Promise<unknown> {
    await lastValueFrom(
      this.httpService
        .delete(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/customers?id%3Ain=${customerId}`,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => {
            return response;
          }),
          catchError((err) => {
            if (
              err &&
              err.response &&
              err.response.status &&
              err.response.status === 404
            ) {
              throw new NotFoundException(err.message);
            }
            throw new BadRequestException(err.message);
          }),
        ),
    );
    return;
  }

  async getAllCustomer(filter: Record<string, unknown>) {
    const params = Object.keys(filter).map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(
          filter[key] as string,
        )}`,
    );
    const query = params.join('&');

    const customers = await lastValueFrom(
      this.httpService
        .get<CustomerResponseType>(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/customers?${query}`,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => {
            return response.data;
          }),
          catchError((err) => {
            throw new BadRequestException(err.message);
          }),
        ),
    );

    if (customers.data.length > 0) {
      const { data } = customers;
      const action = data.map(async (c) => {
        c.dob = '';
        c.salutation = '';
        const attributes = await this.GetCustomerAttribute(c.id);
        return this.mergeAttributeInTheCustomer(c, attributes);
      });
      const users = await Promise.all(action);
      Object.assign(customers, { data: users });
    }
    return customers;
  }

  async validateUser(email: string, password: string) {
    const obj = await lastValueFrom(
      this.httpService
        .post<{ is_valid: boolean; customer_id: number }>(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/customers/validate-credentials`,
          { email, password },
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => {
            return response.data;
          }),
          catchError((err) => {
            throw new BadRequestException(err.message);
          }),
        ),
    );
    return obj;
  }

  async createCustomerAddresses(payload: CreateAddressDto) {
    if (payload.address_type == AddressType.residential) {
      await this.validateDeliveryAddress(payload.address1);
    }
    const address = await lastValueFrom(
      this.httpService
        .post<Address>(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/customers/addresses`,
          [payload],
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => {
            return response.data;
          }),
          catchError((err) => {
            console.log(err);
            throw new BadRequestException(err.message);
          }),
        ),
    );
    return address;
  }

  async getCustomerAddresses(customerId: string, search: string) {
    const address = await lastValueFrom(
      this.httpService
        .get<[Address]>(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/customers/addresses?customer_id%3Ain=${customerId}&limit=250`,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => response.data),
          catchError((err) => {
            if (
              err &&
              err.response &&
              err.response.status &&
              err.response.status === 404
            ) {
              throw new NotFoundException(err.message);
            }

            throw new BadRequestException(err.message);
          }),
        ),
    );
    if (search && address[`data`].length > 0) {
      address[`data`] = address[`data`].filter((item) => {
        if (
          item.address1
            .toLocaleUpperCase()
            .search(search.toLocaleUpperCase()) >= 0
        ) {
          return item;
        }
      });
    }
    return address;
  }

  async updateCustomerAddresss(payload: UpdateAddressDto) {
    if (payload.address_type === AddressType.residential) {
      await this.validateDeliveryAddress(payload.address1);
    }
    const address = await lastValueFrom(
      this.httpService
        .put(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/customers/addresses`,
          [payload],
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => {
            if (response.data) {
              return response.data;
            }
            return null;
          }),
          catchError((err) => {
            throw new BadRequestException(err.message);
          }),
        ),
    );
    return address;
  }

  async deleteCustomerAddress(customerId: string) {
    const address = await lastValueFrom(
      this.httpService
        .delete(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/customers/addresses?id%3Ain=${customerId}`,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => {
            console.log(response.data);
            return response.data;
          }),
          catchError((err) => {
            if (
              err &&
              err.response &&
              err.response.status &&
              err.response.status === 404
            ) {
              throw new NotFoundException(err.message);
            }

            throw new BadRequestException(err.message);
          }),
        ),
    );
    return address;
  }

  async FindcanadapostAddress(
    SearchTerm: string,
    Country: string,
    LanguagePreference: string,
    LastId: string,
  ) {
    let query = `?Key=${this.configService.get('canadapost').api_key}`;
    if (Country) {
      query += `&Country=${Country}`;
    }
    if (LastId) {
      query += `&LastId=${LastId}`;
    }
    if (LanguagePreference) {
      query += `&LanguagePreference=${LanguagePreference}`;
    }
    query += `&SearchTerm=${SearchTerm}`;
    const getaddress = await lastValueFrom(
      this.httpService
        .get(
          `${this.configService.get('canadapost').url}/Find/${
            this.configService.get('canadapost').version
          }/json3ex.ws${query}`,
        )
        .pipe(
          map((response) => response.data),
          catchError((err) => {
            throw new BadRequestException(err.message);
          }),
        ),
    );
    return getaddress;
  }

  async getCanadapostAddressById(Id: string) {
    const query = `?Key=${
      this.configService.get('canadapost').api_key
    }&Id=${Id}&LanguagePreference=en`;

    const getaddress = await lastValueFrom(
      this.httpService
        .get(
          `${this.configService.get('canadapost').url}/RetrieveFormatted/${
            this.configService.get('canadapost').version
          }/json3ex.ws${query}`,
        )
        .pipe(
          map((response) => response.data),
          catchError((err) => {
            throw new BadRequestException(err.message);
          }),
        ),
    );
    return getaddress;
  }

  async validateDeliveryAddress(address: string) {
    const query = `address=${address}`;
    const getresponse = await lastValueFrom(
      this.httpService
        .get(
          `${
            this.configService.get('thebeerguy').url
          }/beer_xpress_location/list/?api_key=${
            this.configService.get('thebeerguy').key
          }&${encodeURI(query)}`,
        )
        .pipe(
          map((response) => {
            if (response.data.result == 'success') {
              return response.data;
            }
            let message = `No delivery zone for: ${address}`;
            if (response.data && response.data.errors) {
              message = response.data.errors.join(', ');
            }
            throw new NotAcceptableException(message);
          }),
          catchError((err) => {
            throw new NotAcceptableException(err.message);
          }),
        ),
    );
    return getresponse;
  }
}
