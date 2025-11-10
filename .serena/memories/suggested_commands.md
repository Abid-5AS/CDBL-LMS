# CDBL Leave Management System - Suggested Commands

## Development Commands

### Daily Development
```bash
# Start development server (with Turbopack)
pnpm dev

# Install new dependencies
pnpm add <package-name>
pnpm add -D <dev-package-name>

# Run linting
pnpm lint

# Type checking (manual)
pnpm tsc --noEmit
```

### Database Operations
```bash
# Generate Prisma client (after schema changes)
pnpm prisma generate

# Create and apply migrations
pnpm prisma migrate dev --name <migration-name>

# Seed database with demo data
pnpm prisma:seed

# Reset database (development only)
pnpm prisma migrate reset

# View database in Prisma Studio
pnpm prisma studio
```

### Testing & Quality Assurance
```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests only
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Policy compliance audit
pnpm policy:audit

# Verify demo data integrity
pnpm verify:demo

# Verify deployment readiness
pnpm verify:deployment
```

### Build & Deployment
```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Preview production build locally
pnpm build && pnpm start
```

### Maintenance & Jobs
```bash
# Run job scheduler
pnpm jobs:scheduler

# Run earned leave accrual job
pnpm jobs:el-accrual

# Run casual leave auto-lapse job
pnpm jobs:cl-lapse
```

## Git Workflow Commands

### Standard Git Operations
```bash
# Check status and current changes
git status

# View file differences
git diff
git diff --staged

# Stage and commit changes
git add .
git commit -m "feat: description of changes"

# Push changes
git push origin <branch-name>

# Pull latest changes
git pull origin main
```

### Branch Management
```bash
# Create and switch to feature branch
git checkout -b feature/feature-name

# Switch branches
git checkout <branch-name>

# List branches
git branch -a

# Delete local branch
git branch -d <branch-name>
```

## System Commands (macOS)

### File Operations
```bash
# List files with details
ls -la

# Find files by name
find . -name "*.tsx" -type f

# Search in files (content)
grep -r "search-term" .
grep -r "search-term" --include="*.ts" --include="*.tsx" .

# Directory navigation
cd <directory>
pwd
```

### Process & System Information
```bash
# Check port usage
lsof -i :3000

# Kill process by port
kill -9 $(lsof -t -i:3000)

# System information
uname -a
node --version
npm --version
```

## Component & Code Generation

### Creating New Components
```bash
# Add shadcn/ui component
npx shadcn@latest add <component-name>

# Add KokonutUI component (if needed)
pnpm dlx shadcn@latest add @kokonutui/<component-name>
```

### Code Quality Tools
```bash
# Format code (if prettier configured)
npx prettier --write .

# Fix ESLint issues
pnpm lint --fix

# Check TypeScript errors across project
pnpm tsc --noEmit --pretty
```

## Debugging & Monitoring

### Development Debugging
```bash
# View detailed build output
NEXT_TELEMETRY_DEBUG=1 pnpm dev

# Analyze bundle size
pnpm build --analyze

# Check dependency tree
pnpm ls --depth=0
```

### Database Debugging
```bash
# View Prisma query logs
DEBUG="prisma:query" pnpm dev

# Check database connection
pnpm prisma db pull --force
```

## Documentation Commands

### Generate/Update Documentation
```bash
# View project structure
tree -I 'node_modules|.next|.git' -L 3

# Generate API documentation (if tooling exists)
# [Custom tooling would go here]

# Count lines of code
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | xargs wc -l
```