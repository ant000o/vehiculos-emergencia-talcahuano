import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Compania } from './entities/compania.entity';
import { CreateCompaniaDto } from './dto/create-compania.dto';
import { UpdateCompaniaDto } from './dto/update-compania.dto';

@Injectable()
export class CompaniaService {
  constructor(
    @InjectRepository(Compania)
    private readonly companiaRepository: Repository<Compania>,
  ) {}

  create(dto: CreateCompaniaDto) {
    const compania = this.companiaRepository.create(dto);
    return this.companiaRepository.save(compania);
  }

  findAll() {
    return this.companiaRepository.find();
  }

  async findOne(id: number) {
    const compania = await this.companiaRepository.findOne({ where: { id_compania: id } });
    if (!compania) throw new NotFoundException(`Compañía con id ${id} no encontrada`);
    return compania;
  }

  async update(id: number, dto: UpdateCompaniaDto) {
    const compania = await this.findOne(id);
    Object.assign(compania, dto);
    return this.companiaRepository.save(compania);
  }

  async remove(id: number) {
    const compania = await this.findOne(id);
    return this.companiaRepository.remove(compania);
  }
}
