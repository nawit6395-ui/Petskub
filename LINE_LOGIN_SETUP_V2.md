# 🔐 LINE Login Setup Guide - Updated

## ปัญหาที่แก้ไข

**ปัญหาเดิม:** 
- `POST https://api.line.me/oauth2/v2.1/token 400 (Bad Request)` 
- `Unsupported provider: Provider line could not be found`

**สาเหตุ:** 
- ค่า LINE Channel ID/Secret ไม่ถูกต้อง
- Supabase ไม่รู้จัก LINE provider ด้วย
- ไม่มี database schema สำหรับเก็บ LINE user ID

**วิธีแก้:** 
- ย้าย token exchange ไปยัง Supabase Edge Function
- ใช้ Custom OAuth เก็บ LINE info ใน profiles table
- ตั้งค่า environment variables อย่างถูกต้อง

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

### 3️⃣ ตั้งค่า Callback URL ใน LINE Console

ใน LINE Developers Console > **LINE Login Settings**:

#### Local Development:
```
http://localhost:8080/auth/line/callback
```

#### Production (หลังจาก deploy):
```
https://yourdomain.com/auth/line/callback
```

เช่น ถ้าใช้ Vercel:
```
https://baanpet.vercel.app/auth/line/callback
```

---

## 📝 ตั้งค่า Environment Variables

### สำหรับ Frontend (.env.local)

```env
VITE_LINE_CHANNEL_ID=your_channel_id_here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### สำหรับ Supabase Edge Function (secrets)

#### ตั้งค่าผ่าน CLI:
```bash
supabase secrets set LINE_CHANNEL_ID "your_channel_id"
supabase secrets set LINE_CHANNEL_SECRET "your_channel_secret"
```

#### หรือผ่าน Supabase Dashboard:
1. ไปที่ **Project Settings** > **Secrets**
2. Click **New Secret**
3. เพิ่ม secrets:
   ```
   Name: LINE_CHANNEL_ID
   Value: your_channel_id
   ```
   
   ```
   Name: LINE_CHANNEL_SECRET  
   Value: your_channel_secret
   ```

---

## 🗄️ Database Migration

ต้องเพิ่ม `line_user_id` column ใน profiles table เพื่อเก็บ LINE user info

### ตั้งค่าอัตโนมัติ:
```bash
supabase db push
```

### หรือ Manual:
ไปที่ Supabase Dashboard > SQL Editor แล้วรัน:
```sql
ALTER TABLE profiles ADD COLUMN line_user_id TEXT UNIQUE;
CREATE INDEX idx_profiles_line_user_id ON profiles(line_user_id);
```

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

1. เปิด `/login` page ของคุณ (local: `http://localhost:8080/login`)
2. คลิก "Log in with LINE"
3. ยืนยันตัวตนด้วย LINE Account
4. LINE จะเด้กกลับไปยัง `/auth/line/callback`
5. ระบบจะ sign up หรือ sign in อัตโนมัติ
6. ควรเด้กกลับมาที่หน้าแรกพร้อมข้อมูลผู้ใช้

---

## 🐛 Troubleshooting

### ❌ Error: "State mismatch"
- Clear browser cache/cookies
- ลองเปิด Incognito/Private window
- ตรวจสอบว่า LINE Channel ID ถูกต้อง

### ❌ Error: "LINE credentials not configured"
- ตรวจสอบ LINE_CHANNEL_ID และ LINE_CHANNEL_SECRET ถูกตั้งค่า Supabase secrets
- ลองรัน: `supabase secrets list`

### ❌ Error: "Failed to exchange code for token"
- ตรวจสอบ Channel ID และ Secret ถูกต้องหรือไม่
- ตรวจสอบ Callback URL ตรงกันหรือไม่ (https://, domain, path ต้องเหมือนทุกที่)
- หาก localhost:8080 ไม่ตรงกับ Callback URL ใน LINE Console → ต้องแก้ไขให้ตรงกัน

### ❌ Error: "Failed to fetch LINE user profile" 
- Edge Function อาจยังไม่ deploy
- ลองรัน: `supabase functions deploy line-oauth-callback`

### ❌ CORS Error
- Edge Function มี CORS headers แล้ว (ตั้งค่าเรียบร้อย)
- ลองรีโหลด page และลบ browser cache

### ❌ "ไม่สามารถรับข้อมูลผู้ใช้จาก LINE"
- ตรวจสอบ Edge Function ตอบสนองถูกต้องหรือไม่
- ลองดูใน Supabase > Functions > Logs

---

## 📚 หรือดูเพิ่มเติม

- [LINE Login Documentation](https://developers.line.biz/en/services/line-login/)
- [LINE OAuth 2.0 Flow](https://developers.line.biz/en/doc/line-login/integrate-line-login/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Auth Custom Providers](https://supabase.com/docs/guides/auth/social-login)
