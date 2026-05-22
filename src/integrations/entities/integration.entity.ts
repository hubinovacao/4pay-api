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

export type GatewayProvider = 'mercadopago' | 'sicoob';
export type GatewayEnvironment = 'sandbox' | 'production';

/**
 * Configuração de gateway de pagamento por comerciante.
 * Credenciais são armazenadas criptografadas (AES-256-GCM) em `credenciaisCifradas`.
 * O percentual de roteamento define qual fatia das transações é enviada a este gateway.
 */
@Entity('integrations')
@Index(['comercianteId', 'provider', 'environment'], { unique: true })
export class Integration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  comercianteId: string;

  @ManyToOne(() => Comerciante, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comercianteId' })
  comerciante: Comerciante;

  @Column({ type: 'varchar', length: 32 })
  provider: GatewayProvider;

  @Column({ type: 'varchar', length: 16, default: 'sandbox' })
  environment: GatewayEnvironment;

  @Column({ type: 'varchar', length: 80, nullable: true })
  apelido: string | null;

  /** JSON criptografado AES-256-GCM. Conteúdo nunca é retornado pela API. */
  @Column({ type: 'text' })
  credenciaisCifradas: string;

  /** Percentual de roteamento (0–100). Soma dos ativos deve ser ≤ 100. */
  @Column({ type: 'int', default: 0 })
  percentual: number;

  /** Prioridade quando dois gateways têm o mesmo percentual (maior = preferido). */
  @Column({ type: 'int', default: 0 })
  prioridade: number;

  @Column({ type: 'boolean', default: true })
  habilitado: boolean;

  @Column({ type: 'varchar', length: 80, nullable: true })
  atualizadoPor: string | null;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
