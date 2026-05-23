import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('comerciantes')
export class Comerciante {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** CNPJ (somente dígitos) ou CPF. */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32, nullable: true })
  documento: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  razaoSocial: string | null;

  /** Nome principal exibido na plataforma (nome fantasia). */
  @Column({ type: 'varchar', length: 180 })
  nomeFantasia: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  inscricaoEstadual: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  cep: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  logradouro: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  numero: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  complemento: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  bairro: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  municipio: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  uf: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefone: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  email: string | null;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
