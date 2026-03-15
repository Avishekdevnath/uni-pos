import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryEntity } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoriesRepository: Repository<CategoryEntity>,
  ) {}

  list(tenantId: string): Promise<CategoryEntity[]> {
    return this.categoriesRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async create(tenantId: string, dto: CreateCategoryDto): Promise<CategoryEntity> {
    if (dto.parent_id) {
      await this.ensureCategoryExists(tenantId, dto.parent_id);
    }

    const category = this.categoriesRepository.create({
      tenantId,
      parentId: dto.parent_id ?? null,
      name: dto.name,
      status: 'active',
    });

    return this.categoriesRepository.save(category);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryEntity> {
    const category = await this.ensureCategoryExists(tenantId, id);

    if (dto.parent_id) {
      await this.ensureCategoryExists(tenantId, dto.parent_id);
      category.parentId = dto.parent_id;
    }

    if (dto.name !== undefined) {
      category.name = dto.name;
    }

    return this.categoriesRepository.save(category);
  }

  async archive(tenantId: string, id: string): Promise<CategoryEntity> {
    const category = await this.ensureCategoryExists(tenantId, id);
    category.status = 'inactive';
    return this.categoriesRepository.save(category);
  }

  async findById(tenantId: string, id: string): Promise<CategoryEntity | null> {
    return this.categoriesRepository.findOne({
      where: { tenantId, id },
    });
  }

  private async ensureCategoryExists(
    tenantId: string,
    id: string,
  ): Promise<CategoryEntity> {
    const category = await this.findById(tenantId, id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }
}
