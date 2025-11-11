# CDBL Leave Management System - Deployment Guide

**Version:** 2.0
**Last Updated:** January 2025
**Environment:** Production

---

## Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Deployment Steps](#deployment-steps)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Rollback Procedures](#rollback-procedures)
9. [Monitoring](#monitoring)
10. [Maintenance](#maintenance)

---

## Overview

This guide provides step-by-step instructions for deploying the CDBL Leave Management System to a production environment.

### Deployment Architecture

```
┌─────────────────┐
│   Load Balancer │
│   (Optional)    │
└────────┬────────┘
         │
┌────────▼────────┐
│   Next.js App   │
│   (Node 18+)    │
│   Port: 3000    │
└────────┬────────┘
         │
┌────────▼────────┐
│  MySQL Database │
│   Port: 3306    │
└────────┬────────┘
         │
┌────────▼────────┐
│  File Storage   │
│  (uploads/)     │
└─────────────────┘
```

### Supported Platforms

- **Cloud:** AWS, Azure, Google Cloud Platform, DigitalOcean
- **Container:** Docker, Kubernetes
- **PaaS:** Vercel, Railway, Render
- **Traditional:** Linux server (Ubuntu 20.04+, CentOS 8+)

---

## System Requirements

### Hardware Requirements

**Minimum (Small org, <100 users):**
- CPU: 2 cores
- RAM: 4 GB
- Storage: 20 GB SSD
- Network: 100 Mbps

**Recommended (Medium org, 100-500 users):**
- CPU: 4 cores
- RAM: 8 GB
- Storage: 50 GB SSD
- Network: 1 Gbps

**Enterprise (Large org, 500+ users):**
- CPU: 8+ cores
- RAM: 16+ GB
- Storage: 100+ GB SSD
- Network: 1+ Gbps

### Software Requirements

- **Operating System:** Ubuntu 20.04+ LTS (recommended) or equivalent
- **Node.js:** 18.x or 20.x LTS
- **MySQL:** 8.0+ or MariaDB 10.6+
- **Reverse Proxy:** Nginx 1.18+ or Apache 2.4+ (recommended)
- **Process Manager:** PM2 5.x+ (recommended)
- **SSL Certificate:** Let's Encrypt or commercial CA

---

## Pre-Deployment Checklist

### Code Preparation

- [ ] All features tested in staging environment
- [ ] No critical bugs in issue tracker
- [ ] Code reviewed and approved
- [ ] Version tagged in Git (e.g., `v2.0.0`)
- [ ] Build succeeds without errors
- [ ] All dependencies updated and audited

### Database

- [ ] Database schema migrations prepared
- [ ] Database backup completed
- [ ] Database connection string configured
- [ ] Database user permissions verified

### Environment

- [ ] Production `.env` file prepared
- [ ] `JWT_SECRET` generated (32+ characters)
- [ ] Email SMTP credentials configured
- [ ] All API keys and secrets secured
- [ ] Environment variables documented

### Infrastructure

- [ ] Server provisioned and accessible
- [ ] Domain name configured
- [ ] SSL certificate obtained
- [ ] Firewall rules configured
- [ ] Backup system in place

### Documentation

- [ ] Deployment runbook reviewed
- [ ] Rollback procedure documented
- [ ] Team notified of deployment window
- [ ] Maintenance page prepared (if needed)

---

## Deployment Steps

### Option 1: Traditional Server Deployment

#### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v20.x
npm --version   # Should be 10.x

# Install PM2 globally
sudo npm install -g pm2

# Install build tools
sudo apt install -y build-essential
```

#### Step 2: Install MySQL

```bash
# Install MySQL 8.0
sudo apt install -y mysql-server

# Secure installation
sudo mysql_secure_installation

# Create database
sudo mysql -u root -p
```

```sql
CREATE DATABASE cdbl_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cdbl_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON cdbl_lms.* TO 'cdbl_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Step 3: Deploy Application

```bash
# Create app directory
sudo mkdir -p /var/www/cdbl-lms
sudo chown -R $USER:$USER /var/www/cdbl-lms

# Navigate to directory
cd /var/www/cdbl-lms

# Clone repository (or upload files)
git clone https://github.com/yourorg/cdbl-lms.git .

# Or use rsync to upload
# rsync -avz --delete ./dist/ user@server:/var/www/cdbl-lms/

# Install dependencies
npm ci --production

# Copy environment file
cp .env.example .env
nano .env  # Edit with production values
```

#### Step 4: Build Application

```bash
# Run production build
npm run build

# Verify build
ls -la .next/
```

#### Step 5: Run Database Migrations

```bash
# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Verify migration
npx prisma db pull
```

#### Step 6: Start Application with PM2

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'cdbl-lms',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/cdbl-lms',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/cdbl-lms/error.log',
    out_file: '/var/log/cdbl-lms/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

```bash
# Create log directory
sudo mkdir -p /var/log/cdbl-lms
sudo chown -R $USER:$USER /var/log/cdbl-lms

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command shown

# Verify status
pm2 status
pm2 logs cdbl-lms
```

#### Step 7: Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/cdbl-lms
```

```nginx
upstream cdbl_lms_backend {
    least_conn;
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name lms.cdbl.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lms.cdbl.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/lms.cdbl.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lms.cdbl.com/privkey.pem;

    # SSL security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # File upload size
    client_max_body_size 10M;

    # Logging
    access_log /var/log/nginx/cdbl-lms-access.log;
    error_log /var/log/nginx/cdbl-lms-error.log;

    # Root location
    location / {
        proxy_pass http://cdbl_lms_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /_next/static/ {
        alias /var/www/cdbl-lms/.next/static/;
        expires 365d;
        access_log off;
    }

    location /public/ {
        alias /var/www/cdbl-lms/public/;
        expires 30d;
        access_log off;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/cdbl-lms /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### Step 8: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d lms.cdbl.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Option 2: Docker Deployment

#### Dockerfile

```dockerfile
# Base image
FROM node:20-alpine AS base

WORKDIR /app

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci --production

# Builder
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Runner
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mysql://cdbl_user:password@db:3306/cdbl_lms
      - JWT_SECRET=${JWT_SECRET}
      - EMAIL_HOST=${EMAIL_HOST}
      - EMAIL_PORT=${EMAIL_PORT}
      - EMAIL_USER=${EMAIL_USER}
      - EMAIL_PASSWORD=${EMAIL_PASSWORD}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=cdbl_lms
      - MYSQL_USER=cdbl_user
      - MYSQL_PASSWORD=password
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

```bash
# Build and start
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy

# View logs
docker-compose logs -f app
```

---

## Environment Configuration

### Production `.env` File

```env
# Application
NODE_ENV="production"
PORT=3000

# Database
DATABASE_URL="mysql://cdbl_user:secure_password@localhost:3306/cdbl_lms"

# JWT Authentication
JWT_SECRET="generate_random_32_character_secret_here"

# Email Configuration
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT="587"
EMAIL_USER="apikey"
EMAIL_PASSWORD="SG.xxxxxxxxxxxxx"
EMAIL_FROM="CDBL LMS <noreply@cdbl.com>"
EMAIL_SECURE="false"

# Application URLs
NEXT_PUBLIC_APP_URL="https://lms.cdbl.com"

# File Upload
UPLOAD_DIR="/var/www/cdbl-lms/private/uploads"
UPLOAD_MAX_SIZE="5242880"

# Security
ALLOWED_ORIGINS="https://lms.cdbl.com"
```

### Generate Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Database Setup

### Migration

```bash
# Deploy migrations
npx prisma migrate deploy

# Verify schema
npx prisma db pull

# Check tables
npx prisma studio
```

### Seed Initial Data

```bash
# Run seed script (if needed)
npx prisma db seed
```

### Backup Strategy

```bash
# Create backup script
sudo nano /usr/local/bin/backup-cdbl-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/cdbl-lms"
mkdir -p $BACKUP_DIR

mysqldump -u cdbl_user -p'password' cdbl_lms \
  | gzip > $BACKUP_DIR/cdbl_lms_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: cdbl_lms_$DATE.sql.gz"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-cdbl-db.sh

# Add to cron (daily at 2 AM)
sudo crontab -e
```

```
0 2 * * * /usr/local/bin/backup-cdbl-db.sh >> /var/log/cdbl-backup.log 2>&1
```

---

## Post-Deployment Verification

### Health Checks

```bash
# Check application status
pm2 status

# Check application logs
pm2 logs cdbl-lms --lines 100

# Test HTTP endpoint
curl http://localhost:3000/api/health

# Test HTTPS endpoint
curl https://lms.cdbl.com/
```

### Functional Testing

- [ ] Login with test account
- [ ] Verify 2FA works
- [ ] Create leave request
- [ ] Approve leave request (admin account)
- [ ] Check email notifications
- [ ] View dashboards
- [ ] Check audit logs
- [ ] Test file upload
- [ ] Verify mobile responsiveness

### Performance Testing

```bash
# Install Apache Bench
sudo apt install -y apache2-utils

# Test performance (100 requests, 10 concurrent)
ab -n 100 -c 10 https://lms.cdbl.com/

# Expected: < 500ms average response time
```

---

## Rollback Procedures

### Quick Rollback

```bash
# Stop current version
pm2 stop cdbl-lms

# Navigate to app directory
cd /var/www/cdbl-lms

# Checkout previous version
git checkout v1.9.0

# Reinstall dependencies
npm ci --production

# Rebuild
npm run build

# Restart
pm2 restart cdbl-lms
```

### Database Rollback

```bash
# Restore from backup
gunzip < /var/backups/cdbl-lms/cdbl_lms_20250110_020000.sql.gz \
  | mysql -u cdbl_user -p cdbl_lms
```

---

## Monitoring

### PM2 Monitoring

```bash
# Monitor in real-time
pm2 monit

# View logs
pm2 logs cdbl-lms --lines 200 --timestamp
```

### Log Rotation

```bash
# Install PM2 logrotate
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### External Monitoring

Consider integrating:
- **Uptime Monitoring:** UptimeRobot, Pingdom
- **Error Tracking:** Sentry
- **Application Performance:** New Relic, DataDog

---

## Maintenance

### Regular Tasks

**Daily:**
- [ ] Check error logs
- [ ] Monitor disk space
- [ ] Verify backups running

**Weekly:**
- [ ] Review audit logs
- [ ] Check application performance
- [ ] Update dependencies (if needed)

**Monthly:**
- [ ] Security updates
- [ ] Database optimization
- [ ] Review monitoring metrics

### Update Procedure

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm ci --production

# Run migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Restart with zero downtime
pm2 reload cdbl-lms
```

---

**Document Version:** 2.0
**Last Updated:** January 2025
**Maintained By:** CDBL IT Team
