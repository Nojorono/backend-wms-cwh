import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InboundAttachment } from '../core/domain/entities/inbound-attachment.entity';
import { CreateInboundAttachmentDto } from './dto/create-inbound-attachment.dto';
import { UpdateInboundAttachmentDto } from './dto/update-inbound-attachment.dto';

@Injectable()
export class InboundAttachmentRepository {
  constructor(
    @InjectRepository(InboundAttachment)
    private readonly repository: Repository<InboundAttachment>,
  ) {}

  async create(createInboundAttachmentDto: CreateInboundAttachmentDto): Promise<InboundAttachment> {
    const inboundAttachment = this.repository.create(createInboundAttachmentDto);
    return await this.repository.save(inboundAttachment);
  }

  async findAll(): Promise<InboundAttachment[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<InboundAttachment | null> {
    const inboundAttachment = await this.repository.findOne({ where: { id } });
    if (!inboundAttachment) {
      return null;
    }
    return inboundAttachment;
  }

  async findByOrganizationId(organization_id: number): Promise<InboundAttachment | null> {
    const inboundAttachment = await this.repository.findOne({ where: { organization_id } });
    if (!inboundAttachment) {
      return null;
    }
    return inboundAttachment;
  }

  async update(id: string, updateInboundAttachmentDto: UpdateInboundAttachmentDto): Promise<InboundAttachment | null> {
    const inboundAttachment = await this.findOne(id);
    if (!inboundAttachment) {
      throw new NotFoundException('Inbound attachment not found');
    }
    await this.repository.update(id, updateInboundAttachmentDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const inboundAttachment = await this.findOne(id);
    if (!inboundAttachment) {
      throw new NotFoundException('Inbound attachment not found');
    }
    await this.repository.delete(id);
  }

  async findByInboundPlanId(inbound_plan_id: string): Promise<InboundAttachment[]> {
    return await this.repository.find({ where: { inbound_plan_id } });
  }
}
