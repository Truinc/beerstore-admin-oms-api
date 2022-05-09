import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entity/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { SignInLogs } from './entity/signInLogs.entity';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(SignInLogs)
    private readonly signInLogsRepository: Repository<SignInLogs>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = await this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    const user = await this.usersRepository.save(createdUser);
    return this.findOne(user.id);
  }

  async findAll(
    take: number,
    skip: number,
    sort?: object,
    search?: string,
  ): Promise<object> {
    const filter = {};
    const where = [];
    Object.assign(filter, { skip, take });
    if (sort) {
      Object.assign(filter, { order: sort });
    }
    if (search) {
      where.push({
        username: ILike(`%${search}%`),
      });
      where.push({
        email: ILike(`%${search}%`),
      });
      where.push({
        firstName: ILike(`%${search}%`),
      });
      where.push({
        lastName: ILike(`%${search}%`),
      });
      where.push({
        id: ILike(`%${search}%`),
      });
    }
    if (where.length > 0) {
      Object.assign(filter, { where });
    }
    const [items, total] = await this.usersRepository.findAndCount(filter);
    return {
      total,
      take,
      skip,
      items,
    };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne(id);
    return user;
  }

  async findWithUsername(username: string): Promise<User> {
    const user = await this.usersRepository.findOne(
      { username: username },
      {
        select: [
          'firstName',
          'lastName',
          'password',
          'username',
          'email',
          'isActive',
          'id',
        ],
      },
    );
    return user;
  }

  async findWithEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ email: email });
    return user;
  }

  async update(id: number, body: UpdateUserDto) {
    const user = await this.findOne(id);
    if (!user) {
      return new NotFoundException('user not found');
    }
    await this.usersRepository.update({ id: user.id }, body);
    return this.findOne(user.id);
  }

  async updatePassword(id: number, password: string) {
    const user = await this.findOne(id);
    if (!user) {
      return new NotFoundException('user not found');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.usersRepository.update(
      { id: user.id },
      { password: hashedPassword },
    );
    return this.findOne(user.id);
  }

  async verify(username: string, password: string): Promise<User> {
    console.log(username, password);
    const user = await this.usersRepository.findOne({
      where: {
        username,
        password,
      },
    });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
  }

  async delete(id: number) {
    const user = await this.findOne(id);
    if (user) {
      return new NotFoundException('user not found');
    }
    return this.usersRepository.delete(id);
  }

  async addSignInLog(userId: number, log: string): Promise<SignInLogs> {
    const signInlog = await this.signInLogsRepository.save({
      userId,
      log,
    });
    return this.getSignInlog(signInlog.id);
  }

  async getSignInLogs(userId: number): Promise<object> {
    const signInlogs = await this.signInLogsRepository.findAndCount({
      where: [{ userId }],
      order: {
        id: 'DESC',
      },
    });
    return signInlogs;
  }

  async getSignInlog(id: number): Promise<SignInLogs> {
    const signInlog = await this.signInLogsRepository.findOne(id);
    return signInlog;
  }
}
