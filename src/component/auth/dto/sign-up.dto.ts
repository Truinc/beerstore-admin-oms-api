import { CreateUserDto } from '../../user/dto/create-user.dto';
export default class SignUpDto extends CreateUserDto {
  constructor(body: SignUpDto | null = null) {
    super(body);
  }
}
