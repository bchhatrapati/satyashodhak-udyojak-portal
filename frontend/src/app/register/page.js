'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterMember() {
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  // STRICT BRAND COLORS
  const BRAND = {
    navy: "#001B3D",   // Primary Heading / Buttons
    blue: "#0052FF",   // Selection / Progress
    accent: "#F0F7FF", // Background light
    success: "#10B981" // Success state
  };

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({ photo: false, aadhar: false, pan: false });

  const [formData, setFormData] = useState({
    full_name: '', phone_number: '', email: '', dob: '',
    initial_deposit: 500, aadhar_no: '', pan_no: '',
    nominee_name: '', nominee_relation: '',
    photo_url: '', aadhar_url: '', pan_url: '',
    monthly_installment_date: 10
  });

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    if (!formData.full_name) return alert("Please enter Full Name first for document naming.");
    
    setUploading(prev => ({ ...prev, [type]: true }));
    
    // We use FormData to send doc_type and member_name to the backend
    const data = new FormData();
    data.append("file", file);
    data.append("doc_type", type);
    data.append("member_name", formData.full_name);

    try {
      const res = await fetch(`${API_BASE}/upload-document`, { method: "POST", body: data });
      const result = await res.json();
      if (!res.ok) throw new Error();
      setFormData(prev => ({ ...prev, [`${type}_url`]: result.url }));
    } catch {
      alert(`Upload failed for ${type}`);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const submitForm = async () => {
    setLoading(true);
    try {
      // Note: We send 'initial_deposit' because your backend MemberCreate class expects that field name
      const res = await fetch(`${API_BASE}/register-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Member Registered: ${data.account_number}`);
        router.push("/");
      } else {
        alert(data.detail || "Server Error: Duplicate Phone or Aadhar.");
      }
    } catch {
      alert("Backend unreachable. Check 192.168.43.197");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 outline-none transition-all focus:ring-2 focus:ring-[${BRAND.blue}] focus:bg-white`;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white rounded-[2rem] shadow-2xl p-8 md:p-10 border border-gray-100">
        
        {/* Progress Bar */}
        <div className="flex gap-3 mb-12">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-2 flex-1 rounded-full transition-all duration-500" 
                 style={{ backgroundColor: step >= i ? BRAND.blue : "#E5E7EB" }} />
          ))}
        </div>

        {/* STEP 1: Personal (Strict) */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-black" style={{ color: BRAND.navy }}>Member Identity</h2>
            <input placeholder="Full Name (As per Aadhar)" className={inputClass} value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Phone" maxLength={10} className={inputClass} value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} />
              <input type="date" className={inputClass} value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
            </div>
            <input placeholder="Email Address" type="email" className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <button onClick={() => setStep(2)} className="w-full text-white p-5 rounded-2xl font-bold transition-all" style={{ backgroundColor: BRAND.navy }}>Continue</button>
          </div>
        )}

        {/* STEP 2: KYC */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-black" style={{ color: BRAND.navy }}>KYC & Financials</h2>
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Deposit (₹)" className={inputClass} value={formData.initial_deposit} onChange={e => setFormData({...formData, initial_deposit: Number(e.target.value)})} />
              <input placeholder="Aadhar Number" className={inputClass} value={formData.aadhar_no} onChange={e => setFormData({...formData, aadhar_no: e.target.value})} />
            </div>
            <input placeholder="PAN Number" className={`${inputClass} uppercase`} value={formData.pan_no} onChange={e => setFormData({...formData, pan_no: e.target.value.toUpperCase()})} />
            <div className="p-6 rounded-3xl space-y-4" style={{ backgroundColor: BRAND.accent }}>
              <input placeholder="Nominee Full Name" className="w-full p-4 border rounded-xl" value={formData.nominee_name} onChange={e => setFormData({...formData, nominee_name: e.target.value})} />
              <select className="w-full p-4 border rounded-xl text-gray-500" value={formData.nominee_relation} onChange={e => setFormData({...formData, nominee_relation: e.target.value})}>
                <option value="">Relationship</option>
                <option>Father</option><option>Mother</option><option>Wife</option><option>Husband</option><option>Son</option><option>Daughter</option>
              </select>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 p-5 bg-gray-100 rounded-2xl font-bold text-gray-500">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 text-white p-5 rounded-2xl font-bold" style={{ backgroundColor: BRAND.navy }}>Continue</button>
            </div>
          </div>
        )}

        {/* STEP 3: Documents */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-black" style={{ color: BRAND.navy }}>Upload Documents</h2>
            {[{id: 'photo', label: 'Passport Photo'}, {id: 'aadhar', label: 'Aadhar Card'}, {id: 'pan', label: 'PAN Card'}].map(doc => (
              <div key={doc.id} className="border-2 border-dashed p-6 rounded-3xl border-gray-200 bg-gray-50/50 flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase mb-2">{doc.label}</span>
                <input type="file" onChange={e => handleFileUpload(e.target.files[0], doc.id)} className="text-sm" />
                {uploading[doc.id] && <p className="text-blue-600 text-xs mt-2 animate-pulse">Processing...</p>}
                {formData[`${doc.id}_url`] && <p className="text-green-600 text-xs mt-2 font-bold">✓ Uploaded Successfully</p>}
              </div>
            ))}
            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 p-5 bg-gray-100 rounded-2xl font-bold text-gray-500">Back</button>
              <button 
                disabled={loading || !formData.photo_url || !formData.aadhar_url || !formData.pan_url}
                onClick={submitForm}
                className="flex-1 text-white p-5 rounded-2xl font-bold shadow-xl transition-all disabled:bg-gray-200"
                style={{ backgroundColor: (formData.photo_url && formData.aadhar_url && formData.pan_url) ? BRAND.success : '#E5E7EB' }}
              >
                {loading ? "Registering..." : "Finalize & Register"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}