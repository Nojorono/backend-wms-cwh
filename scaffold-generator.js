const fs = require('fs');
const path = require('path');

class ScaffoldGenerator {
  constructor() {
    this.basePath = './src';
  }

  generateScaffold(moduleName, entityName) {
    const kebabCase = this.toKebabCase(moduleName);
    const pascalCase = this.toPascalCase(moduleName);

    const modulePath = path.join(this.basePath, kebabCase);

    this.createDirectory(modulePath);
    this.createDirectory(path.join(modulePath, 'dto'));

    this.generateEntity(entityName);
    this.generateDto(modulePath, pascalCase);
    this.generateRepository(modulePath, pascalCase, entityName);
    this.generateService(modulePath, pascalCase, entityName);
    this.generateController(modulePath, pascalCase, entityName);
    this.generateModule(modulePath, pascalCase, entityName);

    console.log(`✅ Scaffold generated for ${pascalCase} module`);
    console.log(`📁 Module path: ${modulePath}`);
  }

  toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  toPascalCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  toCamelCase(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  createDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  generateEntity(entityName) {
    const entityPath = path.join(
      this.basePath,
      'core',
      'domain',
      'entities',
      `${entityName}.entity.ts`,
    );

    const entityContent = `import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('${entityName.toLowerCase()}')
export class ${entityName} {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}`;

    fs.writeFileSync(entityPath, entityContent);
    console.log(`📄 Entity created: ${entityPath}`);
  }

  generateDto(modulePath, pascalCase) {
    const createDtoPath = path.join(
      modulePath,
      'dto',
      `create-${this.toKebabCase(pascalCase)}.dto.ts`,
    );
    const updateDtoPath = path.join(
      modulePath,
      'dto',
      `update-${this.toKebabCase(pascalCase)}.dto.ts`,
    );

    const createDtoContent = `export class Create${pascalCase}Dto {}`;

    const updateDtoContent = `import { PartialType } from '@nestjs/swagger';
import { Create${pascalCase}Dto } from './create-${this.toKebabCase(pascalCase)}.dto';

export class Update${pascalCase}Dto extends PartialType(Create${pascalCase}Dto) {}`;

    fs.writeFileSync(createDtoPath, createDtoContent);
    fs.writeFileSync(updateDtoPath, updateDtoContent);
    console.log(`📄 DTOs created: ${createDtoPath}, ${updateDtoPath}`);
  }

  generateRepository(modulePath, pascalCase, entityName) {
    const repositoryPath = path.join(modulePath, `${this.toKebabCase(pascalCase)}.repository.ts`);

    const repositoryContent = `import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ${entityName} } from '../core/domain/entities/${entityName}.entity';
import { Create${pascalCase}Dto } from './dto/create-${this.toKebabCase(pascalCase)}.dto';
import { Update${pascalCase}Dto } from './dto/update-${this.toKebabCase(pascalCase)}.dto';

@Injectable()
export class ${pascalCase}Repository {
  constructor(
    @InjectRepository(${entityName})
    private readonly repository: Repository<${entityName}>,
  ) {}

  async create(create${pascalCase}Dto: Create${pascalCase}Dto): Promise<${entityName}> {
    const ${this.toCamelCase(pascalCase)} = this.repository.create(create${pascalCase}Dto);
    return await this.repository.save(${this.toCamelCase(pascalCase)});
  }

  async findAll(): Promise<${entityName}[]> {
    return await this.repository.find();
  }

  async findOne(id: string): Promise<${entityName} | null> {
    const ${this.toCamelCase(pascalCase)} = await this.repository.findOne({ where: { id } });
    if (!${this.toCamelCase(pascalCase)}) {
      return null;
    }
    return ${this.toCamelCase(pascalCase)};
  }

  async update(id: string, update${pascalCase}Dto: Update${pascalCase}Dto): Promise<${entityName} | null> {
    const ${this.toCamelCase(pascalCase)} = await this.findOne(id);
    if (!${this.toCamelCase(pascalCase)}) {
      throw new NotFoundException('${pascalCase} not found');
    }
    await this.repository.update(id, update${pascalCase}Dto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const ${this.toCamelCase(pascalCase)} = await this.findOne(id);
    if (!${this.toCamelCase(pascalCase)}) {
      throw new NotFoundException('${pascalCase} not found');
    }
    await this.repository.delete(id);
  }
}`;

    fs.writeFileSync(repositoryPath, repositoryContent);
    console.log(`📄 Repository created: ${repositoryPath}`);
  }

  generateService(modulePath, pascalCase, entityName) {
    const servicePath = path.join(modulePath, `${this.toKebabCase(pascalCase)}.service.ts`);

    const serviceContent = `import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ${pascalCase}Repository } from './${this.toKebabCase(pascalCase)}.repository';
import { Create${pascalCase}Dto } from './dto/create-${this.toKebabCase(pascalCase)}.dto';
import { Update${pascalCase}Dto } from './dto/update-${this.toKebabCase(pascalCase)}.dto';
import { ${entityName} } from '../core/domain/entities/${entityName}.entity';

@Injectable()
export class ${pascalCase}Service {
  constructor(private readonly repository: ${pascalCase}Repository) {}

  async create(create${pascalCase}Dto: Create${pascalCase}Dto): Promise<${entityName}> {
    return await this.repository.create(create${pascalCase}Dto);
  }

  async findAll(): Promise<${entityName}[]> {
    return await this.repository.findAll();
  }

  async findOne(id: string): Promise<${entityName}> {
    const ${this.toCamelCase(pascalCase)} = await this.repository.findOne(id);
    if (!${this.toCamelCase(pascalCase)}) {
      throw new NotFoundException(\`${pascalCase} with ID \${id} not found\`);
    }
    return ${this.toCamelCase(pascalCase)};
  }

  async update(id: string, update${pascalCase}Dto: Update${pascalCase}Dto): Promise<${entityName}> {
    const updated${pascalCase} = await this.repository.update(id, update${pascalCase}Dto);
    if (!updated${pascalCase}) {
      throw new NotFoundException(\`${pascalCase} with ID \${id} not found\`);
    }
    return updated${pascalCase};
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.remove(id);
  }
}`;

    fs.writeFileSync(servicePath, serviceContent);
    console.log(`📄 Service created: ${servicePath}`);
  }

  generateController(modulePath, pascalCase, entityName) {
    const controllerPath = path.join(modulePath, `${this.toKebabCase(pascalCase)}.controller.ts`);

    const controllerContent = `import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ${pascalCase}Service } from './${this.toKebabCase(pascalCase)}.service';
import { Create${pascalCase}Dto } from './dto/create-${this.toKebabCase(pascalCase)}.dto';
import { Update${pascalCase}Dto } from './dto/update-${this.toKebabCase(pascalCase)}.dto';
import { ${entityName} } from '../core/domain/entities/${entityName}.entity';

@ApiTags('${pascalCase}')
@Controller('${this.toKebabCase(pascalCase)}')
@ApiBearerAuth('JWT-auth')
export class ${pascalCase}Controller {
  constructor(private readonly ${this.toCamelCase(pascalCase)}Service: ${pascalCase}Service) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ${pascalCase}' })
  @ApiResponse({ status: 201, description: 'The ${pascalCase} has been successfully created.', type: ${entityName} })
  @ApiResponse({ status: 409, description: '${pascalCase} already exists.' })
  create(@Body() create${pascalCase}Dto: Create${pascalCase}Dto) {
    return this.${this.toCamelCase(pascalCase)}Service.create(create${pascalCase}Dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all ${pascalCase}s' })
  @ApiResponse({ status: 200, description: 'Return all ${pascalCase}s.', type: [${entityName}] })
  findAll() {
    return this.${this.toCamelCase(pascalCase)}Service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ${pascalCase} by id' })
  @ApiResponse({ status: 200, description: 'Return the ${pascalCase}.', type: ${entityName} })
  @ApiResponse({ status: 404, description: '${pascalCase} not found.' })
  findOne(@Param('id') id: string) {
    return this.${this.toCamelCase(pascalCase)}Service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a ${pascalCase}' })
  @ApiResponse({ status: 200, description: 'The ${pascalCase} has been successfully updated.', type: ${entityName} })
  @ApiResponse({ status: 404, description: '${pascalCase} not found.' })
  @ApiResponse({ status: 409, description: '${pascalCase} already exists.' })
  update(
    @Param('id') id: string,
    @Body() update${pascalCase}Dto: Update${pascalCase}Dto,
  ) {
    return this.${this.toCamelCase(pascalCase)}Service.update(id, update${pascalCase}Dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ${pascalCase}' })
  @ApiResponse({ status: 200, description: 'The ${pascalCase} has been successfully deleted.' })
  @ApiResponse({ status: 404, description: '${pascalCase} not found.' })
  remove(@Param('id') id: string) {
    return this.${this.toCamelCase(pascalCase)}Service.remove(id);
  }
}`;

    fs.writeFileSync(controllerPath, controllerContent);
    console.log(`📄 Controller created: ${controllerPath}`);
  }

  generateModule(modulePath, pascalCase, entityName) {
    const modulePathFile = path.join(modulePath, `${this.toKebabCase(pascalCase)}.module.ts`);

    const moduleContent = `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ${entityName} } from '../core/domain/entities/${entityName}.entity';
import { ${pascalCase}Controller } from './${this.toKebabCase(pascalCase)}.controller';
import { ${pascalCase}Service } from './${this.toKebabCase(pascalCase)}.service';
import { ${pascalCase}Repository } from './${this.toKebabCase(pascalCase)}.repository';

@Module({
  imports: [TypeOrmModule.forFeature([${entityName}])],
  controllers: [${pascalCase}Controller],
  providers: [
    ${pascalCase}Service,
    ${pascalCase}Repository,
  ],
  exports: [${pascalCase}Service],
})
export class ${pascalCase}Module {}`;

    fs.writeFileSync(modulePathFile, moduleContent);
    console.log(`📄 Module created: ${modulePathFile}`);
  }
}

module.exports = ScaffoldGenerator;
