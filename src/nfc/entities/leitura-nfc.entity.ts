import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Maquininha } from '../../maquininhas/entities/maquininha.entity';

@Entity('leituras_nfc')
export class LeituraNfc {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  maquininhaId: string;

  @ManyToOne(() => Maquininha, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'maquininhaId' })
  maquininha: Maquininha;

  /** UID hex da tag/cartão NFC. */
  @Index()
  @Column({ type: 'varchar', length: 64 })
  uid: string;

  /** Tecnologia detectada (NfcA, NfcB, IsoDep, Mifare, NDEF, etc). */
  @Column({ type: 'varchar', length: 32, nullable: true })
  tecnologia: string | null;

  /** Conteúdo NDEF / ATR opcional para depuração. */
  @Column({ type: 'text', nullable: true })
  payload: string | null;

  @CreateDateColumn()
  criadoEm: Date;
}
