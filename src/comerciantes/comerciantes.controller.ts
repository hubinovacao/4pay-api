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
  UseGuards,
} from '@nestjs/common';
import { ComerciantesService } from './comerciantes.service';
import { AtualizarComercianteDto, CriarComercianteDto } from './dto/comerciante.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super')
@Controller('comerciantes')
export class ComerciantesController {
  constructor(private readonly svc: ComerciantesService) {}

  @Get()
  list() {
    return this.svc.listar();
  }

  @Post()
  create(@Body() dto: CriarComercianteDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarComercianteDto) {
    return this.svc.update(id, dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findById(id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.svc.remove(id);
  }
}
