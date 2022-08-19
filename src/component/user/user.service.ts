import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { RolesEnum, User, userPermissions } from './entity/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { SignInLogs } from './entity/signInLogs.entity';
import { UserStores } from './entity/userStores.entity';
// import { OrdersService } from '../orders/orders.service';
// import { StoreService } from '../store/store.service';
import { Store } from '@beerstore/core/component/store/entities/store.entity';
import { SIGNINLOGS } from '@beerstore/core/utils';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(SignInLogs)
    private readonly signInLogsRepository: Repository<SignInLogs>,
    @InjectRepository(UserStores)
    private readonly userStoresRepository: Repository<UserStores>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { username } = createUserDto;
    const alreadyRegister = await this.usersRepository.findOne({
      where: [{ username }],
    });
    if (alreadyRegister) {
      throw new BadRequestException('Employee ID already exists.');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = await this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    const user = await this.usersRepository.save(createdUser);
    if (createUserDto?.baseStoreId && user.id) {
      const userStore = await this.userStoresRepository.save({
        assignType: 'base',
        userId: user.id,
        storeId: createUserDto?.baseStoreId,
      });
      await this.usersRepository.save({
        ...user,
        usersStores: [userStore],
      });
    }
    return this.findOne(user.id);
  }

  async findAll(
    take: number,
    skip: number,
    userRole: string,
    usersStores: UserStores[],
    sort?: object,
    search?: string,
    isManager?: number,
  ): Promise<object> {
    try {
      const storesList =
        usersStores.map((store) => {
          return store.storeId;
        }) || [];
      const table = this.usersRepository.createQueryBuilder('User');
      const value = {};
      const where = [];
      let queryString = '';
      table.leftJoinAndSelect('User.usersStores', 'UserStores');
      if (search) {
        where.push('username like :username');
        Object.assign(value, { username: `%${search}%` });
        where.push('email like :email');
        Object.assign(value, { email: `%${search}%` });
        where.push('firstName like :firstName');
        Object.assign(value, { firstName: `%${search}%` });
        where.push('lastName like :lastName');
        Object.assign(value, { lastName: `%${search}%` });
        where.push(`CONCAT(firstName, ' ' ,lastName) like :name`);
        Object.assign(value, { name: `%${search}%` });
        // where.push('User.id like :employeeid');
        // Object.assign(value, { employeeid: `%${search}%` });
        where.push('UserStores.storeId like :storeId');
        Object.assign(value, { storeId: `%${search}%` });
        queryString = where.join(' OR ');
      }
      if (+isManager === 1) {
        queryString = queryString
          ? `( ${queryString} ) AND role = :role`
          : `role = :role`;
        Object.assign(value, { role: 'storemanager' });
      } else {
        queryString = queryString
          ? `( ${queryString} ) AND role IN (:...roles)`
          : `role IN (:...roles)`;
        Object.assign(value, { roles: userPermissions[userRole] });
      }

      if (userRole === 'storemanager' && storesList.length) {
        queryString = queryString
          ? `( ${queryString} ) AND storeId IN (:...stores)`
          : `storeId IN (:...stores)`;
        Object.assign(value, { stores: storesList });
      }

      table.where(queryString, value);

      if (sort) {
        const validSortKey = [
          'id',
          'lastName',
          'firstName',
          'username',
          'email',
          'role',
          'manager',
          'isActive',
          'employeeId',
          'storeId',
        ];
        const sortKey = Object.keys(sort)[0];
        if (validSortKey.includes(sortKey)) {
          const sortObj =
            sortKey === 'storeId'
              ? {
                  [`UserStores.${sortKey}`]: sort[sortKey],
                }
              : {
                  [`User.${sortKey}`]: sort[sortKey],
                };
          table.orderBy(sortObj as { [key: string]: 'ASC' | 'DESC' });
        } else {
          throw new BadRequestException(`Invalid sort param :- ${sortKey}`);
        }
      }

      if (skip) {
        table.skip(skip);
      }
      if (take) {
        table.take(take);
      }
      const response = await table.getManyAndCount();
      // console.log('response ------- >>', response);
      const [items, total] = response;
      return {
        total,
        take,
        skip,
        items,
      };
    } catch (err) {
      console.log(err, 'ERRRRR');
      throw new BadRequestException(err.message);
    }
  }

  async findOne(id: number): Promise<any> {
    const user = await this.usersRepository.findOne(
      {
        id,
      },
      { relations: ['usersStores'] },
    );
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
          'loginAttempts',
          'id',
          'role',
        ],
        relations: ['usersStores'],
      },
    );
    return user;
  }

  async findWithEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ email: email });
    return user;
  }

  async update(id: number, body: UpdateUserDto) {
    try {
      const user = await this.findOne(id);
      if (!user) {
        return new NotFoundException('user not found');
      }

      const alreadyRegister = await this.usersRepository.findOne({
        where: [{ username: body.username }],
      });

      if (alreadyRegister && alreadyRegister.id !== id) {
        throw new BadRequestException('Employee ID already exists.');
      }

      // let hashedPassword = '';
      let managerData;
      const { baseStoreId, optionalStoreIds, manager, ...userObj } = body || {
        baseStoreId: -1,
        optionalStoreIds: [],
      };
      if (manager) {
        managerData = await this.usersRepository.findOne({
          username: manager,
        });
        if (!managerData || managerData.role !== RolesEnum.storemanager) {
          throw new Error('No manager found');
        }
      }

      // if (userObj.password) {
      //   hashedPassword = await bcrypt.hash(userObj.password, 10);
      // }
      let userStoresList = [];
      const userStoreReqs = [];

      // remove all previous stores assigned to the user
      await this.removeAllUserStores(id);
      if (baseStoreId && baseStoreId !== -1) {
        userStoreReqs.push(
          this.userStoresRepository.save({
            assignType: 'base',
            userId: id,
            storeId: baseStoreId,
          }),
        );
      }
      if (Array.isArray(optionalStoreIds) && optionalStoreIds.length) {
        for (const storeId of optionalStoreIds) {
          if (storeId !== -1) {
            userStoreReqs.push(
              this.userStoresRepository.save({
                userId: id,
                storeId,
                assignType: 'otherAssigned',
              }),
            );
          }
        }
      }
      userStoresList = await Promise.all(userStoreReqs);
      // delete user.id;
      await this.usersRepository.save({
        ...user,
        ...userObj,
        ...(managerData ? { manager: managerData.username } : { manager: null }),
        usersStores: userStoresList,
      });

      if (!body.isActive) {
        await this.upsertSignInlog(id, SIGNINLOGS.ACCOUNT_LOCKED);
      }
      return this.findOne(user.id);
    } catch (err) {
      throw err;
    }
  }

  async updatePassword(id: number, password: string) {
    const user = await this.findOne(id);
    if (!user) {
      return new NotFoundException('user not found');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.usersRepository.update(
      { id: user.id },
      { password: hashedPassword, isActive: 1, loginAttempts: 0 },
    );
    return this.findOne(user.id);
  }

  async patch(userId: number, body: any): Promise<User> {
    await this.usersRepository.update({ id: userId }, { ...body });
    return this.findOne(userId);
  }

  async verify(username: string, password: string): Promise<User> {
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
    const signInlogs = await this.signInLogsRepository.find({
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

  async upsertSignInlog(userId: number, log: string): Promise<object> {
    const signInLog = await this.signInLogsRepository.findOne({
      userId,
      log,
    });

    if (signInLog) {
      await this.signInLogsRepository.update(
        {
          userId,
          log,
        },
        {
          userId,
          log,
        },
      );
    } else {
      await this.signInLogsRepository.save({
        userId,
        log,
      });
    }
    return await this.signInLogsRepository.findOne({
      userId,
      log,
    });
  }

  // async getUserMeta(id: number): Promise<any> {
  //   let baseStoreId = -1;
  //   const storeIds = [];
  //   const userMetaReq = [];
  //   const baseStore = [];
  //   const otherAssignedStores = [];
  //   const userStores = await this.userStoresRepository.find({ userId: id });
  //   userMetaReq.push(this.getSignInLogs(id));
  //   if (Array.isArray(userStores) && userStores.length) {
  //     userStores.forEach((userStore) => {
  //       storeIds.push(userStore.storeId);
  //       if (userStore.assignType === 'base') {
  //         baseStoreId = userStore.storeId;
  //       }
  //     });
  //     userMetaReq.push(
  //       this.storeRepository
  //         .createQueryBuilder()
  //         .where('id IN (:...ids )', { ids: storeIds })
  //         .getMany(),
  //     );
  //   }
  //   const response = await Promise.all(userMetaReq);
  //   if (Array.isArray(response[1]) && response[1].length) {
  //     response[1].forEach((store) => {
  //       if (store.id === baseStoreId) {
  //         baseStore.push(store);
  //       } else {
  //         otherAssignedStores.push(store);
  //       }
  //     });
  //   }
  //   return {
  //     signInLogs: response[0] || [],
  //     baseStore: baseStore,
  //     otherAssignedStores,
  //   };
  // }

  async getUserMeta(id: number): Promise<any> {
    const user = await this.usersRepository.findOne(
      {
        id,
      },
      { relations: ['usersStores'] },
    );

    if (!user) {
      throw new NotFoundException('user not found');
    }

    let baseStoreId = -1;
    const storeIds = [];
    const userMetaReq = [];
    const baseStore = [];
    const otherAssignedStores = [];
    const userStores = await this.userStoresRepository.find({ userId: id });
    userMetaReq.push(this.getSignInLogs(id));
    if (Array.isArray(userStores) && userStores.length) {
      userStores.forEach((userStore) => {
        storeIds.push(userStore.storeId);
        if (userStore.assignType === 'base') {
          baseStoreId = userStore.storeId;
        }
      });
      userMetaReq.push(
        this.storeRepository
          .createQueryBuilder()
          .where('id IN (:...ids )', { ids: storeIds })
          .getMany(),
      );
    }
    const response = await Promise.all(userMetaReq);
    if (Array.isArray(response[1]) && response[1].length) {
      response[1].forEach((store) => {
        if (store.id === baseStoreId) {
          baseStore.push(store);
        } else {
          otherAssignedStores.push(store);
        }
      });
    }

    return {
      user,
      userMeta: {
        signInLogs: response[0] || [],
        baseStore: baseStore,
        otherAssignedStores,
      },
    };
  }

  removeAllUserStores = (userId: number) => {
    return this.userStoresRepository.delete({ userId });
  };

  removeUserStore = (userId: number, storeId: number) => {
    return this.userStoresRepository.delete({ userId, storeId });
  };

  setStatus = async (userId: number, isActive: number) => {
    const body = {
      isActive,
      ...(isActive === 1 && { loginAttempts: 0 }),
    };
    const updatedUser = await this.patch(userId, body);
    return updatedUser;
    // return this.usersRepository.findOne({ id: userId });
  };
  // getAllUserStores = (userId: number, storeId: number, assignType: string) => {
  //   this.userStoresRepository.create({
  //     userId,
  //     storeId,
  //     assignType,
  //   });
  // };

  deleteUser = async (id: number) => {
    try {
      const user = await this.findOne(id);
      if (!user) {
        return new NotFoundException('user not found');
      }

      if (user.role === 'storemanager') {
        await this.usersRepository
          .createQueryBuilder()
          .update(User)
          .set({ manager: null })
          .where({ manager: user.username })
          .execute();
      }

      await Promise.all([
        this.signInLogsRepository
          .createQueryBuilder()
          .delete()
          .from(SignInLogs)
          .where({ userId: id })
          .execute(),
        this.usersRepository.delete(id),
      ]);

      return 'User deleted successfully!';
    } catch (error) {
      return error;
    }
  };
}
