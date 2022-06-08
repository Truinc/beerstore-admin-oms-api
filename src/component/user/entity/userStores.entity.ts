import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

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

  // @ApiProperty({ type: 'int' })
  // @Column({
  //   type: 'int',
  // })
  // userId: number;

  // @OneToOne(() => User)
  // @JoinTable()
  // user: User;

  // @OneToOne(() => Store)
  // @JoinTable()
  // store: Store;

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: 'userId' })
  userId: number;
}
