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
import { Maquininha } from '../../maquininhas/entities/maquininha.entity';
import { GatewayProvider } from '../../integrations/entities/integration.entity';

export type StatusPagamentoNormalizado =
  | 'pending'
  | 'approved'
  | 'refused'
  | 'canceled'
  | 'refunded'
  | 'expired';

@Entity('pagamentos')
@Index(['gatewayProvider', 'externalId'], { unique: true })
export class Pagamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  internalReference: string;

  /** ID do pagamento no provedor (MP payment id, Sicoob txid). */
  @Index()
  @Column({ type: 'varchar', length: 80, nullable: true })
  externalId: string | null;

  @Column({ type: 'varchar', length: 32 })
  gatewayProvider: GatewayProvider;

  @Column({ type: 'varchar', length: 16, default: 'sandbox' })
  gatewayEnvironment: string;

  @Index()
  @Column({ type: 'uuid' })
  comercianteId: string;

  @ManyToOne(() => Comerciante, { eager: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'comercianteId' })
  comerciante: Comerciante;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  maquininhaId: string | null;

  @ManyToOne(() => Maquininha, { eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'maquininhaId' })
  maquininha: Maquininha | null;

  @Index()
  @Column({ type: 'uuid' })
  integrationId: string;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: StatusPagamentoNormalizado;

  @Column({ type: 'varchar', length: 64, nullable: true })
  statusDetail: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  rawStatus: string | null;

  @Column({ type: 'int' })
  valorCentavos: number;

  @Column({ type: 'varchar', length: 255 })
  descricao: string;

  @Column({ type: 'varchar', length: 16, default: 'pix' })
  metodo: string;

  @Column({ type: 'text', nullable: true })
  pixCopyPaste: string | null;

  @Column({ type: 'longtext', nullable: true })
  pixQrBase64: string | null;

  @Column({ type: 'datetime', nullable: true })
  expiraEm: Date | null;

  @Column({ type: 'json', nullable: true })
  itens: any;

  @Column({ type: 'json', nullable: true })
  pagador: any;

  @Column({ type: 'datetime', nullable: true })
  pagoEm: Date | null;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
