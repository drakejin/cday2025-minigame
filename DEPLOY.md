# 🚀 Deployment Guide

## Quick Deploy (5분)

### 1. Setup .env
```bash
cp .env.example .env
# Edit .env and fill in your Supabase credentials
```

Required variables:
- `VITE_SUPABASE_URL` - Supabase Dashboard > Settings > API
- `VITE_SUPABASE_ANON_KEY` - Settings > API > anon key
- `VITE_SUPABASE_ACCESS_TOKEN` - Settings > API > service_role key
- `SUPABASE_PROJECT_REF` - Settings > General > Reference ID

### 2. One-Command Deploy
```bash
./deploy.sh
```

This script will:
1. ✅ Run code quality checks
2. ✅ Deploy 27 Edge Functions to Supabase
3. ✅ Deploy frontend to Vercel
4. ✅ Show deployment summary

### 3. Post-Deployment
After successful deployment:

**Create Super Admin:**
```sql
-- Run in Supabase SQL Editor
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'your-email@example.com';
```

**Create First Round:**
1. Visit `https://your-app.vercel.app/admin`
2. Go to Rounds > Create Round
3. Start the round

---

## Manual Deployment

### Edge Functions Only
```bash
./deploy-edge-functions.sh
```

### Frontend Only (Vercel)
```bash
vercel login
vercel
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel --prod
```

---

## Troubleshooting

### Vercel login required
```bash
vercel login
```

### Edge Functions deployment failed
```bash
export SUPABASE_ACCESS_TOKEN=$VITE_SUPABASE_ACCESS_TOKEN
supabase link --project-ref your-project-ref
./deploy-edge-functions.sh
```

---

## 📚 Detailed Documentation

- [CLAUDE.md](./CLAUDE.md) - Complete setup guide
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Detailed deployment checklist
- [docs/DEPLOY_QUICK_START.md](./docs/DEPLOY_QUICK_START.md) - Quick start guide
