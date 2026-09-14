import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grifo } from './entities/grifo.entity';
import { CreateGrifoDto } from './dto/create-grifo.dto';
import { UpdateGrifoDto } from './dto/update-grifo.dto';

@Injectable()
export class GrifoService {
  constructor(
    @InjectRepository(Grifo)
    private readonly repo: Repository<Grifo>,
  ) {}

  create(dto: CreateGrifoDto) {
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find({
      relations: {
        compania: true,
      },
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: {
        id_grifo: id,
      },
      relations: {
        compania: true,
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Grifo con id ${id} no encontrado`,
      );
    }

    return item;
  }

  async update(id: number, dto: UpdateGrifoDto) {
    const item = await this.findOne(id);

    Object.assign(item, dto);

    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);

    return this.repo.remove(item);
  }
}
