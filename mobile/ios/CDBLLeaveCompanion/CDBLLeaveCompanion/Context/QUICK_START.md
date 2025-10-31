# Quick Start Guide for Xcode AI Assistant

## Step 1: Open the Prompt
1. Open `GPT_PROMPT.md` in this directory
2. Copy the entire prompt (from line 7 onwards)
3. Paste into Xcode's AI assistant (Cmd+L or open AI panel)

## Step 2: Let GPT Review
The AI will:
1. Read all Context/ files to understand requirements
2. Check all implementation files
3. Fix iOS 26 availability guards (CRITICAL)
4. Verify web app consistency
5. Report any errors or missing implementations

## Step 3: Review Changes
GPT will fix:
- iOS 26 availability guards in RootView.swift and SidebarView.swift
- Any compilation errors
- Web app consistency issues
- Missing imports or dependencies

## What GPT Has Access To

All context files in this directory:
- **WEB_APP_REFERENCE.md** - Full web app feature reference
- **web-form-reference.tsx** - Web form component code
- **prisma-schema.prisma** - Database schema
- **web-form-validation-rules.md** - Validation rules and error messages
- **web-app-design-tokens.md** - Design tokens and styling
- **IMPLEMENTATION_TASKS.md** - All 17 tasks checklist
- **FILES_CHECKLIST.md** - Files to verify

## Expected Output from GPT

1. ✅ Fixed iOS 26 availability guards
2. ✅ Web app consistency improvements applied
3. ✅ All compilation errors resolved
4. ✅ Verification report of all 17 tasks
5. ✅ Final confirmation: "All tasks complete and errors fixed"

## If GPT Finds Issues

It will provide:
- Specific file locations and line numbers
- Exact code fixes needed
- Explanations for changes
- Verification of fixes

