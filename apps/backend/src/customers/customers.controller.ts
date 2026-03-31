import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { AuthUserPayload } from '../auth/interfaces/auth-user-payload.interface';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateNoteDto } from './dto/create-note.dto';

type RequestWithUser = Request & { user?: AuthUserPayload };

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermission('customers:view')
  list(
    @Req() req: RequestWithUser,
    @Query('search') search?: string,
    @Query('filter') filter?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('page_size', new DefaultValuePipe(20), ParseIntPipe) pageSize = 20,
  ) {
    return this.customersService.list(req.user!.tenantId, search, filter, page, pageSize);
  }

  @Get(':id')
  @RequirePermission('customers:view')
  findOne(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customersService.findOne(req.user!.tenantId, id);
  }

  @Post()
  @RequirePermission('customers:create')
  create(@Req() req: RequestWithUser, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(req.user!.tenantId, dto);
  }

  @Patch(':id')
  @RequirePermission('customers:edit')
  update(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(req.user!.tenantId, id, dto);
  }

  @Post(':id/notes')
  @RequirePermission('customers:edit')
  addNote(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateNoteDto,
  ) {
    return this.customersService.addNote(req.user!.tenantId, id, req.user!.sub, dto);
  }

  @Get(':id/notes')
  @RequirePermission('customers:view')
  listNotes(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customersService.listNotes(req.user!.tenantId, id);
  }
}
