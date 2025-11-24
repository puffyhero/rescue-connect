
import { RequestStatus, UrgencyLevel } from '../types';

// ==========================================
// APP CONFIGURATION
// ==========================================
export const APP_CONFIG = {
  // Set to true to force Admin Mode and skip Login (Dev only)
  // Set to FALSE for production/testing login flow
  IS_DEBUG_MODE: false, 

  GOOGLE_SCRIPT_URL: "GOOGLE_SCRIPT_URL",
  REFRESH_RATE_MS: 30000, // 30 Seconds
  COOLDOWN_MINUTES: 3,
  DEFAULT_CENTER: { lat: 7.0069, lng: 100.4747 }, // Hat Yai
  MODEL_NAME: 'gemini-2.5-flash',
};

export const AUTH_CONFIG = {
  // TODO: Replace with your actual Google Cloud Client ID
  CLIENT_ID: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com", 
  
  // List of Gmail addresses allowed to access Admin Dashboard
  ALLOWED_EMAILS: [
    "admin@example.com",
    "rescue.hatyai@gmail.com",
    "rescue2@gmail.com" // Add your email here
  ]
};

// ==========================================
// UI DEFINITIONS
// ==========================================

export const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; description: string; color: string; mapColor: string; mapRadius: number; bg: string; text: string; border: string }> = {
  critical: { 
    label: 'วิกฤต (สีแดง)', 
    description: 'อันตรายถึงชีวิต / เจ็บป่วยฉุกเฉิน / ติดอยู่ในพื้นที่ปิดทางออก',
    color: 'text-red-700', 
    mapColor: '#ef4444', 
    mapRadius: 12,
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  high: { 
    label: 'สูง (สีส้ม)', 
    description: 'น้ำท่วมสูงรวดเร็ว / ขาดแคลนอาหาร-น้ำดื่ม / มีผู้เปราะบาง',
    color: 'text-orange-600', 
    mapColor: '#f97316', 
    mapRadius: 10,
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200'
  },
  medium: { 
    label: 'ปานกลาง (สีเหลือง)', 
    description: 'ยังพออาศัยได้ / ต้องการถุงยังชีพ / ต้องการย้ายรถหรือทรัพย์สิน',
    color: 'text-yellow-600', 
    mapColor: '#fbbf24', 
    mapRadius: 8,
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200'
  },
  low: { 
    label: 'ทั่วไป (สีฟ้า)', 
    description: 'แจ้งจุดน้ำท่วมขัง / สอบถามเส้นทาง / ขอความช่วยเหลือไม่เร่งด่วน',
    color: 'text-slate-600', 
    mapColor: '#3b82f6', 
    mapRadius: 8,
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-200'
  },
};

export const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; icon: string; bg: string; borderColor: string }> = {
  pending: { 
    label: 'รอการช่วยเหลือ', 
    color: 'text-red-600', 
    icon: 'fa-exclamation-circle', 
    bg: 'bg-white',
    borderColor: 'white' 
  },
  in_progress: { 
    label: 'กำลังดำเนินการ', 
    color: 'text-blue-600', 
    icon: 'fa-running', 
    bg: 'bg-blue-50',
    borderColor: '#2563eb' 
  },
  assigned: { 
    label: 'ประสานงานต่อ', 
    color: 'text-yellow-600', 
    icon: 'fa-share-square', 
    bg: 'bg-yellow-50',
    borderColor: '#ca8a04' 
  },
  completed: { 
    label: 'ช่วยเหลือสำเร็จ', 
    color: 'text-green-600', 
    icon: 'fa-check-circle', 
    bg: 'bg-green-50/50',
    borderColor: '#16a34a' 
  },
  cancelled: { 
    label: 'ยกเลิก', 
    color: 'text-slate-500', 
    icon: 'fa-ban', 
    bg: 'bg-slate-100',
    borderColor: '#64748b' 
  },
};
