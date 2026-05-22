import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeituraNfc } from './entities/leitura-nfc.entity';

@Injectable()
export class NfcService {
  constructor(@InjectRepository(LeituraNfc) private readonly repo: Repository<LeituraNfc>) {}

  registrar(input: {
    maquininhaId: string;
    uid: string;
    tecnologia?: string;
    payload?: string;
  }): Promise<LeituraNfc> {
    const l = this.repo.create({
      maquininhaId: input.maquininhaId,
      uid: input.uid,
      tecnologia: input.tecnologia ?? null,
      payload: input.payload ?? null,
    });
    return this.repo.save(l);
  }

  listar(maquininhaId: string, limit = 50): Promise<LeituraNfc[]> {
    return this.repo.find({
      where: { maquininhaId },
      order: { criadoEm: 'DESC' },
      take: Math.min(limit, 200),
    });
  }
}
