

# Cursor ↔ ChatGPT (GPT-5) Collaboration Prompts  
> For the **CDBL Leave Management System (Policy v2.0)** project

These prompt templates ensure consistency when using Cursor with ChatGPT to apply HR policy logic accurately.

---

## 1️⃣ Policy-Aware Implementation
> **Prompt Template:**
> 
> Read `/docs/Policy Logic/[file-name].md` before coding.  
> Summarize the relevant rules and clauses you’ll implement, list affected files, then propose a minimal diff plan with tests.  
> Enforce Asia/Dhaka timezone normalization, per-type approval chains, and the error codes defined in `/lib/errors.ts`.

**Use When:** Implementing new endpoints, validations, or background jobs.

---

## 2️⃣ Endpoint Development
> **Prompt Template:**
>
> Implement the `[ENDPOINT_NAME]` API route according to `/docs/Policy Logic/[file-name].md (section [x.y])`.  
> Add all required validation (start/end holiday/weekend, backdate window, CL edge cases, medical/fitness certificate checks).  
> Map errors to `/lib/errors.ts` and add integration tests. Include a short change log in the associated policy doc.

**Use When:** Building or refactoring any route inside `/app/api/leaves/[id]/`.

---

## 3️⃣ Validation Fix
> **Prompt Template:**
>
> Fix failing cases in `[module or test name]`.  
> Ensure functions like `countWorkingDays()`, `touchesHolidayOrWeekendOnSides()`, or `validateStartEndDates()` behave per `/docs/Policy Logic/03-Holiday and Weekend Handling.md`.  
> Verify that EL notice and CL restrictions reflect the correct working-day logic and holiday exclusions.

**Use When:** Adjusting date, weekend, or holiday calculations.

---

## 4️⃣ Uploads & Certificates
> **Prompt Template:**
>
> Implement the secure upload flow (`/api/leaves/[id]/certificate`).  
> Validate MIME type (PDF/JPEG/PNG), max size 5 MB, save under `/private/uploads/`, and return a signed URL via `lib/storage.ts`.  
> For ML > 7 days, require a fitness certificate before return.  
> Update schema, add audit log entries, and tests.

**Use When:** Modifying file upload, return-to-duty, or storage features.

---

## 5️⃣ Refactor & Test
> **Prompt Template:**
>
> Refactor `[module]` into pure reusable functions in `/lib/**`.  
> Add tests ensuring parity with `/docs/Policy Logic/`.  
> Keep existing behavior unless explicitly contradicted by v2.0 rules.  
> Include updated error mapping and test coverage notes.

**Use When:** Cleaning up legacy logic, consolidating functions, or adding new helpers.

---

## 6️⃣ AI-Review Before Merge
> **Prompt Template:**
>
> Review all commits under `feature/policy-v2.0`.  
> Cross-check each changed file against its policy doc.  
> Verify time zone, EL notice, CL weekend rules, certificate logic, approval chain, and error codes.  
> Output a compliance checklist showing ✅/⚠️/❌ status per file.

**Use When:** Performing a pre-merge audit or release readiness review.

---

### 💡 Tip
Include the clause number from the relevant `/docs/Policy Logic/` file in your commit messages (e.g., `policy(v2): implement 6.11 advance notice (≥5 working days)`).
