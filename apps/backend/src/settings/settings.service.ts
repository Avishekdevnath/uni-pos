import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantSettingsEntity } from './entities/tenant-settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(TenantSettingsEntity)
    private readonly repo: Repository<TenantSettingsEntity>,
  ) {}

  async get(tenantId: string): Promise<TenantSettingsEntity> {
    let settings = await this.repo.findOne({ where: { tenantId } });

    if (!settings) {
      // Auto-provision default settings on first access
      settings = this.repo.create({ tenantId });
      settings = await this.repo.save(settings);
    }

    return settings;
  }

  async update(tenantId: string, dto: UpdateSettingsDto): Promise<TenantSettingsEntity> {
    let settings = await this.repo.findOne({ where: { tenantId } });

    if (!settings) {
      settings = this.repo.create({ tenantId });
    }

    Object.assign(settings, dto);
    return this.repo.save(settings);
  }
}
