# 🔐 LINE Login Setup Guide

## ปัญหาที่แก้ไข

**ปัญหาเดิม:** `POST https://api.line.me/oauth2/v2.1/token 400 (Bad Request)`

**สาเหตุ:** 
- ค่า LINE Channel ID/Secret ไม่ถูกต้อง
- ไม่มีการตั้งค่า CORS ที่ถูกต้อง
- Channel Secret ถูกเปิดเผยในฝั่ง Client (security issue)

**วิธีแก้:** 
- ย้าย token exchange ไปยัง Supabase Edge Function
- ใช้ environment variables
- เพิ่มการตรวจสอบ state/nonce

---

## ขั้นตอนการตั้งค่า

### 1️⃣ สร้าง LINE Login Channel

1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. สร้าง **Provider** ใหม่ (ถ้ายังไม่มี)
3. สร้าง **Channel** ประเภท **LINE Login**
4. กรอกข้อมูล:
   - Channel Name: `baanpet` หรือชื่ออื่น
   - Channel Type: Select `LINE Login`

### 2️⃣ ได้รับ Credentials

ใน LINE Developers Console:
1. ไปที่ **Basic Settings**
2. Copy:
   - **Channel ID** 
   - **Channel Secret** (เก็บที่ปลอดภัย!)

### 3️⃣ ตั้งค่า Redirect URI

ใน LINE Developers Console > **LINE Login Settings**:

```
Callback URL: https://your-domain.com/auth/line/callback
```

เปลี่ยน `your-domain.com` เป็น domain ของคุณ

---

## 📝 ตั้งค่า Environment Variables

### สำหรับ Frontend (.env.local)

```env
VITE_LINE_CHANNEL_ID=your_channel_id_here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### สำหรับ Supabase Edge Function (secrets)

```bash
supabase secrets set LINE_CHANNEL_ID "your_channel_id"
supabase secrets set LINE_CHANNEL_SECRET "your_channel_secret"
```

หรือผ่าน Supabase Dashboard:
1. ไปที่ **Project Settings** > **Secrets**
2. เพิ่ม secrets:
   - Name: `LINE_CHANNEL_ID`
   - Value: `your_channel_id`
   
   - Name: `LINE_CHANNEL_SECRET`  
   - Value: `your_channel_secret`

---

## 🚀 Deploy Edge Function

```bash
# Login to Supabase
supabase login

# Deploy function
supabase functions deploy line-oauth-callback

# Verify deployment
supabase functions list
```

---

## ✅ การทดสอบ

1. เปิด `/login` page
2. คลิก "Log in with LINE"
3. ยืนยันตัวตนด้วย LINE Account
4. ควรเด้กกลับมาที่หน้าแรกพร้อมข้อมูลผู้ใช้

---

## 🐛 Troubleshooting

### ❌ Error: "State mismatch"
- Clear browser cache/cookies
- ลองเปิด Incognito/Private window

### ❌ Error: "LINE credentials not configured"
- ตรวจสอบว่า LINE_CHANNEL_ID และ LINE_CHANNEL_SECRET ถูกตั้งค่าใน Supabase secrets

### ❌ Error: "Failed to exchange code for token"
- ตรวจสอบ Channel ID และ Secret ถูกต้องหรือไม่
- ตรวจสอบ Callback URL ตรงกันหรือไม่ (https://, domain, path ต้องเหมือนทุกที่)

### ❌ CORS Error
- Edge Function ต้องมี CORS headers (ได้ตั้งค่าแล้ว)
- ลองรีโหลด page และลบ cache

---

## 📚 หรือดูเพิ่มเติม

- [LINE Login Documentation](https://developers.line.biz/en/services/line-login/)
- [LINE OAuth 2.0 Flow](https://developers.line.biz/en/doc/line-login/integrate-line-login/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
