# 🚀 NestJS Scaffold Generator

A comprehensive scaffold generator for NestJS applications following clean architecture patterns.

## 📁 Generated Structure

The scaffold generator creates a complete module structure following your existing patterns:

```
src/
├── core/
│   └── domain/
│       ├── entities/
│       │   └── [EntityName].entity.ts
│       └── interfaces/
│           └── [moduleName].repository.interface.ts
├── [moduleName]/
│   ├── dto/
│   │   ├── create-[moduleName].dto.ts
│   │   └── update-[moduleName].dto.ts
│   ├── [moduleName].controller.ts
│   ├── [moduleName].service.ts
│   ├── [moduleName].repository.ts
│   ├── [moduleName].module.ts
│   └── [moduleName].service.spec.ts
└── infrastructure/
    └── database/
        └── migrations/
            └── [timestamp]-CreateTable[EntityName].ts
```

## 🛠️ Usage

### Basic Scaffold Generator

```bash
node generate-scaffold.js <moduleName> <entityName> [fields...]
```

**Example:**

```bash
node generate-scaffold.js masterProduct Product name:string:Product Name,price:number:100.00
```

### Advanced Scaffold Generator

```bash
node generate-advanced-scaffold.js <moduleName> <entityName> [fields...]
```

**Example:**

```bash
node generate-advanced-scaffold.js masterProduct Product name:string:Product Name,price:number:100.00,isActive:boolean:true
```

## 📋 Field Format

Fields are specified in the format: `name:type:example`

### Supported Types:

- `string` - Text fields
- `number` - Numeric fields
- `boolean` - Boolean fields

### Examples:

```bash
# Simple module with no fields
node generate-advanced-scaffold.js masterCategory Category

# Module with string fields
node generate-advanced-scaffold.js masterProduct Product name:string:Product Name,description:string:Product description

# Module with mixed field types
node generate-advanced-scaffold.js masterOrder Order orderNumber:string:ORD-001,amount:number:100.50,isPaid:boolean:true
```

## 📄 Generated Files

### 1. Entity (`src/core/domain/entities/[EntityName].entity.ts`)

- TypeORM entity with UUID primary key
- Timestamps (created_at, updated_at)
- All fields as nullable columns

### 2. DTOs (`src/[moduleName]/dto/`)

- `create-[moduleName].dto.ts` - Create DTO with validation
- `update-[moduleName].dto.ts` - Update DTO extending create DTO

### 3. Repository (`src/[moduleName]/[moduleName].repository.ts`)

- CRUD operations
- TypeORM integration
- Error handling

### 4. Service (`src/[moduleName]/[moduleName].service.ts`)

- Business logic layer
- Error handling with proper HTTP exceptions
- Repository integration

### 5. Controller (`src/[moduleName]/[moduleName].controller.ts`)

- REST API endpoints
- Swagger documentation
- JWT authentication decorators

### 6. Module (`src/[moduleName]/[moduleName].module.ts`)

- NestJS module configuration
- TypeORM feature registration
- Dependency injection setup

### 7. Migration (`src/infrastructure/database/migrations/`)

- Database table creation
- Proper column types
- Timestamps

### 8. Interface (`src/core/domain/interfaces/[moduleName].repository.interface.ts`)

- Repository interface for dependency injection
- Clean architecture compliance

### 9. Test Spec (`src/[moduleName]/[moduleName].service.spec.ts`)

- Unit test template
- Mock repository setup
- Test cases for all CRUD operations

## 🔗 Generated API Endpoints

Each scaffold generates these REST endpoints:

```
POST   /[moduleName]     - Create new record
GET    /[moduleName]     - Get all records
GET    /[moduleName]/:id - Get record by ID
PATCH  /[moduleName]/:id - Update record
DELETE /[moduleName]/:id - Delete record
```

## 🚀 Next Steps After Generation

1. **Review Generated Files**

   - Check entity fields and relationships
   - Update validation rules in DTOs
   - Add business logic to service

2. **Database Migration**

   ```bash
   npm run migration:run
   ```

3. **Test API Endpoints**

   - Use Swagger UI at `/api`
   - Test with Postman or similar tool

4. **Add Custom Logic**

   - Implement specific business rules
   - Add relationships between entities
   - Implement custom queries

5. **Add Validation**
   - Update DTO validation rules
   - Add custom validators if needed

## 🔧 Customization

### Adding Relationships

Edit the entity file to add relationships:

```typescript
@ManyToOne(() => User, user => user.products)
user: User;

@OneToMany(() => OrderItem, orderItem => orderItem.product)
orderItems: OrderItem[];
```

### Adding Custom Validation

Update DTO files with custom validation:

```typescript
@IsString()
@MinLength(3)
@MaxLength(100)
name: string;

@IsNumber()
@Min(0)
price: number;
```

### Adding Custom Queries

Extend the repository with custom methods:

```typescript
async findByCategory(categoryId: string): Promise<Product[]> {
  return await this.repository.find({ where: { categoryId } });
}
```

## 📝 Examples

### Generate a Product Module

```bash
node generate-advanced-scaffold.js masterProduct Product name:string:Product Name,price:number:100.00,description:string:Product description,isActive:boolean:true
```

### Generate a Category Module

```bash
node generate-advanced-scaffold.js masterCategory Category name:string:Electronics,description:string:Electronic products
```

### Generate a User Module

```bash
node generate-advanced-scaffold.js masterUser User email:string:user@example.com,firstName:string:John,lastName:string:Doe,isActive:boolean:true
```

## 🎯 Features

- ✅ Follows your existing project patterns
- ✅ Clean architecture compliance
- ✅ TypeORM integration
- ✅ Swagger documentation
- ✅ JWT authentication ready
- ✅ Unit test templates
- ✅ Database migrations
- ✅ Error handling
- ✅ Validation decorators
- ✅ TypeScript support

## 🐛 Troubleshooting

### Common Issues:

1. **Module not found**: Ensure the module is imported in `app.module.ts`
2. **Migration errors**: Check database connection and run migrations
3. **Validation errors**: Update DTO validation rules
4. **Type errors**: Check TypeScript configuration

### Debug Commands:

```bash
# Check generated files
ls -la src/[moduleName]/

# Run migrations
npm run migration:run

# Start development server
npm run start:dev
```

## 📚 Best Practices

1. **Naming Convention**: Use PascalCase for entities, camelCase for variables
2. **Field Types**: Choose appropriate TypeScript types
3. **Validation**: Add proper validation rules to DTOs
4. **Testing**: Write unit tests for business logic
5. **Documentation**: Update Swagger documentation as needed

---

**Happy Scaffolding! 🚀**
