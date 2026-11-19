import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Compania } from './entities/compania.entity';
import { CreateCompaniaDto } from './dto/create-compania.dto';
import { UpdateCompaniaDto } from './dto/update-compania.dto';
import { toPostGIS, fromPostGIS } from '../common/utils/geo.util';

@Injectable()
export class CompaniaService {
  constructor(
    @InjectRepository(Compania)
    private readonly companiaRepository: Repository<Compania>,
  ) {}

  create(dto: CreateCompaniaDto) {
    const entity = this.companiaRepository.create({
      ...dto,
      ...(dto.ubicacion_geo && { ubicacion_geo: toPostGIS(dto.ubicacion_geo as any) }),
    });
    return this.companiaRepository.save(entity);
  }

  async findAll() {
    const items = await this.companiaRepository.find();
    return items.map((c) => ({ ...c, ubicacion_geo: fromPostGIS(c.ubicacion_geo) }));
  }

  async findOne(id: number) {
    const compania = await this.companiaRepository.findOne({ where: { id_compania: id } });
    if (!compania) throw new NotFoundException(`Compañía con id ${id} no encontrada`);
    return { ...compania, ubicacion_geo: fromPostGIS(compania.ubicacion_geo) };
  }

  async update(id: number, dto: UpdateCompaniaDto) {
    const compania = await this.companiaRepository.findOne({ where: { id_compania: id } });
    if (!compania) throw new NotFoundException(`Compañía con id ${id} no encontrada`);

    Object.assign(compania, {
      ...dto,
      ...(dto.ubicacion_geo && { ubicacion_geo: toPostGIS(dto.ubicacion_geo as any) }),
    });

    const saved = await this.companiaRepository.save(compania);
    return { ...saved, ubicacion_geo: fromPostGIS(saved.ubicacion_geo) };
  }

  async remove(id: number) {
    const compania = await this.companiaRepository.findOne({ where: { id_compania: id } });
    if (!compania) throw new NotFoundException(`Compañía con id ${id} no encontrada`);
    return this.companiaRepository.remove(compania);
  }
}

