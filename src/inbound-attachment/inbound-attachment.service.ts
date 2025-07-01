import { Injectable, NotFoundException } from '@nestjs/common';
import { InboundAttachmentRepository } from './inbound-attachment.repository';
import { CreateInboundAttachmentDto } from './dto/create-inbound-attachment.dto';
import { UpdateInboundAttachmentDto } from './dto/update-inbound-attachment.dto';
import { InboundAttachment } from '../core/domain/entities/inbound-attachment.entity';

@Injectable()
export class InboundAttachmentService {
  constructor(private readonly repository: InboundAttachmentRepository) {}

  async create(createInboundAttachmentDto: CreateInboundAttachmentDto): Promise<InboundAttachment> {
    return await this.repository.create(createInboundAttachmentDto);
  }

  async findAll(): Promise<InboundAttachment[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<InboundAttachment> {
    const inboundAttachment = await this.repository.findOne(id);
    if (!inboundAttachment) {
      throw new NotFoundException(`Inbound attachment with ID ${id} not found`);
    }
    return inboundAttachment;
  }

  async update(id: string, updateInboundAttachmentDto: UpdateInboundAttachmentDto): Promise<InboundAttachment> {
    const inboundAttachment = await this.findOne(id);
    if (!inboundAttachment) {
      throw new NotFoundException(`Inbound attachment with ID ${id} not found`);
  }
    await this.repository.update(id, updateInboundAttachmentDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}
