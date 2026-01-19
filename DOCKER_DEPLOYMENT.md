# Docker Deployment Guide - WMS NestJS

## 📦 Production Docker Setup

This guide covers deploying the WMS NestJS application using Docker and Docker Compose in a production environment.

---

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM available
- PostgreSQL database (or use included Docker Compose setup)

### 1. Clone and Setup

```bash
# Clone repository
git clone <repository-url>
cd be-wms-nest

# Copy environment file
cp .env.production.example .env.production

# Edit environment variables
nano .env.production  # or use your preferred editor
```

### 2. Configure Environment Variables

Edit `.env.production` with your production values:

```env
# Database
DB_PASSWORD=your_secure_password
DB_DATABASE=wms_db

# JWT Secret (IMPORTANT: Change this!)
JWT_SECRET=your_super_secret_jwt_key_min_32_characters

# AWS S3 (if using)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your_bucket

# Other settings
PORT=3000
LOG_LEVEL=info
```

### 3. Build and Run

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Check status
docker-compose ps
```

### 4. Run Database Migrations

```bash
# Run migrations
docker-compose exec api npm run migration:run

# (Optional) Seed database
docker-compose exec api npm run seed
```

### 5. Verify Deployment

```bash
# Check health
curl http://localhost:3000/health

# Check API
curl http://localhost:3000/api
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Nginx (Reverse Proxy)            │
│         Port 80/443                      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      WMS API (NestJS)                    │
│      Port 3000                           │
│      - REST API                          │
│      - WebSocket                         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      PostgreSQL Database                  │
│      Port 5432                           │
└──────────────────────────────────────────┘
```

---

## 📋 Docker Compose Services

### 1. **PostgreSQL Database**

- **Image:** `postgres:16-alpine`
- **Port:** 5432 (internal), mapped to host
- **Volume:** `postgres_data` (persistent storage)
- **Health Check:** Automatic readiness check

### 2. **WMS API Application**

- **Build:** Multi-stage Dockerfile
- **Port:** 3000
- **Volumes:**
  - `./logs` → `/app/logs` (log files)
  - `./uploads` → `/app/uploads` (file uploads)
- **Health Check:** HTTP endpoint check

### 3. **Nginx (Optional)**

- **Image:** `nginx:alpine`
- **Ports:** 80, 443
- **Profile:** `with-nginx` (not started by default)
- **Features:**
  - Reverse proxy
  - SSL/TLS termination
  - Rate limiting
  - Gzip compression

---

## 🔧 Docker Commands

### Build

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build api

# Build without cache
docker-compose build --no-cache api
```

### Run

```bash
# Start all services in background
docker-compose up -d

# Start with logs
docker-compose up

# Start specific service
docker-compose up -d api

# Start with production overrides
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Stop

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop specific service
docker-compose stop api
```

### Logs

```bash
# View all logs
docker-compose logs

# Follow logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api

# View last 100 lines
docker-compose logs --tail=100 api
```

### Execute Commands

```bash
# Run migration
docker-compose exec api npm run migration:run

# Run seed
docker-compose exec api npm run seed

# Access shell
docker-compose exec api sh

# Check database
docker-compose exec postgres psql -U postgres -d wms_db
```

### Maintenance

```bash
# Restart service
docker-compose restart api

# Rebuild and restart
docker-compose up -d --build api

# View resource usage
docker stats

# Clean up
docker-compose down
docker system prune -a
```

---

## 🔐 Security Best Practices

### 1. **Environment Variables**

- ✅ Never commit `.env` files
- ✅ Use strong passwords
- ✅ Rotate JWT secrets regularly
- ✅ Use secrets management (Docker Secrets, AWS Secrets Manager, etc.)

### 2. **Container Security**

- ✅ Run as non-root user (already configured)
- ✅ Use minimal base images (Alpine)
- ✅ Keep images updated
- ✅ Scan for vulnerabilities

### 3. **Network Security**

- ✅ Use internal Docker networks
- ✅ Expose only necessary ports
- ✅ Use reverse proxy (Nginx)
- ✅ Enable SSL/TLS

### 4. **Database Security**

- ✅ Use strong database passwords
- ✅ Limit database access
- ✅ Enable SSL connections
- ✅ Regular backups

---

## 📊 Production Configuration

### Using Production Overrides

```bash
# Start with production settings
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Production settings include:**
- Resource limits (CPU, Memory)
- Optimized PostgreSQL configuration
- Restart policies
- Performance tuning

### Resource Limits

Edit `docker-compose.prod.yml` to adjust:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'      # Max 2 CPUs
      memory: 2G      # Max 2GB RAM
    reservations:
      cpus: '1'       # Guaranteed 1 CPU
      memory: 1G      # Guaranteed 1GB RAM
```

---

## 🔄 Database Migrations

### Run Migrations

```bash
# Run pending migrations
docker-compose exec api npm run migration:run

# Generate new migration
docker-compose exec api npm run migration:generate -- src/infrastructure/database/migrations/MigrationName

# Revert last migration
docker-compose exec api npm run migration:revert
```

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres wms_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T postgres psql -U postgres wms_db < backup.sql
```

---

## 📝 Logging

### Log Files

Logs are stored in `./logs` directory (mounted as volume):

```
logs/
├── application-YYYY-MM-DD.log
├── error-YYYY-MM-DD.log
├── exceptions-YYYY-MM-DD.log
└── rejections-YYYY-MM-DD.log
```

### View Logs

```bash
# Docker logs
docker-compose logs -f api

# Application logs
tail -f logs/application-$(date +%Y-%m-%d).log

# Error logs
tail -f logs/error-$(date +%Y-%m-%d).log
```

---

## 🌐 Nginx Reverse Proxy

### Enable Nginx

```bash
# Start with Nginx
docker-compose --profile with-nginx up -d
```

### SSL/TLS Setup

1. **Obtain SSL Certificate** (Let's Encrypt, etc.)

2. **Place certificates:**
   ```bash
   mkdir -p nginx/ssl
   cp your-cert.pem nginx/ssl/cert.pem
   cp your-key.pem nginx/ssl/key.pem
   ```

3. **Update nginx.conf:**
   - Uncomment HTTPS server block
   - Update server_name
   - Update certificate paths

4. **Restart Nginx:**
   ```bash
   docker-compose restart nginx
   ```

### Features

- ✅ Reverse proxy to API
- ✅ WebSocket support
- ✅ Rate limiting
- ✅ Gzip compression
- ✅ SSL/TLS termination
- ✅ Health check endpoint

---

## 🔍 Monitoring & Health Checks

### Health Check Endpoint

```bash
# Check API health
curl http://localhost:3000/health

# Check via Docker
docker-compose exec api node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

### Monitor Services

```bash
# View service status
docker-compose ps

# View resource usage
docker stats

# View service logs
docker-compose logs --tail=50 api
```

---

## 🚨 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs api

# Check container status
docker-compose ps

# Restart service
docker-compose restart api
```

### Database Connection Issues

```bash
# Check database is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U postgres -c "SELECT 1"

# Check environment variables
docker-compose exec api env | grep DB_
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows

# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Use different host port
```

### Out of Memory

```bash
# Check memory usage
docker stats

# Increase memory limits in docker-compose.prod.yml
deploy:
  resources:
    limits:
      memory: 4G  # Increase limit
```

### Permission Issues

```bash
# Fix log directory permissions
sudo chown -R $USER:$USER logs/
chmod -R 755 logs/
```

---

## 📦 Building Custom Image

### Build Image

```bash
# Build image
docker build -t wms-api:latest .

# Build with tag
docker build -t wms-api:v1.0.0 .

# Build for specific platform
docker build --platform linux/amd64 -t wms-api:latest .
```

### Push to Registry

```bash
# Tag image
docker tag wms-api:latest your-registry.com/wms-api:latest

# Push to registry
docker push your-registry.com/wms-api:latest
```

### Use Custom Image

Update `docker-compose.yml`:

```yaml
api:
  image: your-registry.com/wms-api:latest
  # Remove build section
```

---

## 🔄 Updates & Deployment

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build api

# Run migrations if needed
docker-compose exec api npm run migration:run
```

### Zero-Downtime Deployment

1. **Build new image:**
   ```bash
   docker-compose build api
   ```

2. **Start new container:**
   ```bash
   docker-compose up -d --scale api=2 --no-recreate api
   ```

3. **Stop old container:**
   ```bash
   docker-compose stop api-old
   docker-compose rm -f api-old
   ```

---

## 📚 Additional Resources

### Environment Variables Reference

See `.env.production.example` for all available environment variables.

### Docker Documentation

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

### NestJS Production

- [NestJS Deployment](https://docs.nestjs.com/recipes/deployment)
- [Production Best Practices](https://docs.nestjs.com/faq/performance)

---

## 🆘 Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables
3. Check Docker resources
4. Review this guide
5. Contact development team

---

**Happy Deploying! 🚀**

