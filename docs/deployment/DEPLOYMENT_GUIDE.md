# Deployment Guide

## Overview

This guide covers deploying the CDBL-LMS application to production servers. The application is designed for internal server deployment with Docker containerization.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for development)
- PostgreSQL 13+ (or use Docker)
- 2GB+ RAM available
- Network access to required services

## Quick Start

### Development Environment

1. **Clone the repository**
```bash
git clone <repository-url>
cd CDBL-LMS
```

2. **Set up environment**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. **Install dependencies**
```bash
npm install
```

4. **Run development server**
```bash
npm run dev
```

Access at http://localhost:3000

### Local Docker Deployment

1. **Create environment file**
```bash
cp .env.example .env
# Edit .env with your values
```

2. **Start all services**
```bash
docker-compose up -d
```

3. **Check status**
```bash
docker-compose ps
# or
docker-compose logs -f app
```

4. **Access application**
Visit http://localhost:3000

## Production Deployment

### Docker Image Build

1. **Build the image**
```bash
docker build -t cdbl-lms:latest .
```

2. **Tag for registry**
```bash
docker tag cdbl-lms:latest registry.example.com/cdbl-lms:latest
```

3. **Push to registry**
```bash
docker push registry.example.com/cdbl-lms:latest
```

### Server Deployment

#### Option 1: Docker Compose (Recommended for Internal Servers)

1. **Copy files to server**
```bash
scp docker-compose.yml .env server:/app/
scp -r scripts/ server:/app/
```

2. **SSH to server**
```bash
ssh user@server
cd /app
```

3. **Start services**
```bash
docker-compose up -d
```

4. **Verify deployment**
```bash
docker-compose ps
curl http://localhost:3000/api/health
```

#### Option 2: Kubernetes (For Scalable Deployments)

1. **Create namespace**
```bash
kubectl create namespace cdbl-lms
```

2. **Apply manifests**
```bash
kubectl apply -f k8s/ -n cdbl-lms
```

3. **Check deployment**
```bash
kubectl get pods -n cdbl-lms
kubectl logs -f deployment/cdbl-lms -n cdbl-lms
```

### Database Setup

1. **Initialize database**
```bash
docker-compose exec db psql -U user -d cdbl_lms < scripts/init.sql
```

2. **Run migrations**
```bash
docker-compose exec app npm run migrate
```

3. **Seed data (optional)**
```bash
docker-compose exec app npm run seed
```

## Configuration

### Environment Variables

Critical variables for production:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://app.internal.company.com/api
DATABASE_URL=postgresql://user:password@db-host:5432/cdbl_lms
AUTH_SECRET=<generate-strong-secret>
JWT_SECRET=<generate-strong-secret>
SESSION_MAX_AGE=86400
```

Generate secure secrets:
```bash
openssl rand -base64 32
```

### Security Configuration

1. **HTTPS/TLS**
   - Use reverse proxy (nginx) for SSL termination
   - Obtain SSL certificate from internal CA

2. **Firewall Rules**
   - Allow port 3000 from authorized networks only
   - Restrict database access to app server

3. **Environment Isolation**
   - Production database on separate server
   - Separate development/staging environments

## Health Checks

### API Health Endpoint

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Database Health

```bash
docker-compose exec db pg_isready -U user
```

### Log Monitoring

View application logs:
```bash
docker-compose logs -f app
```

View database logs:
```bash
docker-compose logs -f db
```

## Backup & Recovery

### Database Backup

**Manual backup:**
```bash
docker-compose exec db pg_dump -U user cdbl_lms > backup.sql
```

**Automated backup (cron job):**
```bash
0 2 * * * docker-compose exec db pg_dump -U user cdbl_lms > /backups/cdbl_lms_$(date +\%Y\%m\%d).sql
```

### Database Restore

```bash
docker-compose exec db psql -U user -d cdbl_lms < backup.sql
```

### Volume Backup

Backup persistent volumes:
```bash
docker run --rm -v cdbl-lms_postgres_data:/data -v /backups:/backup \
  alpine tar czf /backup/postgres_data.tar.gz /data
```

## Monitoring & Logging

### Application Logs

Logs are written to:
- Console output (development)
- File: `/app/logs/` (production)
- Remote logging service (if configured)

### Performance Monitoring

Monitor via built-in utilities:
```typescript
import { getLogger, log } from '@/lib/logging/logger';

log.info('Application started');
```

### Metrics

View performance metrics at runtime:
```bash
curl http://localhost:3000/api/metrics
```

## Troubleshooting

### Container Won't Start

1. **Check logs**
```bash
docker-compose logs app
```

2. **Verify environment**
```bash
docker-compose config
```

3. **Check ports**
```bash
netstat -tulpn | grep 3000
```

### Database Connection Errors

1. **Test connection**
```bash
docker-compose exec db psql -U user -h localhost -d cdbl_lms
```

2. **Verify DATABASE_URL**
```bash
echo $DATABASE_URL
```

3. **Check firewall**
```bash
telnet db 5432
```

### High Memory Usage

1. **Check container**
```bash
docker stats cdbl-lms_app_1
```

2. **Review logs for errors**
```bash
docker-compose logs app | grep -i error
```

3. **Restart container**
```bash
docker-compose restart app
```

## Updates & Rollbacks

### Update Application

1. **Build new image**
```bash
docker build -t cdbl-lms:v1.1.0 .
```

2. **Update docker-compose.yml**
```yaml
services:
  app:
    image: cdbl-lms:v1.1.0
```

3. **Restart service**
```bash
docker-compose up -d
```

### Rollback

1. **Revert docker-compose.yml**
```bash
git checkout docker-compose.yml
```

2. **Restart with old version**
```bash
docker-compose up -d
```

## Performance Optimization

### Database

1. **Create indexes**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_leaves_status ON leaves(status);
```

2. **Enable prepared statements**
Set in connection string: `preparedStatement=true`

### Caching

- Redis is optional but recommended for production
- Configure cache TTL in environment variables
- Monitor cache hit rate

### Image Optimization

- Ensure Next.js Image Optimization is enabled
- Images are automatically optimized on first request
- Consider using CDN for static assets

## Security Hardening

1. **Regular updates**
```bash
npm audit fix
docker pull node:18-alpine
```

2. **Secrets management**
- Use environment variables for all secrets
- Rotate secrets quarterly
- Never commit secrets to repository

3. **Access control**
- Limit firewall access to authorized networks
- Use strong authentication
- Enable audit logging

4. **SSL/TLS**
- Use TLS 1.2 or higher
- Certificate renewal before expiration
- Enable HSTS headers

## Maintenance Schedule

### Daily
- Monitor logs for errors
- Check disk space
- Verify application responsiveness

### Weekly
- Review performance metrics
- Check for security updates
- Verify backups completed

### Monthly
- Test disaster recovery procedures
- Review access logs
- Update documentation

### Quarterly
- Rotate secrets and credentials
- Major security updates
- Performance audit

## Support & Escalation

For issues or questions:

1. Check this guide's Troubleshooting section
2. Review application logs
3. Contact DevOps team
4. File incident ticket with:
   - Error messages
   - Timestamps
   - Steps to reproduce
   - Environment info

## Appendix

### Useful Commands

```bash
# View all running services
docker-compose ps

# Execute command in container
docker-compose exec app npm run command

# View environment variables
docker-compose exec app env | grep VAR_NAME

# Interactive shell
docker-compose exec app sh

# Clean up
docker-compose down -v  # Remove volumes too
```

### File Locations

- Application: `/app`
- Logs: `/app/logs`
- Data: Docker volumes

### Default Ports

- Application: 3000
- Database: 5432
- Redis: 6379 (if enabled)
