
# 🌊 Hat Yai Flood Monitor (ระบบติดตามสถานการณ์น้ำท่วมหาดใหญ่)

เว็บแอปพลิเคชันสำหรับติดตามสถานการณ์น้ำท่วมในอำเภอหาดใหญ่แบบ Real-time ผสานพลัง AI (Gemini) เพื่อวิเคราะห์ข่าวสารและจัดการข้อมูลผู้ประสบภัย

## 🚀 ฟีเจอร์หลัก (Features)

- **🤖 AI Situation Report:** ใช้ Gemini 2.5 Flash + Google Search Grounding สรุปข่าวน้ำท่วมล่าสุดอย่างแม่นยำ
- **🗺️ Live Map:** แผนที่แสดงจุดขอความช่วยเหลือ แบ่งสีตามความเร่งด่วน (Critical, High, Medium, Low)
- **🆘 Request Form:** ฟอร์มแจ้งเหตุฉุกเฉินสำหรับประชาชน (บันทึกลง Google Sheets)
- **🛡️ Admin Command Center:** ระบบจัดการเคสสำหรับเจ้าหน้าที่ พร้อม AI ช่วยวิเคราะห์และจัดลำดับความสำคัญ
- **🔐 Secure Login:** ระบบยืนยันตัวตนผ่าน Google Sign-In (จำกัดสิทธิ์เฉพาะ Email ที่กำหนด)

![Map overview](/map.png)
![Admin overview](/admin-image.png)
---

## ⚙️ การตั้งค่า (Configuration)

โปรเจกต์นี้ต้องการการตั้งค่า API Key และ Google Cloud Credential ก่อนเริ่มใช้งาน

### 1. การตั้งค่า Admin Login (Google Sign-In) 🔐

เพื่อให้เข้าใช้งานหน้า Admin ได้ คุณต้องมี **Google Client ID**:

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง **OAuth Client ID** (เลือก Application type เป็น `Web application`)
3. ในช่อง **Authorized JavaScript origins** ให้ใส่ URL ของเว็บ:
   - Dev: `http://localhost:1234`
   - Prod: `https://your-domain.com`
4. เปิดไฟล์ `utils/constants.ts` และแก้ไขค่า:

```typescript
// utils/constants.ts
export const AUTH_CONFIG = {
  CLIENT_ID: "YOUR_CLIENT_ID.apps.googleusercontent.com", // ใส่ ID ที่ได้จาก Google Cloud
  ALLOWED_EMAILS: [
    "admin@example.com", // ใส่อีเมลที่อนุญาตให้เป็น Admin
    "rescue@gmail.com"
  ]
};
```

> 📖 **คู่มือฉบับเต็ม:** หากต้องการรายละเอียดเพิ่มเติม ดูที่ไฟล์ [LOGIN.md](./LOGIN.md)

---

### 2. การตั้งค่า Google Sheets (Database) 📊

ระบบใช้ Google Sheets เป็นฐานข้อมูลเก็บคำร้องขอความช่วยเหลือ:

1. สร้าง Google Sheet ใหม่
2. ไปที่ `Extensions` > `Apps Script`
3. เขียน Script เพื่อรองรับ `doGet` และ `doPost`
    ดูตัวอย่าง code จาก `docs/GOOGLE_APPS_SCRIPT.js`
4. Deploy เป็น Web App (เลือก Access เป็น **Anyone**)
5. นำ URL ที่ได้มาใส่ใน `utils/constants.ts`:

```typescript
export const APP_CONFIG = {
  // ...
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/..../exec",
  // ...
};
```

---

### 3. การตั้งค่า Gemini API 🧠

โปรเจกต์นี้ใช้ `@google/genai` SDK:
- ตรวจสอบให้แน่ใจว่า `process.env.API_KEY` ถูกตั้งค่าใน Environment Variables ของระบบที่รัน (ไม่ต้องแก้ใน Code)

---

## 🛠️ การรันโปรเจกต์ (Development)

```bash
# ติดตั้ง dependencies
npm install

# รันโปรเจกต์
npm start
```

## 🛠 Tech Stack

*   **Frontend:** React 19, TypeScript, Tailwind CSS
*   **AI & Intelligence:** [Google GenAI SDK](https://www.npmjs.com/package/@google/genai) (Gemini 2.5 Flash)
*   **Maps:** Leaflet & OpenStreetMap
*   **Database (Backendless):** Google Sheets via Google Apps Script (GAS)
*   **Build Tool:** Parcel / Vite (depending on your setup)

---
## 🤝 Contributing
1. Fork the Project
2. Create your Feature Branch
    `git checkout -b feature/YourFeature`
3. Commit your Changes
    `git commit -m 'Add some YourFeature'`
4. Push to the Branch
    `git push origin feature/YourFeature`
5. Open a Pull Request

---
📄 License
Distributed under the GNU General Public License. See LICENSE for more information.

---