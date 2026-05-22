import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GatewayProvider } from '../../integrations/entities/integration.entity';

@Entity('eventos_webhook')
export class EventoWebhook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 32 })
  provider: GatewayProvider;

  @Column({ type: 'varchar', length: 80, nullable: true })
  externalId: string | null;

  @Column({ type: 'boolean', default: false })
  assinaturaValida: boolean;

  @Column({ type: 'boolean', default: false })
  processado: boolean;

  @Column({ type: 'text', nullable: true })
  erro: string | null;

  @Column({ type: 'json', nullable: true })
  headers: any;

  @Column({ type: 'longtext', nullable: true })
  body: string | null;

  @CreateDateColumn()
  criadoEm: Date;
}
