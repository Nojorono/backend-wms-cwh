import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerMain } from '../core/domain/entities/customer-main.entity';
import { CustomerSubdist } from '../core/domain/entities/customer-subdist.entity';
import { CreateCustomerMainDto } from './dto/create-customer-main.dto';
import { UpdateCustomerMainDto } from './dto/update-customer-main.dto';
import { CreateCustomerSubdistDto } from './dto/create-customer-subdist.dto';
import { UpdateCustomerSubdistDto } from './dto/update-customer-subdist.dto';

@Injectable()
export class CustomerRepository {
  constructor(
    @InjectRepository(CustomerMain)
    private readonly customerMainRepository: Repository<CustomerMain>,
    @InjectRepository(CustomerSubdist)
    private readonly customerSubdistRepository: Repository<CustomerSubdist>,
  ) {}

  // CustomerMain methods
  async createCustomerMain(createDto: CreateCustomerMainDto): Promise<CustomerMain> {
    const customer = this.customerMainRepository.create(createDto);
    return await this.customerMainRepository.save(customer);
  }

  async findAllCustomerMain(): Promise<CustomerMain[]> {
    return await this.customerMainRepository.find();
  }

  async findAllCustomerMainWithFilters(filters: {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<CustomerMain[]> {
    const { search, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = filters;

    const queryBuilder = this.customerMainRepository.createQueryBuilder('customerMain');

    if (search) {
      queryBuilder.where(
        '(customerMain.name ILIKE :search OR customerMain.org_code ILIKE :search OR customerMain.location_code ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy(`customerMain.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return await queryBuilder.getMany();
  }

  async findOneCustomerMain(id: string): Promise<CustomerMain | null> {
    const customer = await this.customerMainRepository.findOne({ where: { id } });
    if (!customer) {
      return null;
    }
    return customer;
  }

  async findCustomerMainByOrgId(orgId: number): Promise<CustomerMain | null> {
    const customer = await this.customerMainRepository.findOne({ where: { orgId } });
    if (!customer) {
      return null;
    }
    return customer;
  }

  async findCustomerMainByOrgCode(orgCode: string): Promise<CustomerMain | null> {
    const customer = await this.customerMainRepository.findOne({ where: { orgCode } });
    if (!customer) {
      return null;
    }
    return customer;
  }

  async updateCustomerMain(
    id: string,
    updateDto: UpdateCustomerMainDto,
  ): Promise<CustomerMain | null> {
    const customer = await this.findOneCustomerMain(id);
    if (!customer) {
      throw new NotFoundException('Customer Main not found');
    }
    await this.customerMainRepository.update(id, updateDto);
    return await this.findOneCustomerMain(id);
  }

  async removeCustomerMain(id: string): Promise<void> {
    const customer = await this.findOneCustomerMain(id);
    if (!customer) {
      throw new NotFoundException('Customer Main not found');
    }
    await this.customerMainRepository.delete(id);
  }

  // CustomerSubdist methods
  async createCustomerSubdist(createDto: CreateCustomerSubdistDto): Promise<CustomerSubdist> {
    const customer = this.customerSubdistRepository.create(createDto);
    return await this.customerSubdistRepository.save(customer);
  }

  async findAllCustomerSubdist(): Promise<CustomerSubdist[]> {
    return await this.customerSubdistRepository.find();
  }

  async findAllCustomerSubdistWithFilters(filters: {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<CustomerSubdist[]> {
    const { search, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = filters;

    const queryBuilder = this.customerSubdistRepository.createQueryBuilder('customerSubdist');

    if (search) {
      queryBuilder.where(
        '(customerSubdist.customer_name ILIKE :search OR customerSubdist.customer_number ILIKE :search OR customerSubdist.address1 ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy(`customerSubdist.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return await queryBuilder.getMany();
  }

  async findOneCustomerSubdist(id: string): Promise<CustomerSubdist | null> {
    const customer = await this.customerSubdistRepository.findOne({ where: { id } });
    if (!customer) {
      return null;
    }
    return customer;
  }

  async findCustomerSubdistByCustAccountId(custAccountId: number): Promise<CustomerSubdist | null> {
    const customer = await this.customerSubdistRepository.findOne({ where: { custAccountId } });
    if (!customer) {
      return null;
    }
    return customer;
  }

  async findCustomerSubdistByCustomerNumber(
    customerNumber: string,
  ): Promise<CustomerSubdist | null> {
    const customer = await this.customerSubdistRepository.findOne({ where: { customerNumber } });
    if (!customer) {
      return null;
    }
    return customer;
  }

  async updateCustomerSubdist(
    id: string,
    updateDto: UpdateCustomerSubdistDto,
  ): Promise<CustomerSubdist | null> {
    const customer = await this.findOneCustomerSubdist(id);
    if (!customer) {
      throw new NotFoundException('Customer Subdist not found');
    }
    await this.customerSubdistRepository.update(id, updateDto);
    return await this.findOneCustomerSubdist(id);
  }

  async removeCustomerSubdist(id: string): Promise<void> {
    const customer = await this.findOneCustomerSubdist(id);
    if (!customer) {
      throw new NotFoundException('Customer Subdist not found');
    }
    await this.customerSubdistRepository.delete(id);
  }
}

