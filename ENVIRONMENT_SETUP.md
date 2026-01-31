# Development Environment Migration & Setup Guide

This guide outlines the steps to switch development between devices (e.g., MacBook to Desktop) for the CDBL Leave Management System.

## 1. Moving the Code
The source code is managed via **Git**.
- **On Source Machine (e.g., Mac):** Ensure all changes are committed and pushed to the remote repository.
  ```bash
  git add .
  git commit -m "Save work before switching devices"
  git push origin main
  ```
- **On Target Machine (e.g., Desktop):** Clone the repository or pull the latest changes.
  ```bash
  git pull origin main
  ```

## 2. Database Consistency
Your database state depends on your `DATABASE_URL` in `.env`.

### Scenario A: Local Database (Default)
If `DATABASE_URL` points to `localhost` (e.g., `mysql://root:password@localhost:3306/...`):
- **Status:** The database is **UNIQUE** to each machine. Your Desktop starts with an empty database.
- **Action:**
  1.  **Fresh Start (Recommended):** Run migration to create tables.
      ```bash
      npx prisma db push
      ```
      *This gives you a working app with no data.*
  2.  **Clone Data (Optional):** Export data from Mac (`mysqldump`) and import into Desktop's MySQL server.

### Scenario B: Cloud Database
If `DATABASE_URL` points to a remote server (e.g., PlanetScale, Railway, AWS):
- **Status:** Both machines share the **SAME** data.
- **Action:** No extra steps needed. Changes on one machine appear on the other immediately.

## 3. Environment Variables
Sensitive files are **ignored by Git** and must be moved manually.
- **File:** `.env`
- **Action:** Securely transfer your `.env` file from Mac to the project root on your Desktop.

## 4. Web App Setup (Next.js)
1.  **Prerequisites:** Install Node.js (v18+) and pnpm.
2.  **Install Dependencies:**
    ```bash
    pnpm install
    ```
3.  **Generate Client:**
    ```bash
    npx prisma generate
    ```
4.  **Start Server:**
    ```bash
    pnpm dev
    ```
    *App runs at `http://localhost:3000`*

## 5. Android App Setup
1.  **Install Application:** Download and install **Android Studio**.
2.  **Open Project:** Open the `mobile/android` directory in Android Studio.
3.  **SDK Configuration (`local.properties`):**
    - This file identifies the location of the Android SDK on the specific machine.
    - Android Studio usually generates this automatically. If missing, create it in `mobile/android/`:
    ```properties
    # Windows Example
    sdk.dir=C\:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
    
    # Mac Example
    sdk.dir=/Users/YourName/Library/Android/sdk
    ```
4.  **Firebase Config (`google-services.json`):**
    - This file is often git-ignored.
    - **Action:** Copy `mobile/android/app/google-services.json` manually from Mac to the same folder on Desktop.

## 6. Network Configuration (Connecting App to Backend)
The Android app needs to talk to your locally running Next.js backend (`localhost:3000`).

### Using Android Emulator
- The Emulator sees your computer's localhost as `10.0.2.2`.
- **Config:** Update your Android Base URL (usually in `build.gradle` or a constant file) to `http://10.0.2.2:3000/api/`.

### Using Physical Device
- Your phone and computer must be on the **same Wi-Fi**.
- **Step 1:** Find your Desktop's Local IP (e.g., Run `ipconfig` on Windows or `ifconfig` on Mac/Linux -> look for `192.168.x.x`).
- **Config:** Update your Android Base URL to `http://192.168.1.x:3000/api/`.
