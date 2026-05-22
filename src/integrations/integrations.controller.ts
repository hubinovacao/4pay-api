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
import { IntegrationsService } from './integrations.service';
import { AtualizarIntegrationDto, CriarIntegrationDto } from './dto/integration.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly svc: IntegrationsService) {}

  @Get()
  list(@Query('comercianteId', ParseUUIDPipe) comercianteId: string) {
    return this.svc.listByComerciante(comercianteId);
  }

  @Post()
  create(@Body() dto: CriarIntegrationDto, @CurrentUser() user: JwtUser) {
    return this.svc.create({ ...dto, atualizadoPor: user.email });
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarIntegrationDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.svc.update(id, { ...dto, atualizadoPor: user.email });
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.svc.remove(id);
  }
}
