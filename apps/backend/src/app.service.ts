import { Injectable } from "@nestjs/common";
import { timestamp } from "rxjs";
import { DataSource } from "typeorm";

@Injectable()
export class AppService {
  constructor(private datasource: DataSource) {}

  getHealthStatus() {
    const dbConnected = this.datasource.isInitialized;
    return {
      status : 'OK',
      proyect: 'SIGEV Backend - Bomberos Talcahuano',
      base_de_datos: dbConnected ? 'Conectada (PostgreSQL)' : 'Desconectada',
      timestamp: new Date().toLocaleDateString('es-CL'),
    }
  }
}