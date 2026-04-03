# ID Card - Registration & Management

A premium Next.js 14 application for collecting ID card details (Name, Phone, and Compressed Photo). 

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

- **Framework**: Next.js 14 (App Router)
- **Database & Storage**: Supabase (PostgreSQL + S3 Storage)
- **Styling**: Vanilla CSS (Custom Glassmorphism Design System)
- **Utilities**: JSZip, XLSX, Browser Image Compression

## 🛠️ Setup

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Supabase Config**:
   - Create a table `submissions` with columns: `id`, `name`, `phone`, `photoUrl`, `submittedAt`.
   - Create a public storage bucket named `photos`.

3. **Environment**:
   Create a `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Run**:
   ```bash
   npm run dev
   ```

## 📦 Deployment

This app is ready to be deployed on **Vercel**. Simply import the repository and add your environment variables.
