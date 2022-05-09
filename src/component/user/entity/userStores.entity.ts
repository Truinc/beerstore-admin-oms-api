// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   CreateDateColumn,
//   UpdateDateColumn,
//   ManyToMany,
//   JoinTable,
// } from 'typeorm';
// import { ApiProperty } from '@nestjs/swagger';
// import { User } from './user.entity';

// @Entity()
// export class UserStores {
//   @ApiProperty({ type: Number })
//   @PrimaryGeneratedColumn()
//   id: number;

//   @ApiProperty({ type: String })
//   @Column({
//     type: 'nvarchar',
//     length: 50,
//     nullable: false,
//   })
//   storeId: string;

//   @ApiProperty({ type: String })
//   @Column({
//     type: 'nvarchar',
//     length: 50,
//   })
//   assignType: string;

//   @ApiProperty({ type: String })
//   @Column({
//     type: 'nvarchar',
//     length: 100,
//     unique: true,
//     nullable: false,
//   })
//   userId: string;

//   @ManyToMany(() => User, (user) => user.userStores)
//   users: User[];
// }

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
    JoinTable,
    PrimaryColumn,
    OneToOne,
    Unique,
  } from 'typeorm';
  import { ApiProperty } from '@nestjs/swagger';
  
  @Entity({ name: 'usersStores' })
  @Unique(['storeId', 'userId'])
  export class UserStores {
    @ApiProperty({ type: Number })
    @PrimaryGeneratedColumn()
    id: number;
  
    @ApiProperty({ type: String })
    @Column({
      type: 'nvarchar',
      length: 50,
    })
    assignType: string;
  
    @ApiProperty({ type: 'int' })
    @Column({
      type: 'int',
    })
    storeId: number;
  
    @ApiProperty({ type: 'int' })
    @Column({
      type: 'int',
    })
    userId: number;
  
    // @OneToOne(() => User)
    // @JoinTable()
    // user: User;
  
    // @OneToOne(() => Store)
    // @JoinTable()
    // store: Store;
  }
  