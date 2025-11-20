# 🔐 Social Login Setup Guide

This guide explains how to enable Google and Facebook authentication for the Petskub Community platform.

---

## Google Authentication Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth Client ID**
5. Configure the consent screen:
   - Add your app name: "Petskub Community"
   - Add authorized domains: `<YOUR_PROJECT_ID>.lovable.app`
   - Add scopes: `email`, `profile`, `openid`

6. Create OAuth Client ID:
   - Application type: **Web application**
   - Authorized JavaScript origins: `https://<YOUR_PROJECT_ID>.lovable.app`
   - Authorized redirect URIs: `https://<YOUR_PROJECT_ID>.supabase.co/auth/v1/callback`

7. Copy your **Client ID** and **Client Secret**

### 2. Configure in Lovable Cloud

1. Open the Lovable Cloud dashboard (click "View Backend" in the chat)
2. Navigate to **Authentication** > **Providers**
3. Enable **Google** provider
4. Paste your Client ID and Client Secret
5. Save the configuration

---

## Facebook Authentication Setup

### 1. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** > **Create App**
3. Choose **Consumer** as the app type
4. Enter your app name: "Petskub Community"
5. Add **Facebook Login** product to your app

### 2. Configure Facebook Login

1. In the left sidebar, go to **Facebook Login** > **Settings**
2. Add valid OAuth Redirect URIs:
   ```
   https://<YOUR_PROJECT_ID>.supabase.co/auth/v1/callback
   ```
3. Save changes

### 3. Get App Credentials

1. Go to **Settings** > **Basic**
2. Copy your **App ID** and **App Secret**

### 4. Configure in Lovable Cloud

1. Open the Lovable Cloud dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable **Facebook** provider
4. Paste your App ID and App Secret
5. Save the configuration

---

## Testing Authentication

After setup:

1. Go to `/login` page
2. Click "Continue with Google" or "Continue with Facebook"
3. Complete the OAuth flow
4. You should be redirected back to the home page as a logged-in user

---

## Important Notes

⚠️ **Email Auto-Confirm**: For testing purposes, enable "Auto Confirm Email" in the Cloud dashboard under **Authentication** > **Settings** to skip email verification.

⚠️ **Redirect URLs**: Make sure all redirect URLs match exactly (including https://)

⚠️ **Site URL**: Lovable Cloud automatically manages the Site URL configuration

---

## Access Control Summary

✅ **Public Access (No Login Required)**:
- Browse all cats for adoption
- View urgent help cases
- View stray cat reports and maps
- Read knowledge articles
- View success stories

🔒 **Login Required**:
- Post new cats for adoption
- Report stray cat areas
- Post urgent help cases
- Edit your own posts
- View contact information for urgent cases

👑 **Admin Only**:
- Approve/reject posts
- Moderate content
- Manage user roles
