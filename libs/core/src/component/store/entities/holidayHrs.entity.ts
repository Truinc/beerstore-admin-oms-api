import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { HolidayInfo } from './holidayInfo.entity';

@Entity()
export class HolidayHours {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: Date })
  @Column({ type: 'date', nullable: false, unique: true })
  startDate: Date;

  @ApiProperty({ type: Date })
  @Column({ type: 'date', nullable: false })
  endDate: Date;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 250,
    nullable: false,
  })
  title: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 150,
    nullable: false,
  })
  color: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 1000,
    nullable: false,
  })
  messages: string;

  @OneToMany(() => HolidayInfo, (holidayInfo) => holidayInfo.holidayHour, {
    eager: true,
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE',
  })
  holidayInfo: HolidayInfo[];
}
