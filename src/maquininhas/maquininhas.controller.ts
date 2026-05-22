import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MaquininhasService } from './maquininhas.service';
import { AtualizarMaquininhaDto, CriarMaquininhaDto } from './dto/maquininha.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super', 'comerciante')
@Controller('maquininhas')
export class MaquininhasController {
  constructor(private readonly svc: MaquininhasService) {}

  @Get()
  list(@Query('comercianteId') comercianteId?: string) {
    return this.svc.listar(comercianteId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findById(id);
  }

  @Post()
  @Roles('super')
  async create(@Body() dto: CriarMaquininhaDto) {
    const m = await this.svc.create(dto);
    return {
      id: m.id,
      nome: m.nome,
      serial: m.serial,
      comercianteId: m.comercianteId,
      ativa: m.ativa,
      apiToken: m.apiTokenPlain, // mostrado uma única vez ao criar
    };
  }

  @Patch(':id')
  @Roles('super')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarMaquininhaDto) {
    return this.svc.update(id, dto);
  }

  @Post(':id/rotacionar-token')
  @Roles('super')
  rotacionar(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.rotacionarToken(id);
  }

  @Delete(':id')
  @Roles('super')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.svc.remove(id);
  }
}
