import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { NfcService } from './nfc.service';
import { RegistrarLeituraNfcDto } from './dto/registrar-leitura.dto';
import { MaquininhaAuthGuard } from '../maquininhas/maquininha-auth.guard';
import { CurrentMaquininha } from '../maquininhas/current-maquininha.decorator';
import { MaquininhaPrincipal } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('nfc')
export class NfcController {
  constructor(private readonly svc: NfcService) {}

  @UseGuards(MaquininhaAuthGuard)
  @Post('leituras')
  registrar(
    @Body() dto: RegistrarLeituraNfcDto,
    @CurrentMaquininha() mq: MaquininhaPrincipal,
  ) {
    return this.svc.registrar({
      maquininhaId: mq.maquininhaId,
      uid: dto.uid,
      tecnologia: dto.tecnologia,
      payload: dto.payload,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super', 'comerciante')
  @Get('leituras')
  listar(
    @Query('maquininhaId') maquininhaId: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.listar(maquininhaId, limit ? Number(limit) : 50);
  }
}
