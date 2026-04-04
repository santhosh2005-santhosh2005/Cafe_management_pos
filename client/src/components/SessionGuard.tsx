import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { setSession } from "../store/userSlice";
import axios from "axios";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Clock, 
  Wallet, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  CreditCard,
  Banknote
} from "lucide-react";
import toast from "react-hot-toast";

const SessionGuard = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { sessionId, token } = useSelector((state: RootState) => state.user);

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [startingBalance, setStartingBalance] = useState("0");
  const [endingBalance, setEndingBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";

  // Check for active session on mount or token change
  useEffect(() => {
    const checkActiveSession = async () => {
      if (!token) return;
      
      try {
        const res = await axios.get(`${apiUrl}/api/sessions/active`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.session) {
          dispatch(setSession(res.data.session._id));
          setSessionInfo(res.data.session);
        } else {
          setShowOpenModal(true);
        }
      } catch (error) {
        console.error("Failed to check session", error);
      }
    };

    if (!sessionId && token) {
      checkActiveSession();
    }
  }, [sessionId, token, dispatch, apiUrl]);

  const handleOpenSession = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${apiUrl}/api/sessions/open`, 
        { startingBalance: parseFloat(startingBalance) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        dispatch(setSession(res.data.session._id));
        setSessionInfo(res.data.session);
        setShowOpenModal(false);
        toast.success("POS Session opened successfully!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to open session");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchSummary = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/sessions/summary/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSummary(res.data.summary);
        setEndingBalance(res.data.summary.totalSales.toString());
      }
    } catch (error) {
      toast.error("Failed to fetch session summary");
    }
  };

  const handleCloseSession = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${apiUrl}/api/sessions/close/${sessionId}`, 
        { endingBalance: parseFloat(endingBalance) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        dispatch(setSession(null));
        setSessionInfo(null);
        setShowCloseModal(false);
        toast.success("Session closed and summary saved.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to close session");
    } finally {
      setLoading(false);
    }
  };

  // If no session is active, show the "Open Session" full-screen overlay
  if (!sessionId && token) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-2xl bg-white dark:bg-gray-900 rounded-3xl overflow-hidden">
          <div className="bg-blue-600 p-8 text-center text-white">
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
              <Wallet size={32} />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Open POS Session</h2>
            <p className="text-blue-100 mt-2 text-sm font-medium">Start your shift by setting the opening cash balance.</p>
          </div>
          
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="balance" className="text-xs font-bold uppercase text-gray-400 tracking-widest">
                Starting Cash (INR )
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">INR </span>
                <Input
                  id="balance"
                  type="number"
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(e.target.value)}
                  className="pl-10 h-14 bg-gray-50 dark:bg-gray-800 border-transparent focus:ring-2 focus:ring-blue-500/20 rounded-2xl text-xl font-black"
                  placeholder="0.00"
                />
              </div>
            </div>

            <Button 
              onClick={handleOpenSession} 
              disabled={loading}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? "Opening..." : "Start Shift"}
              {!loading && <ArrowRight size={20} />}
            </Button>

            <p className="text-center text-gray-400 text-xs font-medium">
              A unique session ID will be generated for all orders during this shift.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Active Session Sticky Header (Optional - only if we want it globally visible) */}
      {sessionId && sessionInfo && (
        <div className="bg-emerald-500 dark:bg-emerald-600 text-white px-4 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Session Active
            </div>
            <div className="flex items-center gap-1.5 opacity-80">
              <Clock size={12} />
              Started: {new Date(sessionInfo.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5">
              <TrendingUp size={12} />
              Live Sales: INR {sessionInfo.currentSales?.toLocaleString("en-IN") || 0}
            </div>
          </div>
        </div>
      )}

      {children}

      {/* Close Session Modal with Summary */}
      <Dialog open={showCloseModal} onOpenChange={setShowCloseModal}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-8 text-white">
            <h2 className="text-2xl font-black">Close Register</h2>
            <p className="text-slate-400 mt-1 font-medium">Review your shift summary before closing.</p>
          </div>
          
          <div className="p-8 space-y-6">
            {summary ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-gray-800 p-4 rounded-2xl border border-slate-100 dark:border-gray-700">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Sales</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">INR {summary.totalSales.toLocaleString("en-IN")}</p>
                </div>
                <div className="bg-slate-50 dark:bg-gray-800 p-4 rounded-2xl border border-slate-100 dark:border-gray-700">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Orders</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{summary.orderCount}</p>
                </div>
                
                <div className="col-span-2 space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Breakdown</p>
                  <div className="space-y-2">
                    {Object.entries(summary.paymentBreakdown || {}).map(([method, amount]: [string, any]) => (
                      <div key={method} className="flex justify-between items-center bg-white dark:bg-gray-900 p-3 rounded-xl border border-slate-50 dark:border-gray-800">
                        <div className="flex items-center gap-2">
                          {method === 'cash' ? <Banknote size={16} className="text-emerald-500" /> : <CreditCard size={16} className="text-blue-500" />}
                          <span className="text-sm font-bold capitalize">{method}</span>
                        </div>
                        <span className="text-sm font-black">INR {amount.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center animate-pulse bg-slate-50 rounded-2xl">
                <p className="text-slate-400 font-bold">Calculating summary...</p>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Label htmlFor="ending" className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                Closing Cash Balance (INR )
              </Label>
              <Input
                id="ending"
                type="number"
                value={endingBalance}
                onChange={(e) => setEndingBalance(e.target.value)}
                className="h-12 bg-slate-50 dark:bg-gray-800 border-transparent focus:ring-2 focus:ring-slate-500/20 rounded-xl text-lg font-black"
              />
            </div>

            <DialogFooter className="gap-3 sm:gap-0">
              <Button variant="ghost" onClick={() => setShowCloseModal(false)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button 
                onClick={handleCloseSession} 
                disabled={loading}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold px-8 shadow-lg shadow-rose-500/20"
              >
                {loading ? "Closing..." : "Close Register"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SessionGuard;
