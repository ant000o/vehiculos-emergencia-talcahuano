import { Injectable } from '@nestjs/common';
import { CreateCompañiaDto } from './dto/create-compañia.dto';
import { UpdateCompañiaDto } from './dto/update-compañia.dto';

@Injectable()
export class CompañiaService {
  create(createCompañiaDto: CreateCompañiaDto) {
    return 'This action adds a new compañia';
  }

  findAll() {
    return `This action returns all compañia`;
  }

  findOne(id: number) {
    return `This action returns a #${id} compañia`;
  }

  update(id: number, updateCompañiaDto: UpdateCompañiaDto) {
    return `This action updates a #${id} compañia`;
  }

  remove(id: number) {
    return `This action removes a #${id} compañia`;
  }
}
