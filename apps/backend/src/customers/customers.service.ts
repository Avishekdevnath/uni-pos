import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEntity } from './entities/customer.entity';
import { CustomerNoteEntity } from './entities/customer-note.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateNoteDto } from './dto/create-note.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customerRepo: Repository<CustomerEntity>,
    @InjectRepository(CustomerNoteEntity)
    private readonly noteRepo: Repository<CustomerNoteEntity>,
  ) {}

  async list(
    tenantId: string,
    search?: string,
    filter?: string,
    page = 1,
    pageSize = 20,
  ): Promise<{ items: CustomerEntity[]; total: number }> {
    const qb = this.customerRepo
      .createQueryBuilder('c')
      .where('c.tenant_id = :tenantId', { tenantId });

    if (search) {
      qb.andWhere('(c.full_name ILIKE :s OR c.phone ILIKE :s)', {
        s: `%${search}%`,
      });
    }

    if (filter === 'regular') {
      qb.andWhere('c.total_orders >= 5');
    } else if (filter === 'new') {
      qb.andWhere(`c.created_at >= NOW() - INTERVAL '30 days'`);
    } else if (filter === 'inactive') {
      qb.andWhere(
        `(c.last_visit_at IS NULL OR c.last_visit_at < NOW() - INTERVAL '60 days')`,
      );
    }

    qb.orderBy('c.last_visit_at', 'DESC', 'NULLS LAST')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOne(tenantId: string, id: string): Promise<CustomerEntity> {
    const customer = await this.customerRepo.findOne({
      where: { id, tenantId },
    });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return customer;
  }

  async findByPhone(tenantId: string, phone: string): Promise<CustomerEntity | null> {
    return this.customerRepo.findOne({ where: { tenantId, phone } });
  }

  async create(tenantId: string, dto: CreateCustomerDto): Promise<CustomerEntity> {
    const existing = await this.customerRepo.findOne({
      where: { tenantId, phone: dto.phone },
    });
    if (existing) {
      throw new ConflictException(`Customer with phone ${dto.phone} already exists`);
    }

    const customer = this.customerRepo.create({
      tenantId,
      fullName: dto.full_name,
      phone: dto.phone,
      email: dto.email ?? null,
      dateOfBirth: dto.date_of_birth ? new Date(dto.date_of_birth) : null,
      gender: dto.gender ?? null,
      notes: dto.notes ?? null,
    });

    return this.customerRepo.save(customer);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCustomerDto,
  ): Promise<CustomerEntity> {
    const customer = await this.findOne(tenantId, id);

    if (dto.phone && dto.phone !== customer.phone) {
      const conflict = await this.customerRepo.findOne({
        where: { tenantId, phone: dto.phone },
      });
      if (conflict) {
        throw new ConflictException(`Phone ${dto.phone} already in use`);
      }
    }

    if (dto.full_name !== undefined) customer.fullName = dto.full_name;
    if (dto.phone !== undefined) customer.phone = dto.phone;
    if (dto.email !== undefined) customer.email = dto.email ?? null;
    if (dto.date_of_birth !== undefined)
      customer.dateOfBirth = dto.date_of_birth ? new Date(dto.date_of_birth) : null;
    if (dto.gender !== undefined) customer.gender = dto.gender ?? null;
    if (dto.notes !== undefined) customer.notes = dto.notes ?? null;

    return this.customerRepo.save(customer);
  }

  async addNote(
    tenantId: string,
    customerId: string,
    staffId: string,
    dto: CreateNoteDto,
  ): Promise<CustomerNoteEntity> {
    await this.findOne(tenantId, customerId);
    const note = this.noteRepo.create({ customerId, staffId, note: dto.note });
    return this.noteRepo.save(note);
  }

  async listNotes(
    tenantId: string,
    customerId: string,
  ): Promise<CustomerNoteEntity[]> {
    await this.findOne(tenantId, customerId);
    return this.noteRepo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStats(
    customerId: string,
    orderAmount: number,
    completedAt: Date,
  ): Promise<void> {
    await this.customerRepo
      .createQueryBuilder()
      .update(CustomerEntity)
      .set({
        totalOrders: () => 'total_orders + 1',
        totalSpend: () => `total_spend + ${orderAmount}`,
        lastVisitAt: completedAt,
      })
      .where('id = :id', { id: customerId })
      .execute();
  }
}
