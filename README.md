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

2. **Supabase CLI**:
   - This repo already contains a Supabase project in [`supabase/`](/Users/ayush/Desktop/id-form/supabase).
   - Make sure Docker Desktop is running before using local Supabase commands.
   - Start the local stack with:
     ```bash
     npm run supabase:start
     ```
   - Check the generated local credentials with:
     ```bash
     npm run supabase:status
     ```
   - Reset the local database from migrations when needed:
     ```bash
     npm run supabase:db:reset
     ```

3. **Connect The CLI To Your Hosted Project**:
   - Log in once:
     ```bash
     supabase login
     ```
   - Link this repo to your hosted Supabase project:
     ```bash
     npm run supabase:link -- --project-ref your_project_ref
     ```
   - Push local migrations to the linked project:
     ```bash
     npm run supabase:db:push
     ```
   - You can inspect local vs remote migration history with:
     ```bash
     npm run supabase:migrations
     ```

4. **Hosted Supabase Project Setup**:
   - Create a public storage bucket named `photos`.
   - The database schema lives in `supabase/migrations/`. `supabase/submissions_schema.sql` is kept as a reference snapshot for manual inspection.

5. **Environment**:
   Create a `.env.local` with your production credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ADMIN_PASSWORD=your_admin_password
   ADMIN_SESSION_SECRET=long_random_session_secret
   ```

   Notes:
   - `ADMIN_SESSION_SECRET` should be different from `ADMIN_PASSWORD`.
   - For local Supabase CLI development, set `NEXT_PUBLIC_SUPABASE_URL` to `http://127.0.0.1:54321` and use the `service_role` key shown by `npm run supabase:status`.
   - Image previews in the admin dashboard are limited to your configured Supabase host plus localhost test hosts.

6. **Run**:
   ```bash
   npm run dev
   ```

## 📦 Deployment

This app is ready to be deployed on **Vercel**. Simply import the repository and add your environment variables.
