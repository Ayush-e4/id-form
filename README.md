# ID Card - Registration & Management

A Next.js 15 application for collecting ID card details, uploading compressed photos, and managing submissions from an admin dashboard.

## ✨ Features

- **Responsive Mobile Form**: Optimized for field data collection.
- **Dual Capture**: Direct Camera support + Gallery upload.
- **Smart Compression**: All images are automatically compressed to < 2MB in the browser.
- **Admin Dashboard**: Glassmorphic UI to view, search, and manage entries.
- **Bulk Export**: 
  - Download all data as a formatted **Excel** sheet.
  - Download all photos as a **ZIP** archive (named by phone number).
- **Lightbox**: WhatsApp-style full-screen image preview.

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database & Storage**: Supabase (PostgreSQL + S3 Storage)
- **Styling**: Vanilla CSS (Custom Glassmorphism Design System)
- **Utilities**: JSZip, XLSX, Browser Image Compression

## 🛠️ Setup

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Supabase Config**:
   - Create a table `submissions` with columns:
     `id`, `name`, `phone`, `photoUrl`, `submittedAt`, `type`,
     `fathersName`, `mothersName`, `class`, `dob`, `address`,
     `rollNo`, `admissionNo`, `height`, `weight`, `bloodGroup`, `houseName`.
   - Create a public storage bucket named `photos`.
   - You can run the SQL in `supabase/submissions_schema.sql` to create or update the table.

3. **Environment**:
   Create a `.env.local` with your production credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ADMIN_PASSWORD=your_admin_password
   ADMIN_SESSION_SECRET=long_random_session_secret
   ```

   Notes:
   - `ADMIN_SESSION_SECRET` should be different from `ADMIN_PASSWORD`.
   - Image previews in the admin dashboard are limited to your configured Supabase host plus localhost test hosts.

4. **Run**:
   ```bash
   npm run dev
   ```

## 📦 Deployment

This app is ready to be deployed on **Vercel**. Simply import the repository and add your environment variables.
