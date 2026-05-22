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
import { UserRole } from '../../auth/auth.types';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ type: 'varchar', length: 120 })
  nome: string;

  @Column({ type: 'varchar', length: 255 })
  senhaHash: string;

  @Column({ type: 'varchar', length: 16, default: 'comerciante' })
  role: UserRole;

  /** Quando role=comerciante, identifica a qual comerciante o usuário pertence. */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  comercianteId: string | null;

  @ManyToOne(() => Comerciante, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comercianteId' })
  comerciante: Comerciante | null;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'datetime', nullable: true })
  ultimoLogin: Date | null;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
