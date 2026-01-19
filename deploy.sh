#!/bin/bash

# WMS NestJS Docker Deployment Script
# Usage: ./deploy.sh [start|stop|restart|build|logs|migrate]

set -e

COMPOSE_FILE="docker-compose.yml"
PROD_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        print_warn "Environment file $ENV_FILE not found!"
        print_info "Creating from example..."
        if [ -f "env.production.example" ]; then
            cp env.production.example "$ENV_FILE"
            print_warn "Please edit $ENV_FILE with your production values!"
            exit 1
        else
            print_error "Example file not found. Please create $ENV_FILE manually."
            exit 1
        fi
    fi
}

# Main script
case "${1:-start}" in
    start)
        print_info "Starting WMS application..."
        check_env_file
        docker-compose -f "$COMPOSE_FILE" up -d
        print_info "Waiting for services to be ready..."
        sleep 5
        print_info "Services started. Checking health..."
        docker-compose ps
        ;;
    
    start-prod)
        print_info "Starting WMS application in production mode..."
        check_env_file
        docker-compose -f "$COMPOSE_FILE" -f "$PROD_COMPOSE_FILE" up -d
        print_info "Waiting for services to be ready..."
        sleep 5
        print_info "Services started. Checking health..."
        docker-compose ps
        ;;
    
    stop)
        print_info "Stopping WMS application..."
        docker-compose -f "$COMPOSE_FILE" down
        print_info "Services stopped."
        ;;
    
    restart)
        print_info "Restarting WMS application..."
        docker-compose -f "$COMPOSE_FILE" restart
        print_info "Services restarted."
        ;;
    
    build)
        print_info "Building Docker images..."
        docker-compose -f "$COMPOSE_FILE" build --no-cache
        print_info "Build completed."
        ;;
    
    logs)
        print_info "Showing logs (Ctrl+C to exit)..."
        docker-compose -f "$COMPOSE_FILE" logs -f "${2:-}"
        ;;
    
    migrate)
        print_info "Running database migrations..."
        docker-compose -f "$COMPOSE_FILE" exec -T api npm run migration:run
        print_info "Migrations completed."
        ;;
    
    seed)
        print_info "Seeding database..."
        docker-compose -f "$COMPOSE_FILE" exec -T api npm run seed
        print_info "Database seeded."
        ;;
    
    backup)
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        print_info "Creating database backup: $BACKUP_FILE"
        docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U postgres wms_db > "$BACKUP_FILE"
        print_info "Backup created: $BACKUP_FILE"
        ;;
    
    shell)
        print_info "Opening shell in API container..."
        docker-compose -f "$COMPOSE_FILE" exec api sh
        ;;
    
    update)
        print_info "Updating application..."
        git pull
        docker-compose -f "$COMPOSE_FILE" build api
        docker-compose -f "$COMPOSE_FILE" up -d --no-deps api
        print_info "Application updated."
        ;;
    
    clean)
        print_warn "This will remove all containers, volumes, and images!"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose -f "$COMPOSE_FILE" down -v
            docker system prune -f
            print_info "Cleanup completed."
        else
            print_info "Cleanup cancelled."
        fi
        ;;
    
    *)
        echo "Usage: $0 {start|start-prod|stop|restart|build|logs|migrate|seed|backup|shell|update|clean}"
        echo ""
        echo "Commands:"
        echo "  start       - Start all services"
        echo "  start-prod  - Start in production mode with resource limits"
        echo "  stop        - Stop all services"
        echo "  restart     - Restart all services"
        echo "  build       - Build Docker images"
        echo "  logs        - Show logs (optionally specify service: logs api)"
        echo "  migrate     - Run database migrations"
        echo "  seed        - Seed database"
        echo "  backup      - Create database backup"
        echo "  shell       - Open shell in API container"
        echo "  update      - Pull code and rebuild API"
        echo "  clean       - Remove all containers and volumes"
        exit 1
        ;;
esac

