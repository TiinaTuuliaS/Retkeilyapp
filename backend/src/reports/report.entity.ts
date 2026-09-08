import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Location } from '../locations/location.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column()
  user_id: number;

  @Column()
  status: string;

  @Column({ type: 'text', default: 'general' })
  target: 'general' | 'toilet' | 'water';

  @Column({ nullable: true })
  comment: string;
}
