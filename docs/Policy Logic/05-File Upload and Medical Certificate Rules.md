# 🏛️ CDBL Leave Management – Policy & Logic Reference

> **Change Log & Engineering Tasks (applied today)**
> 1) **ML > 3 days validation:** Confirmed as per Policy 6.21 — medical certificate mandatory if leave exceeds 3 working days.
> 2) **Fitness certificate on return:** Added check for ML > 7 days before marking `RETURNED_TO_DUTY`.
> 3) **API endpoints:**  
>    - `POST /api/leaves/[id]/certificate` — upload medical/fitness certificate.  
>    - `PATCH /api/leaves/[id]/return` — validate and mark duty return with fitness certificate.
> 4) **Error handling:** Added new error codes:
>    - `fitness_certificate_required`
>    - `certificate_invalid_type`
> 5) **Audit tracking:** Added `UPLOAD_CERTIFICATE` and `RETURN_TO_DUTY` entries to audit logs.
> 6) **Frontend:**  
>    - Show “Fitness Certificate Required” banner for ML > 7 days on return flow.  
>    - Display uploaded certificates as downloadable links in leave details.
> 7) **Security improvement:** Validate MIME type using `file-type` library before saving.
> 8) **Storage migration:** Move certificate uploads from `/public/uploads/` to `/private/uploads/` with signed URL access.
> 9) **Engineering tasks summary:**
>    - Create `/api/leaves/[id]/certificate` handler with MIME + size validation.  
>    - Add `fitnessCertificateUrl` field in schema.  
>    - Extend audit model.  
>    - Add signed URL generation via `lib/storage.ts`.  
>    - Add integration tests for both upload and return flows.

## Part 5: File Upload & Medical Certificate Rules

This document summarizes all rules related to file uploads, medical certificates, and document attachments.

---

## 1. Medical Certificate Requirement

### Trigger Condition
- **Leave Type**: `MEDICAL` (Medical Leave / Sick Leave)
- **Duration Threshold**: > 3 days
- **Rule**: If `workingDays > 3`, medical certificate is **required**

### Implementation
- **Function**: `needsMedicalCertificate(type, days)`
- **Location**: `lib/policy.ts` (lines 21-23)
- **Logic**:
  ```typescript
  return String(type) === "MEDICAL" && days > 3;
  ```

### Enforcement
- **Level**: Hard block (prevents submission)
- **Location**: `app/api/leaves/route.ts` lines 194-201
- **Order**: Checked **before** backdate validation
- **Error Code**: `medical_certificate_required`
- **Error Response**:
  ```json
  {
    "error": "medical_certificate_required",
    "days": <requestedDays>,
    "requiredDays": 3
  }
  ```

### Certificate Flag
- **Field**: `needsCertificate: Boolean` in `LeaveRequest`
- **Set Automatically**: When `workingDays > 3` for MEDICAL leave
- **Manual Override**: Can be set by user if uploading certificate

### Fitness Certificate (Return-to-Duty)
- **Trigger Condition**: MEDICAL leave where `workingDays > 7`.
- **Policy Reference**: Section 6.14 — “Medical leave over 7 days requires fitness certificate on return.”
- **Implementation:**
  - Endpoint: `PATCH /api/leaves/[id]/return`
  - Validation: Reject if `fitnessCertificateUrl` is `null`.
  - Error Code: `fitness_certificate_required`
  - Error Response:
    ```json
    { "error": "fitness_certificate_required", "requiredForDays": 7 }
    ```
- **Audit Entry:** `RETURN_TO_DUTY`
- **UI:** Show upload prompt in “Return to Duty” form.

---

## 2. File Upload Validation

### Allowed File Types
- **Extensions**: `.pdf`, `.jpg`, `.jpeg`, `.png`
- **Case Insensitive**: Extensions are converted to lowercase
- **Enforcement**: Hard validation
- **Error Code**: `unsupported_file_type`
- **Error Message**: "Unsupported file type. Use PDF, JPG, or PNG."
- **Location**: `app/api/leaves/route.ts` lines 146-150

### File Size Limit
- **Maximum Size**: 5 MB (5,242,880 bytes)
- **Calculation**: `5 * 1024 * 1024`
- **Enforcement**: Hard validation
- **Error Code**: `file_too_large`
- **Error Message**: "File too large (max 5 MB)."
- **Location**: `app/api/leaves/route.ts` line 151-153

### MIME Type Validation (Added)
- **Library**: `file-type`
- **Validation**: Detect real MIME type from file buffer.
- **Allowed Types**: `application/pdf`, `image/jpeg`, `image/png`
- **Error Code**: `certificate_invalid_type`
- **Error Message**: "File content type not allowed (PDF, JPG, PNG only)."
- **Implementation**: Inside `POST /api/leaves/[id]/certificate`

### Validation Logic
```typescript
const ext = (certificateFile.name.split(".").pop() ?? "").toLowerCase();
const allowed = ["pdf", "jpg", "jpeg", "png"];
if (!allowed.includes(ext)) {
  return NextResponse.json({ error: "unsupported_file_type" }, { status: 400 });
}
if (certificateFile.size > 5 * 1024 * 1024) {
  return NextResponse.json({ error: "file_too_large" }, { status: 400 });
}
```

---

## 3. File Storage

### Upload Directory
- **Path**: `private/uploads/` (secured, not directly web-accessible)
- **Creation**: Auto-created if missing (`recursive: true`)
- **Location**: `app/api/leaves/route.ts` line 158

### File Naming
- **Format**: `{UUID}-{sanitized-original-name}`
- **Sanitization**: Replaces non-word characters with underscore
- **Logic**:
  ```typescript
  const safeName = certificateFile.name.replace(/[^\w.\-]/g, "_");
  const finalName = `${randomUUID()}-${safeName}`;
  ```

### Storage Path
- **Relative URL**: `/api/files/signed/{finalName}`
- **Database Field**: `certificateUrl: String?` in `LeaveRequest`
- **Example**: `/api/files/signed/a1b2c3d4-medical-cert.pdf`

---

## 4. Frontend File Upload

### File Input Component
- **Location**: `app/leaves/apply/_components/apply-leave-form.tsx`
- **Component**: `FileUploadSection` (imported)
- **Trigger**: Shown when `requiresCertificate === true` OR `showOptionalUpload === true`

### File Validation (Client-Side)

**File Type Check**:
- **Regex**: `ACCEPTED_FILE_REGEX` (matches `.pdf`, `.jpg`, `.jpeg`, `.png`)
- **Error Message**: "Unsupported file type. Use PDF, JPG, or PNG."
- **Location**: `app/leaves/apply/_components/apply-leave-form.tsx` (referenced in mobile app context)

**File Size Check**:
- **Constant**: `MAX_FILE_SIZE` (5 MB)
- **Error Message**: "File too large (max 5 MB)."
- **Location**: Mobile app reference: `mobile/ios/.../web-form-validation-rules.md`

### Error Handling
- **Error State**: Stored in `errors.file`
- **Display**: Red error message below file input
- **Toast**: Shows error via `toast.error()`
- **Location**: `app/leaves/apply/_components/apply-leave-form.tsx` line 176-179

---

## 5. Conditional Upload Display

### When Certificate is Required
- **Condition**: `type === "MEDICAL" && requestedDays > 3`
- **Display**: File upload section with required indicator (`*`)
- **Behavior**: Form cannot submit without file

### Optional Upload
- **Trigger**: User clicks "Add supporting document (optional)"
- **State**: `showOptionalUpload === true`
- **Location**: `app/leaves/apply/_components/apply-leave-form.tsx` lines 459-467

### File Clear/Reset
- **Action**: User can remove selected file
- **Function**: `resetFile()` clears file state and input value
- **Location**: Referenced in mobile app context

---

## 6. Form Data Submission

### Multipart Form Data
- **Content-Type**: `multipart/form-data` (when file is included)
- **Extraction**: Uses `req.formData()`
- **Location**: `app/api/leaves/route.ts` lines 114-132

### JSON Submission
- **Content-Type**: `application/json` (when no file)
- **Location**: `app/api/leaves/route.ts` lines 134-136

### File Handling
- **Extraction**: `formData.get("certificate")` as `File` instance
- **Check**: `formData.get("certificate") instanceof File`
- **Location**: `app/api/leaves/route.ts` line 131

---

## 7. Database Schema

### LeaveRequest Model
```prisma
model LeaveRequest {
  ...
  needsCertificate Boolean      @default(false)
  certificateUrl  String?      // future upload
  fitnessCertificateUrl String?   // uploaded on return-to-duty for ML > 7 days
  ...
}
```

### Field Usage
- **`needsCertificate`**: Boolean flag indicating certificate is required/expected
- **`certificateUrl`**: Relative URL path to stored file (e.g., `/uploads/uuid-filename.pdf`)
- **`fitnessCertificateUrl`**: Uploaded on return-to-duty for ML > 7 days
- **Nullable**: `certificateUrl` can be `null` if no file uploaded

---

## 8. Error Messages (Exact Text)

### Client-Side Messages
- **"Unsupported file type. Use PDF, JPG, or PNG."**
- **"File too large (max 5 MB)."**
- **"Medical certificate is required for sick leave over 3 days"**

### Server-Side Error Codes
- **`unsupported_file_type`**: Invalid file extension
- **`file_too_large`**: File exceeds 5 MB limit
- **`medical_certificate_required`**: ML > 3 days without certificate

---

## 9. Upload Flow Diagram

```
User Selects File
    ↓
Frontend Validation
    ├─ File Type Check → Error if not PDF/JPG/PNG
    └─ File Size Check → Error if > 5 MB
    ↓
Form Submission
    ├─ With File → multipart/form-data
    └─ Without File → application/json
    ↓
Backend Validation
    ├─ File Type Check (server-side)
    ├─ File Size Check (server-side)
    └─ Certificate Requirement Check (for ML > 3 days)
    ↓
File Storage
    ├─ Generate UUID
    ├─ Sanitize filename
    ├─ Save to private/uploads/
    └─ Store URL in certificateUrl field
```

---

## 10. Other Leave Types (No Certificate Required)

### Standard Leave Types
- **EARNED**: No certificate requirement
- **CASUAL**: No certificate requirement

### Special Cases (Future)
- **QUARANTINE**: Requires quarantine certificate (not fully implemented)
  - **Policy**: Certificate from Medical/Public Health Officer required
  - **Implementation**: Not found in current codebase

---

## 11. Certificate Display (Leave Details)

### Viewing Uploaded Certificate
- **Location**: Leave detail/approval views (not explicitly found in codebase)
- **Expected**: Link to `/api/files/signed/{filename}` or preview
- **Note**: File is stored in `private/uploads/` (accessed via signed URLs)

---

## 12. Source Files

- **Upload API**: `app/api/leaves/route.ts` (file handling logic, lines 144-162)
- **Frontend Form**: `app/leaves/apply/_components/apply-leave-form.tsx`
- **Policy Function**: `lib/policy.ts` - `needsMedicalCertificate()`
- **Schema**: `prisma/schema.prisma` (LeaveRequest model)
- **Validation Rules**: `mobile/ios/.../web-form-validation-rules.md` (reference)

---

## 13. Security Considerations

### File Upload Security
- **Path Traversal**: Prevented by sanitizing filename
- **File Type**: Validated by extension (consider MIME type validation for production)
- **Storage Location**: `private/uploads/` (not publicly accessible)
- **Recommendation**: Consider moving to private storage with signed URLs

### Future Enhancements
- **Virus Scanning**: Not implemented
- **MIME Type Validation**: Only extension check (could be spoofed)
- **Access Control**: Files in `private/uploads/` are accessible only via signed URLs

### Signed URL Access (New)
- **Change**: Direct public access removed; files served through signed URLs valid for 15 minutes.
- **Implementation**: `lib/storage.ts` → `generateSignedUrl(filePath)`
- **Authorization**: Only employee, HR, and management can access their own leave attachments.

---

**Next Document**: [06-Approval Workflow and Chain](./06-Approval-Workflow-and-Chain.md)
