import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { IsArray, IsString, ArrayMaxSize } from 'class-validator';
import { In, Repository, DataSource } from 'typeorm';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthUserPayload } from '../auth/interfaces/auth-user-payload.interface';
import { RequirePermission } from './decorators/require-permission.decorator';
import { PermissionGuard } from './guards/permission.guard';
import { PermissionEntity } from './entities/permission.entity';
import { RoleEntity } from './entities/role.entity';
import { RolePermissionEntity } from './entities/role-permission.entity';
import { RbacService } from './rbac.service';

type RequestWithUser = Request & { user?: AuthUserPayload };

class SetRolePermissionsDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(200)
  permissionCodes!: string[];
}

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermission('roles:manage')
@Controller('roles')
export class RolesController {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepo: Repository<PermissionEntity>,
    @InjectRepository(RolePermissionEntity)
    private readonly rolePermissionRepo: Repository<RolePermissionEntity>,
    private readonly rbacService: RbacService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all roles for the caller tenant' })
  async listRoles(@Req() req: RequestWithUser) {
    const tenantId = req.user!.tenantId;
    const roles = await this.roleRepo.find({ where: { tenantId } });

    const counts = await Promise.all(
      roles.map(async (role) => {
        const count = await this.rolePermissionRepo.count({
          where: { roleId: role.id },
        });
        return { ...role, permissionCount: count };
      }),
    );

    return { status: 'success', data: counts };
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List all available permissions (global catalogue, not tenant-scoped)' })
  async listAllPermissions() {
    const permissions = await this.permissionRepo.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
    return { status: 'success', data: permissions };
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: 'Get permissions assigned to a role' })
  async getRolePermissions(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    const tenantId = req.user!.tenantId;
    const role = await this.roleRepo.findOne({ where: { id, tenantId } });
    if (!role) throw new NotFoundException('Role not found');

    const assigned = await this.rolePermissionRepo.find({
      where: { roleId: id },
      relations: ['permission'],
    });
    const permissions = assigned.map((rp) => rp.permission);

    return { status: 'success', data: { role, permissions } };
  }

  @Put(':id/permissions')
  @HttpCode(200)
  @ApiOperation({ summary: 'Replace all permissions for a role (atomic)' })
  async setRolePermissions(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Body() body: SetRolePermissionsDto,
  ) {
    const tenantId = req.user!.tenantId;
    const role = await this.roleRepo.findOne({ where: { id, tenantId } });
    if (!role) throw new NotFoundException('Role not found');

    const permissions = body.permissionCodes.length
      ? await this.permissionRepo.find({
          where: { code: In(body.permissionCodes) },
        })
      : [];

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(RolePermissionEntity, { roleId: id });

      if (permissions.length > 0) {
        const rows = permissions.map((p) =>
          manager.create(RolePermissionEntity, { roleId: id, permissionId: p.id }),
        );
        await manager.save(RolePermissionEntity, rows);
      }
    });

    this.rbacService.invalidateRoleCache(id);

    return { status: 'success', data: { role, permissions } };
  }
}
