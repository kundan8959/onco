import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, Patient } from '../entities';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user || !user.is_active) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  private toPayload(user: User) {
    return {
      sub: user.id,
      username: user.username,
      role: user.role,
      is_staff: user.is_staff,
      is_superuser: user.is_superuser,
      hospital_name: user.hospital_name,
    };
  }

  private toUserResponse(user: User) {
    return {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      hospital_name: user.hospital_name,
      is_staff: user.is_staff,
      is_superuser: user.is_superuser,
    };
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    const payload = this.toPayload(user);
    return {
      access: this.jwtService.sign(payload),
      refresh: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: this.toUserResponse(user),
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user || !user.is_active) throw new UnauthorizedException();
      return { access: this.jwtService.sign(this.toPayload(user)) };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getMe(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.is_active) throw new UnauthorizedException('User not found or inactive');

    const result: any = { user: this.toUserResponse(user) };

    // For patient role, also return the linked patient record (matched by email)
    if (user.role === UserRole.PATIENT && user.email) {
      const patient = await this.patientRepo.findOne({ where: { email: user.email } });
      if (patient) {
        result.patient = patient;
      }
    }

    return result;
  }

  async createInitialAdmin() {
    const seedUsers = [
      {
        username: 'superadmin',
        password: 'superadmin123',
        first_name: 'Super',
        last_name: 'Admin',
        email: 'superadmin@onco.local',
        role: UserRole.SUPERADMIN,
        is_staff: true,
        is_superuser: true,
        hospital_name: null,
      },
      {
        username: 'hospital',
        password: 'hospital123',
        first_name: 'Apollo',
        last_name: 'Hospital',
        email: 'hospital@onco.local',
        role: UserRole.HOSPITAL,
        is_staff: true,
        is_superuser: false,
        hospital_name: 'Apollo Oncology Center',
      },
      {
        username: 'patient',
        password: 'patient123',
        first_name: 'Sarah',
        last_name: 'Mitchell',
        email: 'sarah.mitchell@example.com',
        role: UserRole.PATIENT,
        is_staff: false,
        is_superuser: false,
        hospital_name: 'Apollo Oncology Center',
      },
    ];

    for (const seed of seedUsers) {
      const existing = await this.userRepo.findOne({ where: { username: seed.username } });
      if (!existing) {
        const user = this.userRepo.create({
          ...seed,
          password: await bcrypt.hash(seed.password, 10),
          is_active: true,
        });
        await this.userRepo.save(user);
        console.log(`Seeded user: ${seed.username}/${seed.password}`);
        continue;
      }

      let changed = false;
      if (existing.email !== seed.email) {
        existing.email = seed.email;
        changed = true;
      }
      if (existing.first_name !== seed.first_name) {
        existing.first_name = seed.first_name;
        changed = true;
      }
      if (existing.last_name !== seed.last_name) {
        existing.last_name = seed.last_name;
        changed = true;
      }
      if (existing.role !== seed.role) {
        existing.role = seed.role;
        changed = true;
      }
      if (existing.hospital_name !== seed.hospital_name) {
        existing.hospital_name = seed.hospital_name;
        changed = true;
      }
      if (existing.is_staff !== seed.is_staff) {
        existing.is_staff = seed.is_staff;
        changed = true;
      }
      if (existing.is_superuser !== seed.is_superuser) {
        existing.is_superuser = seed.is_superuser;
        changed = true;
      }
      if (!existing.is_active) {
        existing.is_active = true;
        changed = true;
      }
      if (changed) {
        await this.userRepo.save(existing);
      }
    }
  }
}
