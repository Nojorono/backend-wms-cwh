import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { AssignedPickingRepository } from './assigned-picking.repository';
import { CreateAssignedPickingDto } from './dto/create-assigned-picking.dto';
import { UpdateAssignedPickingDto } from './dto/update-assigned-picking.dto';
import { AssignedPicking } from '../core/domain/entities/assigned-picking.entity';

@Injectable()
export class AssignedPickingService {
  constructor(
    private readonly repository: AssignedPickingRepository,
  ) {}

  async create(data: CreateAssignedPickingDto): Promise<AssignedPicking> {
    // Validasi tidak boleh ada assignment ganda untuk memo dan user yang sama
    const existingAssignment = await this.repository.checkExistingAssignment(
      data.memo_id, 
      data.picking_user_id
    );
    
    if (existingAssignment) {
      throw new ConflictException('User sudah ditugaskan untuk memo ini');
    }

    // Validasi memo_id dan picking_user_id tidak boleh kosong
    if (!data.memo_id || data.memo_id.trim() === '') {
      throw new BadRequestException('Memo ID tidak boleh kosong');
    }

    if (!data.picking_user_id || data.picking_user_id.trim() === '') {
      throw new BadRequestException('Picking user ID tidak boleh kosong');
    }

    if (!data.picking_name || data.picking_name.trim() === '') {
      throw new BadRequestException('Picking name tidak boleh kosong');
    }

    return this.repository.create(data);
  }

  async findAll(): Promise<AssignedPicking[]> {
    return this.repository.findAll();
  }

  async findOne(id: string): Promise<AssignedPicking> {
    const assignedPicking = await this.repository.findOne(id);
    if (!assignedPicking) {
      throw new NotFoundException('Assigned picking tidak ditemukan');
    }
    return assignedPicking;
  }

  async update(id: string, data: UpdateAssignedPickingDto): Promise<AssignedPicking> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Assigned picking tidak ditemukan');
    }

    // Validasi tidak boleh ada assignment ganda jika memo_id atau picking_user_id diubah
    if (data.memo_id || data.picking_user_id) {
      const memoId = data.memo_id || existing.memo_id;
      const pickingUserId = data.picking_user_id || existing.picking_user_id;
      
      const existingAssignment = await this.repository.checkExistingAssignment(memoId, pickingUserId);
      if (existingAssignment && existingAssignment.id !== id) {
        throw new ConflictException('User sudah ditugaskan untuk memo ini');
      }
    }

    // Validasi field yang diupdate
    if (data.memo_id && (!data.memo_id || data.memo_id.trim() === '')) {
      throw new BadRequestException('Memo ID tidak boleh kosong');
    }

    if (data.picking_user_id && (!data.picking_user_id || data.picking_user_id.trim() === '')) {
      throw new BadRequestException('Picking user ID tidak boleh kosong');
    }

    if (data.picking_name && (!data.picking_name || data.picking_name.trim() === '')) {
      throw new BadRequestException('Picking name tidak boleh kosong');
    }

    return this.repository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Assigned picking tidak ditemukan');
    }

    return this.repository.remove(id);
  }

  async findByMemoId(memoId: string): Promise<AssignedPicking[]> {
    return this.repository.findByMemoId(memoId);
  }

  async findByPickingUserId(pickingUserId: string): Promise<AssignedPicking[]> {
    return this.repository.findByPickingUserId(pickingUserId);
  }

  async findByPickingName(pickingName: string): Promise<AssignedPicking[]> {
    return this.repository.findByPickingName(pickingName);
  }

  async checkAssignmentExists(memoId: string, pickingUserId: string): Promise<boolean> {
    const assignment = await this.repository.checkExistingAssignment(memoId, pickingUserId);
    return assignment !== null;
  }

  async reassignPicking(id: string, newPickingUserId: string, newPickingName: string, newPickingPhone?: string): Promise<AssignedPicking> {
    const existing = await this.repository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Assigned picking tidak ditemukan');
    }

    // Validasi tidak boleh ada assignment ganda untuk user baru
    const existingAssignment = await this.repository.checkExistingAssignment(
      existing.memo_id, 
      newPickingUserId
    );
    
    if (existingAssignment && existingAssignment.id !== id) {
      throw new ConflictException('User sudah ditugaskan untuk memo ini');
    }

    return this.repository.update(id, {
      picking_user_id: newPickingUserId,
      picking_name: newPickingName,
      picking_phone: newPickingPhone
    });
  }
}
