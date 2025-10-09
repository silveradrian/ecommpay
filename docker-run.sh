#!/bin/bash

# Savi CustomGPT Application - Docker Development Script
# This script helps with common Docker development tasks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop first."
        exit 1
    fi
    print_success "Docker is running"
}

# Build and start the application
start_app() {
    print_status "Building and starting Savi CustomGPT application..."
    
    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
        print_warning ".env file not found, creating from template..."
        cp env.example .env
        print_warning "Please update .env file with your actual values"
    fi
    
    # Build and start services
    docker-compose up --build -d
    
    print_success "Application started successfully!"
    print_status "Dashboard: http://localhost:5000"
    print_status "Chat Interface: http://localhost:5000/chat"
    print_status "Health Check: http://localhost:5000/api/health"
    
    # Show logs
    print_status "Showing application logs (Ctrl+C to exit):"
    docker-compose logs -f savi-app
}

# Stop the application
stop_app() {
    print_status "Stopping Savi CustomGPT application..."
    docker-compose down
    print_success "Application stopped"
}

# Restart the application
restart_app() {
    print_status "Restarting Savi CustomGPT application..."
    docker-compose restart
    print_success "Application restarted"
}

# View logs
view_logs() {
    print_status "Viewing application logs (Ctrl+C to exit):"
    docker-compose logs -f savi-app
}

# Clean up Docker resources
cleanup() {
    print_status "Cleaning up Docker resources..."
    docker-compose down --volumes --remove-orphans
    docker system prune -f
    print_success "Cleanup completed"
}

# Show application status
show_status() {
    print_status "Application Status:"
    docker-compose ps
    
    print_status "Testing health endpoint..."
    if curl -f -s http://localhost:5000/api/health > /dev/null; then
        print_success "Application is healthy"
    else
        print_warning "Application may not be ready yet"
    fi
}

# Main script logic
case "${1:-start}" in
    start)
        check_docker
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        restart_app
        ;;
    logs)
        view_logs
        ;;
    status)
        show_status
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|logs|status|cleanup}"
        echo ""
        echo "Commands:"
        echo "  start    - Build and start the application (default)"
        echo "  stop     - Stop the application"
        echo "  restart  - Restart the application"
        echo "  logs     - View application logs"
        echo "  status   - Show application status"
        echo "  cleanup  - Stop and clean up Docker resources"
        exit 1
        ;;
esac
