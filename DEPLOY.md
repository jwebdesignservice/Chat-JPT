# Deploying ChatJPT to Netlify

This guide explains how to deploy ChatJPT with a secure API key setup.

## Why Netlify?

GitHub Pages only serves static files and cannot keep your API key secret. Netlify provides free serverless functions that run on a server, keeping your API key hidden from users.

## Steps to Deploy

### 1. Create a Netlify Account
- Go to [netlify.com](https://netlify.com)
- Sign up with your GitHub account

### 2. Import Your Repository
- Click "Add new site" → "Import an existing project"
- Choose GitHub and select your `Chat-JPT` repository
- Leave build settings as default (no build command needed)
- Click "Deploy site"

### 3. Add Your API Key
- Go to **Site settings** → **Environment variables**
- Click "Add a variable"
- Set:
  - **Key**: `OPENAI_API_KEY`
  - **Value**: Your OpenAI API key (e.g., `sk-proj-xxx...`)
- Click "Save"

### 4. Redeploy
- Go to **Deploys** tab
- Click "Trigger deploy" → "Deploy site"

### 5. Done!
Your site will be live at `https://your-site-name.netlify.app`

The API key is stored securely on Netlify's servers and is never exposed to users.

## How It Works

1. User sends a chat message
2. JavaScript calls `/.netlify/functions/openai`
3. The serverless function (running on Netlify's server) adds your API key and forwards the request to OpenAI
4. OpenAI responds, and the function sends the response back to the user
5. Your API key never leaves the server

## Updating Your Site

Just push changes to GitHub - Netlify automatically redeploys.

## Custom Domain (Optional)

In Netlify, go to **Domain settings** to add your own domain.
