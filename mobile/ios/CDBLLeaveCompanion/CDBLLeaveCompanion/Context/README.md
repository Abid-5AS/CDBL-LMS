# Context Directory

This directory contains reference documentation and context files to help ChatGPT in Xcode understand:

1. **Web App Implementation**: Reference files from the Next.js web app
2. **Design System**: Design tokens, colors, spacing from web app
3. **Validation Rules**: Exact validation logic and error messages
4. **Database Schema**: Prisma schema for data model alignment
5. **Implementation Tasks**: Complete checklist of all 17 tasks

## Files in this Directory

### GPT_PROMPT.md
**USE THIS FIRST**: Copy the prompt from this file into Xcode's AI assistant to start the review and fix process.

### WEB_APP_REFERENCE.md
Comprehensive guide to web app features, validation rules, design patterns, and consistency requirements.

### prisma-schema.prisma
Complete Prisma database schema. iOS app's LeaveRequest model must match this exactly.

### web-form-reference.tsx
Reference copy of the web app's leave form component. Use to ensure iOS form matches web implementation.

### web-form-validation-rules.md
Exact validation rules and error messages used in web app. iOS app must use the same wording.

### web-app-design-tokens.md
Color system, spacing scale, typography, and component styling from web app. Use for visual consistency.

### IMPLEMENTATION_TASKS.md
Complete checklist of all 17 implementation tasks with status tracking.

## How to Use with Xcode AI

1. Open `GPT_PROMPT.md` and copy the prompt
2. Paste into Xcode's AI assistant (Cmd+L or AI panel)
3. The AI will reference these context files automatically
4. The AI will check all files against web app consistency and fix iOS 26 availability issues

## Key Consistency Points

- **Leave Types**: Only CASUAL, MEDICAL, EARNED (matching web form)
- **Validation**: Same rules as web (10 char reason, certificate for MEDICAL >3 days)
- **Error Messages**: Exact same wording as web app
- **Status Flow**: DRAFT → SUBMITTED → PENDING → APPROVED/REJECTED
- **Spacing**: 24pt = gap-6, 16pt = gap-4, 12pt = rounded-xl
- **Colors**: Use system adaptive colors that approximate web oklch colors

## Critical Fixes Needed

1. **iOS 26 Availability Guards**: All `.backgroundExtensionEffect()` calls need `if #available(iOS 26.0, *)` guards
2. **Web App Consistency**: Match validation rules, error messages, and styling
3. **Error Handling**: Ensure proper nil handling and error cases throughout

