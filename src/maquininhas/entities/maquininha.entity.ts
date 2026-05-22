import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Comerciante } from '../../comerciantes/entities/comerciante.entity';

@Entity('maquininhas')
export class Maquininha {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  nome: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  serial: string;

  /** Token de API usado pela maquininha para autenticar no backend. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 96 })
  apiToken: string;

  @Column({ type: 'boolean', default: false })
  ativa: boolean;

  @Column({ type: 'datetime', nullable: true })
  ultimoHeartbeat: Date | null;

  @Index()
  @Column({ type: 'uuid' })
  comercianteId: string;

  @ManyToOne(() => Comerciante, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'comercianteId' })
  comerciante: Comerciante;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
