# Deployment Checklist

## 1. Environment Variables
- [ ] Set `DATABASE_URL` (Production DB)
- [ ] Set `JWT_SECRET` (Min 32 chars, random)
- [ ] Set `NEXT_PUBLIC_APP_URL` (e.g. https://lms.cdbl.com)
- [ ] Set `REDIS_HOST` and `REDIS_PASSWORD` (if using Redis)
- [ ] Set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (for emails)
- [ ] Set `NEXT_PUBLIC_GA_ID` (if using Google Analytics)
- [ ] Set `CRON_SECRET` (for Vercel Cron)

## 2. Database
- [ ] Run `npx prisma migrate deploy` (NOT dev)
- [ ] Seed immutable data (Policies, Holidays) if fresh install
- [ ] Verify indexes (`items_requesterId_idx`, etc.) exist

## 3. Security
- [ ] Verify `NEXT_PUBLIC_` variables do not integrity secrets
- [ ] Enable 2FA for Admin accounts (if supported)
- [ ] Verify `cors` settings in `next.config.ts` if API takes cross-origin requests

## 4. Performance
- [ ] Ensure `next.config.ts` has `swcMinify: true` (default in Next 13+) and `compress: true`
- [ ] Verify Image Optimization domains are whitelisted

## 5. Monitoring
- [ ] Configure Sentry DSN
- [ ] Setup Uptime Robot or equivalent for `/api/health`

## 6. Backup
- [ ] Schedule daily database backups (e.g. pg_dump)
- [ ] Verify backup restoration process
