import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import { JwtService } from '@nestjs/jwt';
import { Token, TokenEnum } from './entity/token.entity';
import { TokenDto } from './dto/token.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entity/user.entity';
import { TokenResponseDto } from './dto/token-response.dto';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    private configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  private generateToken(user: User, expires: moment.Moment, type: TokenEnum) {
    const { id, username, firstName, lastName, email, role } = user;
    const payload: {
      sub: object;
      iat: number;
      exp: number;
      type: TokenEnum;
    } = {
      sub: { id, username, firstName, lastName, email, role },
      iat: moment().unix(),
      exp: expires.unix(),
      type,
    };
    return this.jwtService.sign(payload);
  }

  async create(user: User): Promise<TokenResponseDto> {
    const accessTokenExpires = moment().add(
      this.configService.get('jwt').accessExpirationMinutes,
      'minutes',
    );
    const accessToken = this.generateToken(
      user,
      accessTokenExpires,
      TokenEnum.access,
    );

    const refreshTokenExpires = moment().add(
      this.configService.get('jwt').refreshExpirationDays,
      'days',
    );
    const refreshToken = this.generateToken(
      user,
      refreshTokenExpires,
      TokenEnum.refresh,
    );

    const payload = {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
      type: TokenEnum.refresh,
      blacklisted: 0,
      user: user,
    };
    const tokenObj = await this.tokenRepository.create(payload);
    await this.tokenRepository.save(tokenObj);
    return new TokenResponseDto({
      access: {
        token: accessToken,
        expires: accessTokenExpires.toDate(),
      },
      refresh: {
        token: refreshToken,
        expires: refreshTokenExpires.toDate(),
      },
    });
  }

  async findOne(id: number): Promise<Token> {
    const token = await this.tokenRepository.findOne(id);
    return token;
  }

  async findWithPayload(payload: object): Promise<Token> {
    const token = await this.tokenRepository.findOne(payload);
    return token;
  }

  public async verifyToken(token: string, type: TokenEnum): Promise<Token> {
    try {
      const payload: {
        sub: User;
        iat: number;
        exp: number;
        type: TokenEnum;
      } = await this.jwtService.verifyAsync(
        token,
        this.configService.get('jwt').secret,
      );
      const tokenDoc = await this.tokenRepository.findOne(
        {
          token,
          blacklisted: 0,
          user: payload.sub,
          type,
        },
        { relations: ['user'] },
      );
      if (!tokenDoc) {
        throw new NotFoundException('Token not found');
      }
      return tokenDoc;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('token expired');
      }
      throw new UnauthorizedException(error.message);
    }
  }

  public async delete(id: number) {
    return this.tokenRepository.delete(id);
  }

  public async deleteMany(payload: object) {
    return this.tokenRepository.delete(payload);
  }

  public async generateResetToken(user: User) {
    const resetTokenExpires = moment().add(
      this.configService.get('jwt').resetPasswordExpirationMinutes,
      'minutes',
    );
    const resetToken = this.generateToken(
      user,
      resetTokenExpires,
      TokenEnum.reset,
    );

    const payload = {
      token: resetToken,
      expires: resetTokenExpires.toDate(),
      type: TokenEnum.reset,
      blacklisted: 0,
      user: user,
    };
    const tokenObj = await this.tokenRepository.create(payload);
    await this.tokenRepository.save(tokenObj);
    return new TokenDto(payload);
  }

  public async generateSepcialToken(createTokenDto: CreateTokenDto) {
    const timeUnit = createTokenDto.expires.trim().split(' ');
    if (!timeUnit || !timeUnit[0] || !timeUnit[1]) {
      throw new BadRequestException(
        'expires format not correct: 1 minutes OR 31 days OR 9999 years',
      );
    }
    const expires = moment().add(
      parseInt(timeUnit[0]),
      timeUnit[1] as moment.unitOfTime.DurationConstructor,
    );

    const type = createTokenDto.type as TokenEnum; // special type conversion
    const payload: {
      sub: object;
      iat: number;
      exp: number;
      type: string;
    } = {
      sub: { type: createTokenDto.type },
      iat: moment().unix(),
      exp: expires.unix(),
      type,
    };
    const token = this.jwtService.sign(payload);
    const user = null as User; // special type conversion
    const row = {
      token,
      expires: expires.toDate(),
      type: type,
      blacklisted: 0,
      user,
    };
    const tokenObj = await this.tokenRepository.create(row);
    return this.tokenRepository.save(tokenObj);
  }

  public async getToken(token: string) {
    return this.tokenRepository.findOne({ token });
  }

  public async update(token: string, updateTokenDto: UpdateTokenDto) {
    const tokenObj = await this.getToken(token);
    if (!tokenObj) {
      throw new NotFoundException('token not found');
    }
    const { id } = tokenObj;
    await this.tokenRepository.update(id, updateTokenDto);
    return this.findOne(id);
  }

  public async remove(token: string) {
    const tokenObj = await this.getToken(token);
    if (!tokenObj) {
      throw new NotFoundException('token not found');
    }
    const { id } = tokenObj;
    return this.delete(id);
  }
}
