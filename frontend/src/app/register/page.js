// src/app/register/page.js
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { 
  User, CreditCard, FileUp, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle 
} from "lucide-react";

const API_BACKEND = process.env.NEXT_PUBLIC_API_URL;

export default function RegisterMember() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  
  const formRef = useRef(null); 

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    date_of_birth: "",
    nominee_name: "",
    nominee_relation: "",
    aadhar_no: "",
    pan_no: "",
    monthly_installment_date: 10,
    initial_deposit: 500, 
  });

  const [files, setFiles] = useState({
    photo: null,
    aadhar: null,
    pan: null,
  });

  // 🛡️ ENTERPRISE UX: SMART INPUT MASKING
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "aadhar_no") {
      // 1. Strip non-digits, then inject dashes every 4 characters
      const raw = value.replace(/\D/g, "");
      processedValue = raw.replace(/(\d{4})(?=\d)/g, "$1-").slice(0, 14);
    } 
    else if (name === "pan_no") {
      // 2. Strip non-alphanumeric, auto-uppercase, cap at 10 chars
      processedValue = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10);
    } 
    else if (name === "phone_number") {
      // 3. Strip non-digits, cap at 10 chars
      processedValue = value.replace(/\D/g, "").slice(0, 10);
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleFileChange = (e, docType) => {
    const file = e.target.files[0];
    if (file && file.size > 1048576) { 
      setError(`File size for ${docType} exceeds 1MB limit.`);
      e.target.value = ''; 
      return;
    }
    setFiles((prev) => ({ ...prev, [docType]: file }));
    setError(null);
  };

  const handleNextStep = () => {
    if (formRef.current && formRef.current.reportValidity()) {
      setStep(step + 1);
    }
  };

  // --- FINAL SUBMISSION LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    // 1. Trigger HTML5 form validations
    if (!formRef.current.reportValidity()) return;

    setLoading(true);
    setError(null);

    try {
      if (!files.photo || !files.aadhar) {
        throw new Error("Photo and Aadhar documents are mandatory.");
      }

      // ==========================================
      // STEP 1: UPLOAD DOCUMENTS TO FASTAPI
      // ==========================================
      const uploadData = new FormData();
      
      // ALIGNMENT FIX: FastAPI expects "account_number", so we send the Aadhar number 
      // as the unique folder identifier.
      uploadData.append("aadhar_no", formData.aadhar_no); 
      uploadData.append("photo", files.photo);
      uploadData.append("aadhar", files.aadhar);
      if (files.pan) uploadData.append("pan", files.pan);

      const uploadRes = await fetch(`${API_BACKEND}/api/v1/members/upload-documents`, {
        method: "POST",
        credentials: "include",
        body: uploadData, // Browser auto-sets multipart/form-data headers
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.detail || "Document upload failed.");
      }
      
      const uploadedUrls = await uploadRes.json();

      // ==========================================
      // STEP 2: BUILD ALIGNED JSON PAYLOAD
      // ==========================================
      const payload = {
        ...formData,
        // Convert empty string to null to satisfy Optional[str]
        pan_no: formData.pan_no.trim() === "" ? null : formData.pan_no, 
        
        // Ensure strict number types
        initial_deposit: parseFloat(formData.initial_deposit),
        monthly_installment_date: parseInt(formData.monthly_installment_date, 10),
        
        // Attach the signed URLs returned from FastAPI to satisfy MemberCreate schema
        photo_url: uploadedUrls.photo_url,
        aadhar_url: uploadedUrls.aadhar_url,
        pan_url: uploadedUrls.pan_url || null,
      };

      // ==========================================
      // STEP 3: REGISTER THE MEMBER
      // ==========================================
      const response = await fetch(`${API_BACKEND}/api/v1/members/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.detail?.[0]?.msg || errorData.detail || "Failed to register member.";
        throw new Error(errorMsg);
      }

      // ✅ THE FIX: Show success screen, then wait 2 seconds before redirecting
      setIsSuccess(true);
      setTimeout(() => {  
      router.push("/members");
    }, 2000);

    } catch (err) {
      console.error("Registration Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // Utility to prevent future dates in DOB
  const todayDateStr = new Date().toISOString().split("T")[0];

  return (
    isSuccess ? (<div className="max-w-2xl mx-auto py-16 text-center animate-in fade-in zoom-in duration-300">
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-green-100 flex flex-col items-center">
          <div className="h-24 w-24 bg-green-50 text-action-success rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
            {language === "EN" ? "Registration Successful!" : "नोंदणी यशस्वी!"}
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            {language === "EN" ? "The member profile and documents have been securely saved." : "सभासद प्रोफाइल आणि कागदपत्रे सुरक्षितपणे जतन केली आहेत."}
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-blue animate-pulse">
            <span className="h-4 w-4 rounded-full border-2 border-brand-blue border-t-transparent animate-spin"></span>
            {language === "EN" ? "Redirecting to dashboard..." : "डॅशबोर्डवर पुनर्निर्देशित करत आहे..."}
          </div>
        </div>
      </div>):
    (<div className="max-w-3xl mx-auto py-8">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-navy">
          {language === "EN" ? "Register New Member" : "नवीन सभासद नोंदणी"}
        </h1>
        <p className="text-gray-500 mt-2">
          {language === "EN" ? "Complete KYC and initial deposit setup." : "केवायसी आणि प्रारंभिक ठेव सेटअप पूर्ण करा."}
        </p>
      </div>

      {/* PROGRESS BAR */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded" />
        <div className="absolute top-1/2 left-0 h-1 bg-brand-blue -z-10 -translate-y-1/2 rounded transition-all duration-300" style={{ width: `${((step - 1) / 2) * 100}%` }} />
        
        {[ { num: 1, icon: User, label: "Personal" }, { num: 2, icon: CreditCard, label: "Financial" }, { num: 3, icon: FileUp, label: "Documents" } ].map((s) => (
          <div key={s.num} className="flex flex-col items-center gap-2 bg-app-bg px-2">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 font-bold transition-colors ${step >= s.num ? "bg-brand-blue border-brand-blue text-white" : "bg-white border-gray-300 text-gray-400"}`}>
              <s.icon size={18} />
            </div>
            <span className={`text-xs font-semibold ${step >= s.num ? "text-brand-navy" : "text-gray-400"}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* FORM WRAPPER */}
      <form 
        ref={formRef} 
        onSubmit={handleSubmit} 
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8"
      >
        
        {/* STEP 1: PERSONAL DETAILS */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} minLength="3" maxLength="100" placeholder="e.g. Krushna Subhashrao Fulkari" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="member@email.com" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number *</label>
                <input type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange} pattern="^[0-9]{10}$" maxLength="10" placeholder="9876543210" title="10 digit mobile number" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none font-mono" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Date of Birth *</label>
                <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} max={todayDateStr} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nominee Name *</label>
                <input type="text" name="nominee_name" value={formData.nominee_name} onChange={handleInputChange} minLength="3" placeholder="Nominee Full Name" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nominee Relation *</label>
                <input type="text" name="nominee_relation" value={formData.nominee_relation} onChange={handleInputChange} placeholder="e.g. Son, Wife, Mother" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none" required />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: FINANCIAL & KYC */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Aadhar Number *</label>
                <input type="text" name="aadhar_no" value={formData.aadhar_no} onChange={handleInputChange} pattern="^\d{4}-\d{4}-\d{4}$" maxLength="14" placeholder="XXXX-XXXX-XXXX" title="Format: XXXX-XXXX-XXXX" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none font-mono tracking-wider" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">PAN Number</label>
                <input type="text" name="pan_no" value={formData.pan_no} onChange={handleInputChange} pattern="^[A-Z]{5}[0-9]{4}[A-Z]{1}$" maxLength="10" placeholder="ABCDE1234F" title="Format: ABCDE1234F" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none font-mono tracking-wider uppercase" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Initial Deposit (₹) *</label>
                <input type="number" name="initial_deposit" min="500" value={formData.initial_deposit} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none font-numeric" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Installment Date (1-28) *</label>
                <input type="number" name="monthly_installment_date" min="1" max="28" value={formData.monthly_installment_date} onChange={handleInputChange} placeholder="e.g. 10" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none font-numeric" required />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DOCUMENT UPLOAD */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-brand-navy mb-6">
              <strong>Note:</strong> Maximum file size is 1MB. Allowed formats: JPG, PNG, PDF.
            </div>
            
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-xl hover:border-brand-blue transition-colors">
                <label className="block text-sm font-bold text-gray-700 mb-2">Member Photo *</label>
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'photo')} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue/10 file:text-brand-navy hover:file:bg-brand-blue/20 cursor-pointer" required />
              </div>
              <div className="p-4 border border-gray-200 rounded-xl hover:border-brand-blue transition-colors">
                <label className="block text-sm font-bold text-gray-700 mb-2">Aadhar Card Document *</label>
                <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'aadhar')} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue/10 file:text-brand-navy hover:file:bg-brand-blue/20 cursor-pointer" required />
              </div>
              <div className="p-4 border border-gray-200 rounded-xl hover:border-brand-blue transition-colors">
                <label className="block text-sm font-bold text-gray-700 mb-2">PAN Card Document (Optional)</label>
                <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'pan')} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue/10 file:text-brand-navy hover:file:bg-brand-blue/20 cursor-pointer" />
              </div>
            </div>
          </div>
        )}

        {/* FOOTER NAVIGATION */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
          <button 
            type="button" 
            onClick={() => setStep(step - 1)} 
            disabled={step === 1 || loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <ChevronLeft size={18} /> Back
          </button>

          {step < 3 ? (
            <button 
              type="button" 
              onClick={handleNextStep} 
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-brand-navy text-white hover:bg-blue-950 transition-all shadow-lg active:scale-95"
            >
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={loading || !files.photo || !files.aadhar}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold bg-action-success text-white hover:bg-green-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : <><CheckCircle2 size={18} /> Complete Registration</>}
            </button>
          )}
        </div>
        
      </form>
    </div>)
  );
}