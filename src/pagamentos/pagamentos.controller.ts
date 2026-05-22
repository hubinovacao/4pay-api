import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PagamentosService } from './pagamentos.service';
import { CriarPagamentoPixDto } from './dto/criar-pagamento.dto';
import { MaquininhaAuthGuard } from '../maquininhas/maquininha-auth.guard';
import { CurrentMaquininha } from '../maquininhas/current-maquininha.decorator';
import { MaquininhaPrincipal } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtUser } from '../auth/auth.types';

@Controller('pagamentos')
export class PagamentosController {
  constructor(private readonly svc: PagamentosService) {}

  /** Maquininha cria Pix usando seu token de API. */
  @UseGuards(MaquininhaAuthGuard)
  @Post('pix')
  async criarPix(
    @Body() dto: CriarPagamentoPixDto,
    @CurrentMaquininha() mq: MaquininhaPrincipal,
  ) {
    return this.svc.criarPix(dto, {
      comercianteId: mq.comercianteId,
      maquininhaId: mq.maquininhaId,
    });
  }

  /** Maquininha consulta status do pagamento que criou. */
  @UseGuards(MaquininhaAuthGuard)
  @Get(':id')
  async getPagamento(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.buscarPorId(id);
  }

  /** Polling: força sincronização com o gateway. */
  @UseGuards(MaquininhaAuthGuard)
  @Post(':id/sincronizar')
  async sincronizar(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.sincronizar(id);
  }

  /** Portal Super lista pagamentos de um comerciante. */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super', 'comerciante')
  @Get()
  async listar(
    @Query('comercianteId') comercianteIdQuery: string | undefined,
    @Query('status') status: string | undefined,
    @Query('limit') limit: string | undefined,
    @Query('offset') offset: string | undefined,
    @CurrentUser() user: JwtUser,
  ) {
    const comercianteId =
      user.role === 'super' ? comercianteIdQuery ?? '' : user.comercianteId ?? '';
    if (!comercianteId) {
      return { items: [], total: 0 };
    }
    return this.svc.listarPorComerciante(comercianteId, {
      status: status as any,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }
}
