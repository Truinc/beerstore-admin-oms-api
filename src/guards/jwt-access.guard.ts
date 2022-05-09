import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export default class JwtAccessGuard extends AuthGuard('accessToken') {
  //   handleRequest(err: any, user: any, info: any, context: any, status: any) {
  //     console.log(
  //       err,
  //       '-----------------------------',
  //       user,
  //       '-----------------------------',
  //       info,
  //       '-----------------------------',
  //       context,
  //       '-----------------------------',
  //       status,
  //     );
  //     return super.handleRequest(err, user, info, context, status);
  //   }
}
