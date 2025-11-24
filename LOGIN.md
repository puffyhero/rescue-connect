
# 🔐 คู่มือตั้งค่าระบบ Login (Google Sign-In)

ระบบ Admin ของ Hat Yai Flood Monitor ใช้ **Google Identity Services** ในการยืนยันตัวตน เพื่อความปลอดภัยและความสะดวกในการจัดการสิทธิ์

---

## 1. ภาพรวมการทำงาน

1. ผู้ดูแลระบบเข้าหน้า Admin (`/?mode=admin`)
2. กดปุ่ม **Sign in with Google**
3. ระบบตรวจสอบอีเมลที่ Login เข้ามา
4. หากอีเมลอยู่ในรายการที่อนุญาต (`ALLOWED_EMAILS`) -> เข้าใช้งาน Dashboard ได้
5. หากไม่อยู่ในรายการ -> แสดงข้อความปฏิเสธการเข้าถึง

---

## 2. ขั้นตอนการขอ Google Client ID

คุณจำเป็นต้องมี `CLIENT_ID` จาก Google Cloud Platform (GCP)

1. เข้าไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. เลือก Project ที่ต้องการ (หรือสร้างใหม่)
3. ไปที่เมนู **APIs & Services** > **Credentials**
4. กด **+ CREATE CREDENTIALS** เลือก **OAuth client ID**
5. **Application type**: เลือก `Web application`
6. **Name**: ตั้งชื่อเช่น "Flood Monitor Admin"
7. **Authorized JavaScript origins**:
   *ใส่ URL ที่รันแอปของคุณ (ต้องใส่ให้ครบทั้ง Dev และ Prod)*
   - `http://localhost:1234` (หรือพอร์ตที่คุณใช้)
   - `http://localhost:5173`
   - `https://your-production-domain.com`
8. กด **Create**
9. คัดลอก **Client ID** เก็บไว้ (เช่น `123456-abcde.apps.googleusercontent.com`)

---

## 3. การตั้งค่าในโค้ด

เปิดไฟล์ `utils/constants.ts` และแก้ไขส่วน `AUTH_CONFIG`:

```typescript
export const AUTH_CONFIG = {
  // 1. ใส่ Client ID ที่ได้จากข้อ 2
  CLIENT_ID: "YOUR_COPIED_CLIENT_ID.apps.googleusercontent.com", 
  
  // 2. ใส่อีเมลของทีมงานที่ต้องการให้เข้าหน้า Admin ได้
  ALLOWED_EMAILS: [
    "head.admin@gmail.com",
    "volunteer01@gmail.com",
    "rescue.team@org.or.th"
  ]
};
```

---

## 4. ปัญหาที่พบบ่อย (Troubleshooting)

**Q: ปุ่ม Login ไม่ขึ้น หรือหมุนติ้วๆ**
A: ตรวจสอบว่าได้ใส่ `CLIENT_ID` ใน `constants.ts` ถูกต้องหรือไม่ และตรวจสอบว่าไฟล์ `index.html` มี `<script src="https://accounts.google.com/gsi/client" ...>` อยู่หรือไม่

**Q: ขึ้น Error: "The given origin is not allowed..."**
A: คุณลืมเพิ่ม URL (เช่น `http://localhost:1234`) ในช่อง **Authorized JavaScript origins** บน Google Cloud Console (ต้องรอประมาณ 5-10 นาทีหลังแก้ค่า ถึงจะใช้งานได้)

**Q: Login ผ่านแต่เข้าหน้า Dashboard ไม่ได้**
A: ตรวจสอบว่าอีเมลที่คุณใช้ Login มีอยู่ในลิสต์ `ALLOWED_EMAILS` หรือไม่ (ตัวพิมพ์เล็ก/ใหญ่ต้องตรงกัน แนะนำให้ใช้ตัวพิมพ์เล็กทั้งหมด)
