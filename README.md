# ID Registration Form

A Next.js app for collecting employee details (name, phone, photo) via a mobile-friendly form, with a PC admin dashboard and Excel export. Photos are stored in Cloudflare R2, submission data in a `submissions.json` file also in R2.

## Routes

| Route | Purpose |
|---|---|
| `/` | Mobile form — share this link with employees |
| `/admin` | PC dashboard — view all entries, search, download Excel |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create Cloudflare R2 bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → R2
2. Create a bucket (e.g. `id-submissions`)
3. Enable **Public Access** on the bucket (so photo URLs work) OR set up a custom domain
4. Go to **Manage R2 API Tokens** → Create token with `Object Read & Write` on your bucket
5. Note down: Account ID, Access Key ID, Secret Access Key

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret
R2_BUCKET_NAME=id-submissions
R2_PUBLIC_URL=https://pub-xxxx.r2.dev   # from R2 bucket public URL settings
```

### 4. Run locally

```bash
npm run dev
```

Open `http://localhost:3000` on your phone (or use ngrok to share on LAN).

### 5. Deploy to Vercel

```bash
npx vercel
```

Add the same env variables in Vercel → Project Settings → Environment Variables.

## How it works

1. Employee opens `yourapp.vercel.app` on phone
2. They fill name, phone, upload photo
3. Photo is uploaded directly to R2 via presigned URL (no passing through your server)
4. Submission entry (name, phone, photo URL, timestamp) is saved to `submissions.json` in R2
5. You open `yourapp.vercel.app/admin`, see all entries, click **Download Excel**

## Excel output columns

| Name | Phone Number | Photo URL | Submitted At |
|---|---|---|---|
| Ayush Kumar | +91 98765 43210 | https://pub-xxx.r2.dev/photos/... | 3 Apr 2026, 10:30 AM |
