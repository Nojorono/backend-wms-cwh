import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../core/domain/entities/user.entity';
import { UserDetail } from '../core/domain/entities/user-detail.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { EmployeeIntegrationService } from './integration/employee-integration';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserDetail]),
  ClientsModule.registerAsync([
    {
      name: 'EMPLOYEE_SERVICE',
      useFactory: (configService: ConfigService) => ({
        transport: Transport.RMQ,
        options: {
          urls: [configService.get('RABBITMQ_URL', 'amqp://localhost:5672') as string],
          queue: configService.get('rmq.employee') || 'employee_queue',
          queueOptions: {
            durable: false,
          },
        },
      }),
      inject: [ConfigService],
    },
  ]),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository, EmployeeIntegrationService],
  exports: [UserService],
})
export class UserModule { }
