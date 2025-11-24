
import { HelpRequest } from '../types';

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
};

export const downloadFile = (content: string, fileName: string, contentType: string) => {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
};

export const generateCSV = (requests: HelpRequest[]): string => {
  const headers = ["ID,Name,Phone,Urgency,Total_People,Adults,Children,Elderly,Medical_Needs,Dogs,Cats,OtherPets,Address,Lat,Lng,Details,Status,Timestamp"];
  const rows = requests.map(req => {
    const escape = (text: string) => `"${(text || '').replace(/"/g, '""')}"`;
    const totalPeople = req.people.adults + req.people.children + req.people.elderly;
    return [
      req.id,
      escape(req.name),
      escape(req.phone),
      req.urgency,
      totalPeople,
      req.people.adults,
      req.people.children,
      req.people.elderly,
      req.medicalNeeds,
      req.pets.dogs,
      req.pets.cats,
      escape(req.pets.others),
      escape(req.location.address),
      req.location.lat,
      req.location.lng,
      escape(req.details),
      req.status,
      new Date(req.timestamp).toISOString()
    ].join(",");
  });
  
  return "\uFEFF" + [headers, ...rows].join("\n");
};
