import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Store } from './store.entity';

@Entity()
export class StoreHours {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 50,
    nullable: false,
  })
  weekDay: string;

  @ApiProperty({ type: Number })
  @Column({
    type: 'int',
    nullable: false,
  })
  fromHour: number | string;

  @ApiProperty({ type: Number })
  @Column({
    type: 'int',
    nullable: false,
  })
  toHour: number | string;

  @ManyToOne(() => Store, (store) => store.storeHours, { onDelete: 'CASCADE' })
  store: Store;
}
