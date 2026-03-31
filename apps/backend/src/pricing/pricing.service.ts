import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchProductPriceEntity } from './entities/branch-product-price.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { PriceItemDto } from './dto/set-branch-prices.dto';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(BranchProductPriceEntity)
    private readonly priceRepo: Repository<BranchProductPriceEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  async listPrices(branchId: string, tenantId: string): Promise<BranchProductPriceEntity[]> {
    return this.priceRepo.find({ where: { branchId, tenantId } });
  }

  async setPrices(
    branchId: string,
    tenantId: string,
    items: PriceItemDto[],
  ): Promise<BranchProductPriceEntity[]> {
    const records = items.map((item) => ({
      branchId,
      tenantId,
      productId: item.product_id,
      price: item.price,
      cost: item.cost ?? null,
    }));

    await this.priceRepo.upsert(records, {
      conflictPaths: ['branchId', 'productId'],
      skipUpdateIfNoValuesChanged: true,
    });

    return this.priceRepo.find({ where: { branchId, tenantId } });
  }

  async deletePrice(branchId: string, productId: string, tenantId: string): Promise<void> {
    const record = await this.priceRepo.findOne({
      where: { branchId, productId, tenantId },
    });
    if (!record) throw new NotFoundException(`No price override found for product ${productId} on branch ${branchId}`);
    await this.priceRepo.remove(record);
  }

  async resolvePrice(branchId: string, productId: string): Promise<number> {
    const override = await this.priceRepo.findOne({ where: { branchId, productId } });
    if (override) return override.price;

    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);
    return product.price;
  }
}
