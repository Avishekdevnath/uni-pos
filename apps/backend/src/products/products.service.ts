import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CategoriesService } from '../categories/categories.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductEntity } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productsRepository: Repository<ProductEntity>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async list(tenantId: string, query: ListProductsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;

    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .where('product.tenant_id = :tenantId', { tenantId });

    if (query.category_id) {
      queryBuilder.andWhere('product.category_id = :categoryId', {
        categoryId: query.category_id,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('product.status = :status', {
        status: query.status,
      });
    }

    if (query.barcode) {
      queryBuilder.andWhere('product.barcode = :barcode', {
        barcode: query.barcode,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(product.name) LIKE LOWER(:search)', {
            search: `%${query.search}%`,
          })
            .orWhere('LOWER(product.sku) LIKE LOWER(:search)', {
              search: `%${query.search}%`,
            })
            .orWhere('LOWER(product.barcode) LIKE LOWER(:search)', {
              search: `%${query.search}%`,
            });
        }),
      );
    }

    queryBuilder.orderBy('product.created_at', 'DESC');
    queryBuilder.skip((page - 1) * pageSize).take(pageSize);

    const [items, totalItems] = await queryBuilder.getManyAndCount();

    return {
      items,
      pagination: {
        page,
        page_size: pageSize,
        total_items: totalItems,
        total_pages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  async create(tenantId: string, dto: CreateProductDto): Promise<ProductEntity> {
    if (dto.category_id) {
      await this.categoriesService.findById(tenantId, dto.category_id);
    }

    const product = this.productsRepository.create({
      tenantId,
      categoryId: dto.category_id ?? null,
      taxGroupId: dto.tax_group_id ?? null,
      name: dto.name,
      sku: dto.sku ?? null,
      barcode: dto.barcode ?? null,
      unit: dto.unit ?? 'pcs',
      price: dto.price,
      cost: dto.cost,
      status: 'active',
    });

    return this.productsRepository.save(product);
  }

  async getById(tenantId: string, id: string): Promise<ProductEntity> {
    const product = await this.productsRepository.findOne({
      where: { tenantId, id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateProductDto,
  ): Promise<ProductEntity> {
    const product = await this.getById(tenantId, id);

    if (dto.category_id !== undefined) {
      if (dto.category_id) {
        await this.categoriesService.findById(tenantId, dto.category_id);
      }

      product.categoryId = dto.category_id ?? null;
    }

    if (dto.tax_group_id !== undefined) {
      product.taxGroupId = dto.tax_group_id ?? null;
    }

    if (dto.name !== undefined) {
      product.name = dto.name;
    }

    if (dto.sku !== undefined) {
      product.sku = dto.sku ?? null;
    }

    if (dto.barcode !== undefined) {
      product.barcode = dto.barcode ?? null;
    }

    if (dto.unit !== undefined) {
      product.unit = dto.unit;
    }

    if (dto.price !== undefined) {
      product.price = dto.price;
    }

    if (dto.cost !== undefined) {
      product.cost = dto.cost;
    }

    return this.productsRepository.save(product);
  }

  async archive(tenantId: string, id: string): Promise<ProductEntity> {
    const product = await this.getById(tenantId, id);
    product.status = 'inactive';

    return this.productsRepository.save(product);
  }
}
