
import React, { useState, useEffect, useRef } from 'react';
import { HelpRequest, UrgencyLevel } from '../types';
import { APP_CONFIG, URGENCY_CONFIG } from '../utils/constants';

declare const L: any;

interface RequestFormProps {
  onSubmit: (request: HelpRequest) => void;
  isAdmin?: boolean;
  onCancel?: () => void;
}

interface PersonEntry {
  id: string;
  type: 'adult' | 'child' | 'elderly';
  isMedical: boolean;
}

const COOLDOWN_MS = APP_CONFIG.COOLDOWN_MINUTES * 60 * 1000;

export const RequestForm: React.FC<RequestFormProps> = ({ onSubmit, isAdmin = false, onCancel }) => {
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('high'); // Default to High for faster usage
  
  const [peopleList, setPeopleList] = useState<PersonEntry[]>([
    { id: '1', type: 'adult', isMedical: false }
  ]);
  const [dogs, setDogs] = useState(0);
  const [cats, setCats] = useState(0);
  const [otherPets, setOtherPets] = useState('');

  const [locationState, setLocationState] = useState<{lat: number, lng: number} | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [phoneError, setPhoneError] = useState<string>('');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Map Initialization
  useEffect(() => {
    // If mounted in a modal, we might need a slight delay to ensure container has size
    const timer = setTimeout(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current).setView([APP_CONFIG.DEFAULT_CENTER.lat, APP_CONFIG.DEFAULT_CENTER.lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);
    
        mapInstanceRef.current = map;
        map.on('click', (e: any) => updateMarker(e.latlng.lat, e.latlng.lng));

        // Invalidate size to ensure map renders correctly in modal
        setTimeout(() => map.invalidateSize(), 100);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Cooldown Logic (Skip if Admin)
  useEffect(() => {
    if (isAdmin) return; 

    const checkCooldown = () => {
      const lastSubmit = localStorage.getItem('last_request_timestamp');
      if (lastSubmit) {
        const diff = Date.now() - parseInt(lastSubmit, 10);
        if (diff < COOLDOWN_MS) {
          setCooldownRemaining(Math.ceil((COOLDOWN_MS - diff) / 1000));
        } else {
          setCooldownRemaining(0);
        }
      }
    };
    checkCooldown();
    const timer = setInterval(checkCooldown, 1000);
    return () => clearInterval(timer);
  }, [isAdmin]);

  const updateMarker = (lat: number, lng: number) => {
    setLocationState({ lat, lng });
    if (mapInstanceRef.current) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapInstanceRef.current);
        markerRef.current.on('dragend', (event: any) => {
          const { lat, lng } = event.target.getLatLng();
          setLocationState({ lat, lng });
        });
      }
      mapInstanceRef.current.panTo([lat, lng]);
    }
  };

  const handleGetLocation = () => {
    setLocLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateMarker(pos.coords.latitude, pos.coords.longitude);
          mapInstanceRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 16);
          setLocLoading(false);
        },
        () => {
          alert("ไม่สามารถดึงพิกัดได้ กรุณาปักหมุดเอง");
          setLocLoading(false);
        }
      );
    } else {
      setLocLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin && cooldownRemaining > 0) return;
    
    // Basic phone validation (relax validation for admins if needed, but keeping it safe)
    const phoneClean = phone.replace(/[^0-9]/g, '');
    if (phoneClean.length < 9 || phoneClean.length > 10) {
        setPhoneError('เบอร์โทรศัพท์ไม่ถูกต้อง');
        return;
    }

    const newRequest: HelpRequest = {
      id: Date.now().toString(),
      name,
      phone,
      location: { lat: locationState?.lat || 0, lng: locationState?.lng || 0, address },
      urgency,
      people: {
        adults: peopleList.filter(p => p.type === 'adult').length,
        children: peopleList.filter(p => p.type === 'child').length,
        elderly: peopleList.filter(p => p.type === 'elderly').length
      },
      medicalNeeds: peopleList.filter(p => p.isMedical).length,
      pets: { dogs, cats, others: otherPets },
      details: address,
      timestamp: new Date(),
      status: 'pending'
    };
    
    if (!isAdmin) {
        localStorage.setItem('last_request_timestamp', Date.now().toString());
    }
    
    onSubmit(newRequest);
    
    if (isAdmin && onCancel) {
        // If admin, we assume parent handles closing, or we just alert
        // But better UX: Close modal by calling onCancel after short delay or immediately
        alert('บันทึกข้อมูลเรียบร้อย');
        onCancel();
    } else {
        setSubmitted(true);
    }
  };

  const urgencyConfig = URGENCY_CONFIG[urgency];

  if (submitted && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl">
          <i className="fas fa-check"></i>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">ส่งข้อมูลสำเร็จ</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 mt-4">
           <i className="fas fa-info-circle mr-1"></i> รอ {APP_CONFIG.COOLDOWN_MINUTES} นาทีเพื่อแจ้งเหตุใหม่
        </div>
        <button onClick={() => setSubmitted(false)} className="mt-6 px-6 py-2 bg-slate-200 text-slate-700 rounded-lg">
          กลับ
        </button>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-y-auto bg-slate-50 ${isAdmin ? '' : 'p-4'}`}>
      <div className={`mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${isAdmin ? 'border-none shadow-none rounded-none' : 'max-w-md'}`}>
        {!isAdmin && (
            <div className="bg-red-600 p-4 text-white">
            <h2 className="text-lg font-bold flex items-center"><i className="fas fa-exclamation-triangle mr-2"></i> แจ้งเหตุ</h2>
            </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ระดับความเร่งด่วน</label>
                <select value={urgency} onChange={(e) => setUrgency(e.target.value as UrgencyLevel)} className="w-full px-4 py-2 border rounded-lg bg-white font-medium">
                  {Object.entries(URGENCY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
                <p className={`text-xs mt-2 p-2 rounded border ${urgencyConfig.bg} ${urgencyConfig.text} ${urgencyConfig.border}`}>
                    <i className="fas fa-info-circle mr-1"></i> {urgencyConfig.description}
                </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" placeholder="ชื่อ-นามสกุล" />
                <div>
                  <input required type="tel" value={phone} onChange={e => { setPhone(e.target.value); setPhoneError(''); }} className={`w-full px-4 py-2 border rounded-lg ${phoneError ? 'border-red-500' : ''}`} placeholder="เบอร์โทร" />
                  {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
                </div>
            </div>
          </div>

          {/* People Section */}
          <div className="border-t pt-4">
             <div className="flex justify-between mb-3">
               <label className="text-sm font-bold">ผู้ประสบภัย ({peopleList.length} คน)</label>
             </div>
             <div className="space-y-3 mb-3">
               {peopleList.map((p, i) => (
                 <div key={p.id} className="bg-slate-50 border rounded-lg p-3">
                   <div className="flex gap-2 mb-2">
                     <span className="text-xs font-bold text-slate-400">#{i+1}</span>
                     <div className="flex flex-1 bg-white rounded border p-0.5">
                       {(['adult', 'child', 'elderly'] as const).map(t => (
                         <button key={t} type="button" onClick={() => setPeopleList(prev => prev.map(item => item.id === p.id ? { ...item, type: t } : item))}
                           className={`flex-1 text-xs py-1 rounded ${p.type === t ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
                           {t === 'adult' ? 'ผู้ใหญ่' : t === 'child' ? 'เด็ก' : 'สูงอายุ'}
                         </button>
                       ))}
                     </div>
                     {peopleList.length > 1 && <button type="button" onClick={() => setPeopleList(prev => prev.filter(item => item.id !== p.id))} className="text-slate-400 hover:text-red-500"><i className="fas fa-times"></i></button>}
                   </div>
                   <button type="button" onClick={() => setPeopleList(prev => prev.map(item => item.id === p.id ? { ...item, isMedical: !item.isMedical } : item))}
                     className={`w-full py-1 text-xs rounded border ${p.isMedical ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white'}`}>
                     {p.isMedical ? 'ต้องการแพทย์ / พิการ' : 'ปกติ'}
                   </button>
                 </div>
               ))}
             </div>
             <button type="button" onClick={() => setPeopleList(prev => [...prev, { id: Date.now().toString(), type: 'adult', isMedical: false }])} className="w-full py-2 border-dashed border-2 border-blue-300 text-blue-600 rounded-lg font-bold hover:bg-blue-50">
                + เพิ่มคน
             </button>
          </div>

          {/* Pets Section */}
          <div className="border-t pt-4">
             <label className="text-sm font-bold block mb-2">สัตว์เลี้ยง</label>
             <div className="grid grid-cols-2 gap-4 mb-2">
                 <div className="flex items-center justify-between bg-slate-50 p-2 rounded border">
                    <span className="text-sm text-slate-600"><i className="fas fa-dog mr-1"></i> สุนัข</span>
                    <div className="flex items-center bg-white rounded border">
                        <button type="button" onClick={() => setDogs(Math.max(0, dogs-1))} className="px-2 py-1 text-slate-500 hover:bg-slate-100">-</button>
                        <span className="w-8 text-center text-sm font-bold">{dogs}</span>
                        <button type="button" onClick={() => setDogs(dogs+1)} className="px-2 py-1 text-slate-500 hover:bg-slate-100">+</button>
                    </div>
                 </div>
                 <div className="flex items-center justify-between bg-slate-50 p-2 rounded border">
                    <span className="text-sm text-slate-600"><i className="fas fa-cat mr-1"></i> แมว</span>
                    <div className="flex items-center bg-white rounded border">
                        <button type="button" onClick={() => setCats(Math.max(0, cats-1))} className="px-2 py-1 text-slate-500 hover:bg-slate-100">-</button>
                        <span className="w-8 text-center text-sm font-bold">{cats}</span>
                        <button type="button" onClick={() => setCats(cats+1)} className="px-2 py-1 text-slate-500 hover:bg-slate-100">+</button>
                    </div>
                 </div>
             </div>
             <input value={otherPets} onChange={e => setOtherPets(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-sm" placeholder="สัตว์เลี้ยงอื่นๆ (ถ้ามี)" />
          </div>

          {/* Location */}
          <div className="border-t pt-4">
             <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">พิกัด (จำเป็น)</label>
                <button type="button" onClick={handleGetLocation} disabled={locLoading} className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-200">
                   {locLoading ? 'กำลังหา...' : 'ใช้ GPS'}
                </button>
             </div>
             <div className="h-40 bg-slate-100 rounded-lg border overflow-hidden relative">
                <div ref={mapContainerRef} className="w-full h-full" />
                {!locationState && <div className="absolute inset-0 flex items-center justify-center bg-black/5 pointer-events-none"><span className="bg-white/90 px-2 py-1 rounded text-xs">แตะเพื่อปักหมุด</span></div>}
             </div>
             <textarea required value={address} onChange={e => setAddress(e.target.value)} className="w-full mt-2 px-4 py-2 border rounded-lg text-sm" placeholder="รายละเอียดที่อยู่เพิ่มเติม..." rows={2} />
          </div>

          <div className="flex space-x-3 pt-2">
            {onCancel && (
                <button type="button" onClick={onCancel} className="flex-1 py-4 text-slate-600 font-bold rounded-lg bg-slate-200 hover:bg-slate-300">
                    ยกเลิก
                </button>
            )}
            <button type="submit" disabled={!isAdmin && cooldownRemaining > 0} className={`flex-1 py-4 text-white font-bold rounded-lg shadow-lg ${!isAdmin && cooldownRemaining > 0 ? 'bg-slate-400' : 'bg-red-600 hover:bg-red-700'}`}>
                {isAdmin ? 'บันทึกข้อมูล' : (cooldownRemaining > 0 ? `รอ ${Math.floor(cooldownRemaining / 60)} นาที` : 'ส่งข้อมูล')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
