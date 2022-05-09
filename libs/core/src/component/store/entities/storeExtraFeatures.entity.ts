import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Store } from './store.entity';

@Entity()
export class StoreExtraFeatures {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 200,
    nullable: false,
  })
  code: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 200,
    nullable: false,
  })
  feature: string;

  @ApiProperty({ type: Number })
  @ManyToOne(() => Store)
  store: Store;

  @Column({ type: 'datetime2' })
  @CreateDateColumn()
  createdDate: Date;

  @ApiProperty({ type: Number })
  @Column({ type: 'smallint', default: 1 })
  isActive: number;

  @Column({ type: 'datetime2' })
  @UpdateDateColumn()
  updatedDate: Date;
}
