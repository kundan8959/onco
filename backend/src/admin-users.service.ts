import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities';
import { AuditService } from './audit.service';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private auditService: AuditService,
  ) {}

  private sanitize(user: User) {
    return {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      hospital_name: user.hospital_name,
      is_active: user.is_active,
      is_staff: user.is_staff,
      is_superuser: user.is_superuser,
      created_at: user.created_at,
      full_name: user.full_name,
    };
  }

  async list(query: any) {
    const { search, role, page = 1, page_size = 50 } = query;
    const qb = this.userRepo.createQueryBuilder('user').orderBy('user.created_at', 'DESC');
    if (search) {
      qb.andWhere('(user.username ILIKE :s OR user.email ILIKE :s OR user.first_name ILIKE :s OR user.last_name ILIKE :s OR user.hospital_name ILIKE :s)', { s: `%${search}%` });
    }
    if (role) qb.andWhere('user.role = :role', { role });
    qb.skip((Number(page) - 1) * Number(page_size)).take(Number(page_size));
    const [results, count] = await qb.getManyAndCount();
    return { count, results: results.map((item) => this.sanitize(item)) };
  }

  async get(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async create(data: any, actor?: any) {
    if (!data.username || !data.password || !data.role) {
      throw new BadRequestException('username, password, and role are required');
    }
    if (!Object.values(UserRole).includes(data.role)) {
      throw new BadRequestException('Invalid role');
    }
    const existing = await this.userRepo.findOne({ where: [{ username: data.username }, ...(data.email ? [{ email: data.email }] : [])] as any });
    if (existing) throw new BadRequestException('Username or email already exists');

    const user = this.userRepo.create({
      username: data.username,
      password: await bcrypt.hash(data.password, 10),
      first_name: data.first_name || null,
      last_name: data.last_name || null,
      email: data.email || null,
      role: data.role,
      hospital_name: data.role === UserRole.HOSPITAL || data.hospital_name ? (data.hospital_name || null) : null,
      is_active: data.is_active ?? true,
      is_staff: data.is_staff ?? (data.role !== UserRole.PATIENT),
      is_superuser: data.is_superuser ?? (data.role === UserRole.SUPERADMIN),
    });
    const saved = await this.userRepo.save(user);
    await this.auditService.log({
      actor: actor?.username || 'system',
      actor_role: actor?.role || 'system',
      action: 'create',
      entity_type: 'user',
      entity_id: saved.id,
      scope: saved.hospital_name || saved.role,
      summary: `Created ${saved.role} account ${saved.username}`,
      metadata: { username: saved.username, role: saved.role },
    });
    return this.sanitize(saved);
  }

  async update(id: number, data: any, actor?: any) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (data.role && !Object.values(UserRole).includes(data.role)) {
      throw new BadRequestException('Invalid role');
    }
    if (data.password) user.password = await bcrypt.hash(data.password, 10);
    if (data.username !== undefined) user.username = data.username;
    if (data.first_name !== undefined) user.first_name = data.first_name;
    if (data.last_name !== undefined) user.last_name = data.last_name;
    if (data.email !== undefined) user.email = data.email || null;
    if (data.role !== undefined) user.role = data.role;
    if (data.hospital_name !== undefined) user.hospital_name = data.hospital_name || null;
    if (data.is_active !== undefined) user.is_active = !!data.is_active;
    if (data.is_staff !== undefined) user.is_staff = !!data.is_staff;
    if (data.is_superuser !== undefined) user.is_superuser = !!data.is_superuser;
    const saved = await this.userRepo.save(user);
    await this.auditService.log({
      actor: actor?.username || 'system',
      actor_role: actor?.role || 'system',
      action: 'update',
      entity_type: 'user',
      entity_id: saved.id,
      scope: saved.hospital_name || saved.role,
      summary: `Updated ${saved.role} account ${saved.username}`,
      metadata: { username: saved.username, role: saved.role },
    });
    return this.sanitize(saved);
  }

  async remove(id: number, actor?: any) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.is_active = false;
    const saved = await this.userRepo.save(user);
    await this.auditService.log({
      actor: actor?.username || 'system',
      actor_role: actor?.role || 'system',
      action: 'deactivate',
      entity_type: 'user',
      entity_id: saved.id,
      scope: saved.hospital_name || saved.role,
      summary: `Deactivated ${saved.role} account ${saved.username}`,
      metadata: { username: saved.username, role: saved.role },
      status: 'inactive',
    });
    return { success: true };
  }
}
