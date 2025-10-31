# Tasks: Next.js 16 Upgrade & MCP Integration

## Objective

Upgrade the CDBL Leave Management system to Next.js 16 with Turbopack, enable cache components, and integrate MCP (Model Context Protocol) servers for enhanced development workflow.

## Steps

### 1. Next.js 16 Upgrade
- [x] Update `package.json` to Next.js 16.0.0
- [x] Enable Turbopack in `next.config.ts`
- [x] Configure `cacheComponents: true` in Next.js config
- [x] Update React to 19.2.0 (required for Next.js 16)
- [ ] Review and update all API routes to use `export const cache = "no-store"` pattern
- [ ] Replace any deprecated Next.js 15 patterns

### 2. MCP Server Setup
- [x] Install `next-devtools-mcp` package
- [x] Create `.cursor/config.json` with MCP server configuration
- [x] Configure `next-devtools` MCP server
- [x] Configure `codex` MCP server for task execution
- [ ] Verify MCP servers are accessible in Cursor IDE

### 3. Configuration Files
- [x] Create `.cursor/rules.md` with coding conventions
- [x] Create `.cursor/onboarding.md` with project overview
- [x] Set up task file structure in `tasks/` directory

### 4. Testing & Validation
- [ ] Run `pnpm dev` and verify Turbopack is working
- [ ] Test cache components functionality
- [ ] Verify MCP integration in Cursor IDE
- [ ] Check for any console warnings or errors

## Notes

- Ensure all routes use proper Next.js 16 patterns
- Maintain backward compatibility during upgrade
- Document any breaking changes

