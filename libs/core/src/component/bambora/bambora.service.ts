import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, lastValueFrom, map } from 'rxjs';
import {
  Continue3DS,
  CreatePaymentDto,
  Createtokenization,
  InitiatePaymentDto,
  UpdatePaymentDto,
} from './dto/bambora.dto';

@Injectable()
export class BamboraService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  /**
   * Create payment token
   * @param CardNumber
   * @param holderName
   * @param expireMonth
   * @param expireYear
   * @param vcc
   */
  async createToken(payload: Createtokenization) {
    const data = {
      number: payload.CardNumber,
      expiry_month: payload.expireMonth,
      expiry_year: payload.expireYear,
      cvd: payload.vcc,
    };
    const token = await lastValueFrom(
      this.httpService
        .post<{ token: string }>(
          `${
            this.configService.get('bambora').url
          }/scripts/tokenization/tokens`,
          data,
          {
            headers: {
              Authorization: `Passcode ${
                this.configService.get('bambora').authtoken
              }`,
            },
          },
        )
        .pipe(
          map((response) => response.data),
          catchError((err) => {
            let message = err.message;
            if (
              err.response &&
              err.response.data &&
              err.response.data.message
            ) {
              message = err.response.data.message;
            }
            throw new UnprocessableEntityException(message);
          }),
        ),
    );
    return token;
  }

  async createPayment(payload: CreatePaymentDto, ip: string) {
    const getdata = await this.setPaymentData(payload, ip);
    const paymentData = await lastValueFrom(
      this.httpService
        .post(`${this.configService.get('bambora').url}/v1/payments`, getdata, {
          headers: {
            Authorization: `Passcode ${
              this.configService.get('bambora').authtoken
            }`,
          },
        })
        .pipe(
          map((response) => response.data),
          catchError((err) => {
            if (
              err &&
              err.response &&
              err.response.status &&
              err.response.status == 302
            ) {
              throw new UnprocessableEntityException(err.response.data);
            }

            // if payment 3d_secure  then response return with 301 error
            let message = err.message;
            if (err.response && err.response.data) {
              message = err.response.data;
            }
            throw new NotAcceptableException({
              message,
            });
          }),
        ),
    );
    return paymentData;
  }

  async initiatePayment(payload: InitiatePaymentDto, ip: string) {
    const { token } = await this.createToken(payload);
    const arg = {
      token,
      checkoutId: payload.checkoutId,
      amount: payload.amount,
      holderName: payload.holderName,
    };
    return this.createPayment(arg, ip);
  }

  async UpdatePaymentStatus(transactionId: string, payload: UpdatePaymentDto) {
    const paymentData = await lastValueFrom(
      this.httpService
        .post(
          `${
            this.configService.get('bambora').url
          }/v1/payments/${transactionId}/completions`,
          payload,
          {
            headers: {
              Authorization: `Passcode ${
                this.configService.get('bambora').authtoken
              }`,
            },
          },
        )
        .pipe(
          map((response) => response.data),
          catchError((err) => {
            let message = err.message;
            if (
              err.response &&
              err.response.data &&
              err.response.data.message
            ) {
              message = err.response.data.message;
            }
            throw new UnprocessableEntityException(message);
          }),
        ),
    );
    return paymentData;
  }

  async complete3DS(request: Continue3DS) {
    const { cres, threeDSSessionData } = request;
    const reqData = {
      payment_method: 'credit_card',
      card_response: { cres },
    };

    const paymentData = await lastValueFrom(
      this.httpService
        .post(
          `${
            this.configService.get('bambora').url
          }/v1/payments/${threeDSSessionData}/continue`,
          reqData,
          {
            headers: {
              Authorization: `Passcode ${
                this.configService.get('bambora').authtoken
              }`,
            },
          },
        )
        .pipe(
          map((response) => response.data),
          catchError((err) => {
            // if payment 3d_secure  then response return with 301 error
            let message = err.message;
            if (
              err.response &&
              err.response.data &&
              err.response.data.message
            ) {
              message = err.response.data.message;
            }
            throw new BadRequestException(message);
          }),
        ),
    );
    return paymentData;
  }

  async setPaymentData(payload: CreatePaymentDto, ip: string) {
    let enabled3dsecure = false;
    if (this.configService.get('bambora').enabled3dsecure) {
      enabled3dsecure = true;
    }

    const data = {
      order_number: payload.checkoutId,
      amount: payload.amount,
      payment_method: 'token',
      token: {
        name: payload.holderName,
        code: payload.token,
        complete: false,
        '3d_secure': {
          enabled: enabled3dsecure,
          auth_required: true,
          version: parseInt(
            `${this.configService.get('bambora').version3dsecure}`,
            10,
          ),
          browser: {
            accept_header:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
            java_enabled: false,
            javascript_enabled: true,
            language: this.configService.get('bambora').language,
            color_depth: this.configService.get('bambora').color_depth,
            screen_width: this.configService.get('bambora').screen_width,
            screen_height: this.configService.get('bambora').screen_height,
            time_zone: this.configService.get('bambora').time_zone,
            user_agent:
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36',
          },
        },
      },
      term_url: this.configService.get('bambora').termUrl,
      customer_ip: ip,
    };

    return data;
  }

  async getPaymentInfoByTranasctionId(transactionId: string) {
    return await lastValueFrom(
      this.httpService
        .get(
          `${
            this.configService.get('bambora').url
          }/v1/payments/${transactionId}`,
          {
            headers: {
              Authorization: `Passcode ${
                this.configService.get('bambora').authtoken
              }`,
            },
          },
        )
        .pipe(
          map((response) => response.data),
          catchError((err) => {
            let message = err.message;
            if (
              err.response &&
              err.response.data &&
              err.response.data.message
            ) {
              message = err.response.data.message;
            }
            throw new UnprocessableEntityException(message);
          }),
        ),
    );
  }
}

// https://tbsecoms.wpengine.com/queue-checkout-process/?checkout_id=VlB3TnhOMzVtOXg1WmRLLzZzVVhrRVN3ejdLUmRWR0FVdDltVXBTZ3B2UkdIRERhTmpILzRRaDc2eEFOTGpnaQ=

// <!DOCTYPE html>
// <html>
//   <head>
//     <meta charset="utf-8" />
//     <script>
//       window.addEventListener(
//         "load",
//         function () {
//             console.log("form fubmission ")
//           document.getElementById("challengeform").submit();
//         },
//         false
//       );
//     </script>
//   </head>
//   <body>
//     <form
//       id="challengeform"
//       action="https://mpi-v2-simulation.test.v-psp.com/acs-simulation/challenge?redirectUrl=https%3A%2F%2Ftbsecoms.wpengine.com%2F"
//       method="post"
//     >
//       <input
//         type="hidden"
//         name="threeDSSessionData"
//         value="M2RmYmE3MDItYzNkMS00MDMxLWFiZTAtOGNkZWFkYWFmYWVk"
//       />
//       <input
//         type="hidden"
//         name="creq"
//         value="eyJhY3NUcmFuc0lEIjoiNTlDNzU3NDYtRUUxNC00NTE1LTgwRDAtQjIyNzU4MUMwMzY1IiwiY2hhbGxlbmdlV2luZG93U2l6ZSI6IjA1IiwibWVzc2FnZVR5cGUiOiJDUmVxIiwibWVzc2FnZVZlcnNpb24iOiIyLjIuMCIsInRocmVlRFNTZXJ2ZXJUcmFuc0lEIjoiYzA3YzRmNjItOGIxYS00MzQxLTkzYTAtN2NlYTA1OGIxYjY2In0"
//       />
//     </form>
//   </body>
// </html>

// <!--
// array(3) {
//     ["responce"]=>
//     object(stdClass)#3 (3) {
//       ["3d_session_data"]=>
//       string(48) "YTM0NWE4ZDgtZTUyMy00M2ViLWE4ZDEtNGEyYmMyN2NhNWFl"
//       ["contents"]=>
//       string(1166) "%3c!doctype+html%3e%3chtml%3e%3chead%3e%09%3cmeta+charset%3d%27utf-8%27%2f%3e%09%3cscript%3e%09%09window.addEventListener(%09%09%09%27load%27%2c%09%09%09function()%7b%09%09%09%09document.getElementById(%27challengeform%27).submit()%3b%09%09%09%7d%2c%09%09%09false%09%09)%3b%09%3c%2fscript%3e%3c%2fhead%3e%3cbody%3e%09%3cform+id%3d%27challengeform%27+action%3d%27https%3a%2f%2fmpi-v2-simulation.test.v-psp.com%2facs-simulation%2fchallenge%3fredirectUrl%3dhttps%253A%252F%252Ftbsecoms.wpengine.com%252Fqueue-checkout-process%252F%253Fcheckout_id%253DVlB3TnhOMzVtOXg1WmRLLzZzVVhrRVN3ejdLUmRWR0FVdDltVXBTZ3B2UkdIRERhTmpILzRRaDc2eEFOTGpnaQ%253D%27+method%3d%27post%27%3e%09%09%3cinput+type%3d%27hidden%27+name%3d%27threeDSSessionData%27+value%3d%27YTM0NWE4ZDgtZTUyMy00M2ViLWE4ZDEtNGEyYmMyN2NhNWFl%27%2f%3e%09%09%3cinput+type%3d%27hidden%27+name%3d%27creq%27+value%3d%27eyJhY3NUcmFuc0lEIjoiNTlDNzU3NDYtRUUxNC00NTE1LTgwRDAtQjIyNzU4MUMwMzY1IiwiY2hhbGxlbmdlV2luZG93U2l6ZSI6IjA1IiwibWVzc2FnZVR5cGUiOiJDUmVxIiwibWVzc2FnZVZlcnNpb24iOiIyLjIuMCIsInRocmVlRFNTZXJ2ZXJUcmFuc0lEIjoiZDI1NjU5YTktZDFhYi00MjcwLTkyZDgtMDU3MGRiYTBlZGQ1In0%27%2f%3e%09%3c%2fform%3e%3c%2fbody%3e%3c%2fhtml%3e"
//       ["links"]=>
//       array(1) {
//         [0]=>
//         object(stdClass)#4 (3) {
//           ["rel"]=>
//           string(8) "continue"
//           ["href"]=>
//           string(96) "https://api.na.bambora.com/v1/payments/YTM0NWE4ZDgtZTUyMy00M2ViLWE4ZDEtNGEyYmMyN2NhNWFl/continue"
//           ["method"]=>
//           string(4) "POST"
//         }
//       }
//     }
//     ["data_array"]=>
//     array(6) {
//       ["order_number"]=>
//       string(13) "BA_1652126141"
//       ["amount"]=>
//       string(5) "30.20"
//       ["customer_ip"]=>
//       string(11) "101.0.34.92"
//       ["payment_method"]=>
//       string(5) "token"
//       ["token"]=>
//       array(4) {
//         ["name"]=>
//         string(4) "Test"
//         ["code"]=>
//         string(40) "c51-41a8f8e9-afa0-4ed7-bf49-31d912f6908f"
//         ["3d_secure"]=>
//         array(4) {
//           ["enabled"]=>
//           bool(true)
//           ["browser"]=>
//           array(9) {
//             ["accept_header"]=>
//             string(118) "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3"
//             ["java_enabled"]=>
//             string(5) "false"
//             ["language"]=>
//             string(5) "en-US"
//             ["color_depth"]=>
//             string(2) "24"
//             ["screen_height"]=>
//             string(3) "864"
//             ["screen_width"]=>
//             string(4) "1536"
//             ["time_zone"]=>
//             int(-400)
//             ["user_agent"]=>
//             string(115) "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36"
//             ["javascript_enabled"]=>
//             bool(true)
//           }
//           ["version"]=>
//           int(2)
//           ["auth_required"]=>
//           bool(true)
//         }
//         ["complete"]=>
//         bool(false)
//       }
//       ["term_url"]=>
//       string(153) "https://tbsecoms.wpengine.com/queue-checkout-process/?checkout_id=VlB3TnhOMzVtOXg1WmRLLzZzVVhrRVN3ejdLUmRWR0FVdDltVXBTZ3B2UkdIRERhTmpILzRRaDc2eEFOTGpnaQ="
//     }
//     ["customer_id"]=>
//     int(19239)
//   } -->
