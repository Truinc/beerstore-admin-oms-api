import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from './store.entity';

@Entity()
export class StoreFavorite {
  @ApiProperty({ type: String })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: Number })
  @Column({
    type: 'int',
  })
  customerId: number;

  @ApiProperty({ type: Number })
  @ManyToOne(() => Store)
  store: Store;

  @Column({ type: 'datetime2' })
  @CreateDateColumn()
  createdDate: Date;

  @Column({ type: 'datetime2' })
  @UpdateDateColumn()
  updatedDate: Date;
}
