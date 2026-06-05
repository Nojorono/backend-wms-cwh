import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { OutboundIntegrationIrReq } from '../core/domain/entities/outbound-integration-ir-req.entity';
import { OutboundIntegrationIrReqLines } from '../core/domain/entities/outbound-integration-ir-req-lines.entity';
import { CreateOutboundIntegrationIrReqDto } from './dto/create-outbound-integration-ir-req.dto';
import { UpdateOutboundIntegrationIrReqDto } from './dto/update-outbound-integration-ir-req.dto';
import { CreateOutboundIntegrationIrReqLineDto } from './dto/create-outbound-integration-ir-req-line.dto';
import { UpdateOutboundIntegrationIrReqLineDto } from './dto/update-outbound-integration-ir-req-line.dto';

@Injectable()
export class OutboundIntegrationIrReqRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OutboundIntegrationIrReq)
    private readonly headerRepo: Repository<OutboundIntegrationIrReq>,
    @InjectRepository(OutboundIntegrationIrReqLines)
    private readonly lineRepo: Repository<OutboundIntegrationIrReqLines>,
  ) { }

  async createHeader(dto: CreateOutboundIntegrationIrReqDto): Promise<OutboundIntegrationIrReq> {
    const entity = this.headerRepo.create(dto);
    return await this.headerRepo.save(entity);
  }

  async createHeaderWithLines(
    headerDto: CreateOutboundIntegrationIrReqDto,
    lineDtos: CreateOutboundIntegrationIrReqLineDto[],
  ): Promise<{ header: OutboundIntegrationIrReq; lines: OutboundIntegrationIrReqLines[] }> {
    return await this.dataSource.transaction(async (manager) => {
      const hRepo = manager.getRepository(OutboundIntegrationIrReq);
      const lRepo = manager.getRepository(OutboundIntegrationIrReqLines);

      const header = await hRepo.save(hRepo.create(headerDto));
      const lines: OutboundIntegrationIrReqLines[] = [];
      for (const lineDto of lineDtos) {
        const { outbound_integration_ir_req_id: _omit, ...rest } = lineDto;
        const line = lRepo.create({
          ...rest,
          outbound_integration_ir_req_id: header.id,
        });
        lines.push(await lRepo.save(line));
      }
      return { header, lines };
    });
  }

  async findAllByOutboundDoId(outboundDoId: string): Promise<OutboundIntegrationIrReq[]> {
    return await this.headerRepo.find({ where: { outbound_do_id: outboundDoId }, relations: ['lines'] });
  }

  async findAllHeaders(): Promise<OutboundIntegrationIrReq[]> {
    return await this.headerRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findHeaderById(id: string): Promise<OutboundIntegrationIrReq | null> {
    return await this.headerRepo.findOne({ where: { id } });
  }

  async findHeaderByOutboundMemoId(memoId: string): Promise<OutboundIntegrationIrReq | null> {
    return await this.headerRepo.findOne({ where: { outbound_memo_id: memoId } });
  }

  async findLinesByHeaderIds(headerIds: string[]): Promise<OutboundIntegrationIrReqLines[]> {
    if (headerIds.length === 0) {
      return [];
    }
    return await this.lineRepo.find({
      where: { outbound_integration_ir_req_id: In(headerIds) },
      order: { createdAt: 'ASC' },
    });
  }

  async updateHeader(id: string, dto: UpdateOutboundIntegrationIrReqDto): Promise<void> {
    await this.headerRepo.update(id, dto);
  }

  async replaceLinesByHeaderId(
    headerId: string,
    lineDtos: CreateOutboundIntegrationIrReqLineDto[],
  ): Promise<OutboundIntegrationIrReqLines[]> {
    return await this.dataSource.transaction(async (manager) => {
      const lRepo = manager.getRepository(OutboundIntegrationIrReqLines);
      await lRepo.softDelete({ outbound_integration_ir_req_id: headerId });

      const rows: OutboundIntegrationIrReqLines[] = [];
      for (const lineDto of lineDtos) {
        const { outbound_integration_ir_req_id: _omit, ...rest } = lineDto;
        const line = lRepo.create({
          ...rest,
          outbound_integration_ir_req_id: headerId,
        });
        rows.push(await lRepo.save(line));
      }
      return rows;
    });
  }

  async removeHeader(id: string): Promise<void> {
    await this.lineRepo.softDelete({ outbound_integration_ir_req_id: id });
    await this.headerRepo.softDelete(id);
  }

  async createLine(dto: CreateOutboundIntegrationIrReqLineDto): Promise<OutboundIntegrationIrReqLines> {
    const entity = this.lineRepo.create(dto);
    return await this.lineRepo.save(entity);
  }

  async findAllLines(): Promise<OutboundIntegrationIrReqLines[]> {
    return await this.lineRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findLineById(id: string): Promise<OutboundIntegrationIrReqLines | null> {
    return await this.lineRepo.findOne({ where: { id } });
  }

  async findLinesByHeaderId(headerId: string): Promise<OutboundIntegrationIrReqLines[]> {
    return await this.lineRepo.find({
      where: { outbound_integration_ir_req_id: headerId },
      order: { createdAt: 'ASC' },
    });
  }

  async updateLine(id: string, dto: UpdateOutboundIntegrationIrReqLineDto): Promise<void> {
    await this.lineRepo.update(id, dto);
  }

  async removeLine(id: string): Promise<void> {
    await this.lineRepo.softDelete(id);
  }
}
