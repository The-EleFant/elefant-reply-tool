[README.md](https://github.com/user-attachments/files/28867227/README.md)
# theEleFant Response Generator — Deployment Guide

## Live in 10 minutes on Vercel (free)

### Step 1 — Create a GitHub account (if you don't have one)
Go to github.com → Sign up (free)

### Step 2 — Upload these files to a new GitHub repository
1. Go to github.com → click the green **New** button
2. Name it: `elefant-reply-tool`
3. Make it **Public** → click **Create repository**
4. Click **uploading an existing file**
5. Upload these files maintaining the folder structure:
   - `vercel.json`
   - `api/generate.js`
   - `public/index.html`
6. Click **Commit changes**

### Step 3 — Deploy to Vercel (free)
1. Go to **vercel.com** → Sign up with your GitHub account
2. Click **Add New Project**
3. Select `elefant-reply-tool` from your repos
4. Click **Deploy** (Vercel auto-detects the config)

### Step 4 — Add your Anthropic API Key
1. In Vercel dashboard → your project → **Settings** → **Environment Variables**
2. Add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your key from console.anthropic.com
3. Click **Save** → then **Redeploy** (Deployments tab → 3 dots → Redeploy)

### Step 5 — Get your live link
Vercel gives you a URL like:
`https://elefant-reply-tool.vercel.app`

Share this link with Sahiba, Aman, and anyone on the team.
No login needed. Works on mobile too.

---

## Getting your Anthropic API Key
1. Go to console.anthropic.com
2. Sign up / Log in
3. Click **API Keys** in the left menu
4. Click **Create Key** → copy it
5. Paste it into Vercel environment variables (Step 4 above)

Note: API usage costs roughly $0.003 per response generated (~₹0.25).
For 100 responses/day that's about ₹750/month.

---

## Updating the tool
Any changes pushed to GitHub auto-deploy to Vercel within 30 seconds.
