import { useState } from "react";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const response = await axios.post(`${apiUrl}/api/users/register`, {
        name,
        email,
        password,
        role,
      });
      toast.success(response.data.message || "Identity Created.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Protocol Failure");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white flex flex-col md:flex-row-reverse">
      {/* 🟡 Accent Side Panel */}
      <div className="w-full md:w-1/3 bg-golden-yellow text-deep-black p-12 md:p-20 flex flex-col justify-between border-b-8 md:border-b-0 md:border-l-8 border-deep-black">
        <div>
           <div className="bg-deep-black text-white p-4 inline-block mb-12">
             <img src="/logo.png" alt="Logo" className="w-16 h-16 invert" />
           </div>
           <h1 className="text-6xl md:text-8xl leading-[0.85] italic tracking-tighter mb-8">
             JOIN THE<br />
             <span className="bg-deep-black text-golden-yellow px-2 inline-block mt-2">ECOSYSTEM</span>
           </h1>
           <p className="font-mono text-[10px] tracking-widest uppercase max-w-xs font-black">
             [RECRUITMENT_PHASE_ACTIVE]<br />
             Security level: 4<br />
             Role Assignment Required
           </p>
        </div>
        
        <p className="font-mono text-[8px] tracking-[0.3em] font-black opacity-20 uppercase hidden md:block">
          AUTHORIZED_PERSONNEL_ONLY_BEYOND_THIS_POINT_ODOO_SYSTEM_X
        </p>
      </div>

      {/* ⚪️ Registration form area */}
      <div className="flex-1 p-8 md:p-20 flex items-center justify-center">
         <div className="w-full max-w-lg space-y-10">
            <div className="space-y-2">
               <span className="-rotate-1 inline-block bg-deep-black text-golden-yellow px-2 py-1 font-mono font-black text-xs">NEW_CREW_REGISTRATION</span>
               <h2 className="text-5xl font-black italic tracking-tight">CREDENTIAL SETUP</h2>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
               <div className="space-y-1">
                  <Label className="font-mono uppercase text-[10px] tracking-widest text-deep-black/60 ml-1">Legal Designation</Label>
                  <Input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-14 bg-white border-2 border-deep-black font-bold focus:shadow-[4px_4px_0_0_#F5B400] transition-all"
                    placeholder="FULL NAME"
                    required
                  />
               </div>

               <div className="space-y-1">
                  <Label className="font-mono uppercase text-[10px] tracking-widest text-deep-black/60 ml-1">Comm Channel (Email)</Label>
                  <Input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 bg-white border-2 border-deep-black font-bold focus:shadow-[4px_4px_0_0_#F5B400] transition-all"
                    placeholder="NAME@SYSTEM.COM"
                    required
                  />
               </div>

               <div className="space-y-1">
                  <Label className="font-mono uppercase text-[10px] tracking-widest text-deep-black/60 ml-1">Private Cipher</Label>
                  <Input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 bg-white border-2 border-deep-black font-bold focus:shadow-[4px_4px_0_0_#F5B400] transition-all"
                    placeholder="••••••••"
                    required
                  />
               </div>

               <div className="space-y-1">
                  <Label className="font-mono uppercase text-[10px] tracking-widest text-deep-black/60 ml-1">Operational Role</Label>
                  <select 
                    className="w-full h-14 px-4 bg-white border-2 border-deep-black font-bold focus:shadow-[4px_4px_0_0_#F5B400] transition-all appearance-none uppercase italic"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="customer">Customer / Guest</option>
                    <option value="waiter">Waiter / Staff</option>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">System Admin</option>
                  </select>
               </div>

               <Button 
                 type="submit" 
                 disabled={loading}
                 className="w-full h-20 bg-deep-black text-golden-yellow font-black text-2xl uppercase italic border-2 border-deep-black shadow-[8px_8px_0_0_#F5B400] hover:bg-golden-yellow hover:text-deep-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-100 mt-4"
               >
                 {loading ? "INITIALIZING..." : "REQUEST_ACCOUNT_ACCESS"}
               </Button>
            </form>

            <div className="flex justify-between items-center pt-8 border-t-2 border-deep-black/10">
               <p className="font-mono text-[8px] tracking-widest font-black uppercase">DATA_PROTECTION_ACT_2026</p>
               <Link to="/login" className="font-black text-sm text-deep-black hover:text-golden-yellow uppercase italic tracking-tighter group">
                  Already Registered? <span className="group-hover:pl-2 transition-all">←</span>
               </Link>
            </div>
         </div>
      </div>
    </div>
  );
}
