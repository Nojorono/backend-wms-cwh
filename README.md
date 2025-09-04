# NestJS WMS with Clean Architecture

A Warehouse Management System (WMS) built with NestJS following Clean Architecture principles.

## Features

- JWT Authentication
- Clean Architecture
- PostgreSQL Database
- TypeORM
- Environment Configuration
- Input Validation

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd be-wms-nest
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=wms

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production

# Application Configuration
NODE_ENV=development
PORT=3000
```

4. Start the application:

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Endpoints

### Authentication

- POST `/auth/register` - Register a new user
- POST `/auth/login` - Login and get JWT token

## Project Structure

```
src/
├── core/
│   ├── domain/
│   │   ├── entities/
│   │   └── interfaces/
│   └── application/
│       └── dtos/
├── infrastructure/
│   ├── services/
│   └── strategies/
└── presentation/
    └── controllers/
```

## Clean Architecture

The project follows Clean Architecture principles with the following layers:

1. **Domain Layer**: Contains business entities and interfaces
2. **Application Layer**: Contains use cases and DTOs
3. **Infrastructure Layer**: Contains implementations of interfaces
4. **Presentation Layer**: Contains controllers and presenters

## Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Input validation using class-validator
- Environment variables for configuration

## License

MIT
