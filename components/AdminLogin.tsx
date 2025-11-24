
import React, { useState, useEffect } from 'react';
import { AUTH_CONFIG } from '../utils/constants';
import { jwtDecode } from 'jwt-decode';

declare const google: any;

interface AdminLoginProps {
  onLogin: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Check if configuration is missing
  const isConfigMissing = !AUTH_CONFIG.CLIENT_ID || AUTH_CONFIG.CLIENT_ID.includes("YOUR_GOOGLE_CLIENT_ID");

  useEffect(() => {
    if (isConfigMissing) {
        setError("กรุณาตั้งค่า Google Client ID ในไฟล์ utils/constants.ts ก่อน");
        return;
    }

    // Robust check for Google Identity Services script
    const checkGoogleScript = () => {
      if (typeof google !== 'undefined' && google.accounts) {
        return true;
      }
      return false;
    };

    const initializeGSI = () => {
          try {
            google.accounts.id.initialize({
              client_id: AUTH_CONFIG.CLIENT_ID,
              callback: handleCredentialResponse
            });
            
            const targetDiv = document.getElementById("googleSignInDiv");
            if (targetDiv) {
                google.accounts.id.renderButton(
                  targetDiv,
                  { theme: "outline", size: "large", width: "250" }
                );
                setIsScriptLoaded(true);
                setError(null); // Clear any previous loading errors
            }
          } catch (e) {
            console.error("Google Sign-In Init Error:", e);
            setError("ไม่สามารถโหลดระบบล็อกอินได้ (API Init Failed)");
          }
    };

    if (checkGoogleScript()) {
      initializeGSI();
    } else {
      // Poll for script if using async/defer
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (checkGoogleScript()) {
          clearInterval(interval);
          initializeGSI();
        } else if (attempts > 20) { // Stop after 10 seconds
          clearInterval(interval);
          setError("โหลด Google Login ไม่สำเร็จ (Network Timeout)");
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isConfigMissing]);

  const handleCredentialResponse = (response: any) => {
    try {
      const decoded: any = jwtDecode(response.credential);
      const email = decoded.email;
      setUserEmail(email);

      if (AUTH_CONFIG.ALLOWED_EMAILS.includes(email)) {
        onLogin();
      } else {
        setError(`อีเมล ${email} ไม่ได้รับอนุญาตให้เข้าถึง`);
      }
    } catch (e) {
      console.error("Login Error:", e);
      setError("เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์");
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full border border-slate-200 text-center">
        <div className="w-16 h-16 bg-slate-800 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-md">
          <i className="fas fa-user-shield"></i>
        </div>
        
        <h2 className="text-xl font-bold text-slate-800 mb-2">Command Center</h2>
        <p className="text-slate-500 text-sm mb-6">กรุณายืนยันตัวตนด้วยบัญชี Google</p>
        
        <div className="flex flex-col items-center space-y-4 min-h-[60px]">
          {/* Google Button Target */}
          <div id="googleSignInDiv" className={isConfigMissing ? 'hidden' : ''}></div>
          
          {!isScriptLoaded && !isConfigMissing && !error && (
             <div className="flex items-center text-slate-400 text-xs">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mr-2"></div>
                Loading Google Login...
             </div>
          )}
          
          {/* Fallback/Warning if Client ID is missing */}
          {isConfigMissing && (
             <div className="text-xs text-red-500 bg-red-50 p-3 rounded-lg border border-red-200 text-left w-full">
               <p className="font-bold mb-1"><i className="fas fa-exclamation-triangle"></i> Configuration Required</p>
               <p className="mb-2">ไม่พบปุ่ม Login เนื่องจากยังไม่ได้ตั้งค่า</p>
               <ol className="list-decimal list-inside space-y-1 opacity-90">
                 <li>เปิดไฟล์ <code>utils/constants.ts</code></li>
                 <li>เปลี่ยน <code>CLIENT_ID</code> เป็นค่าที่ได้จาก Google Cloud</li>
               </ol>
             </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-medium flex items-center justify-center animate-pulse">
            <i className="fas fa-ban mr-2"></i> {error}
          </div>
        )}
        
        {userEmail && !error && (
           <p className="text-green-600 text-xs mt-4">ยินดีต้อนรับ: {userEmail}</p>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400">
           <i className="fas fa-lock mr-1"></i> Authorized Personnel Only
        </div>
      </div>
    </div>
  );
};
