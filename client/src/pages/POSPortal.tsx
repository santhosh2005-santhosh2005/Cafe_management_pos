import { useState } from "react";
import { useGetActiveSessionQuery, useGetSessionsQuery, useOpenSessionMutation } from "@/services/sessionApi";
import { PlayCircle, History, ShoppingCart, Lock, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router";

export default function POSPortal() {
  const navigate = useNavigate();
  const { data: activeData, isLoading: activeLoading } = useGetActiveSessionQuery();
  const { data: historyData, isLoading: historyLoading } = useGetSessionsQuery();
  const [openSession] = useOpenSessionMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [startingBalance, setStartingBalance] = useState(0);

  const activeSession = activeData?.session;
  const lastSession = historyData?.data?.[0]; // Last history entry

  const handleOpenSession = async () => {
    try {
      await openSession({ startingBalance }).unwrap();
      setIsDialogOpen(false);
      toast.success("POS Terminal Opened!");
      navigate("/dashboard/pos/terminal");
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to open terminal");
    }
  };

  if (activeLoading || historyLoading) return <div className="p-10 text-center font-black animate-pulse">Synchronizing Terminal Records...</div>;

  return (
    <div className="p-6 md:p-12 space-y-12 bg-warm-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-2">
             <span className="rotated-label mb-2">POS_TERMINAL_GATEWAY</span>
             <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">Terminal<br/><span className="text-golden-yellow">Access</span></h1>
             <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase mt-4">[PROTOCOL_READY] SESSION MANAGEMENT ACTIVE</p>
          </div>
          
          {activeSession ? (
             <button 
                onClick={() => navigate("/dashboard/pos/terminal")}
                className="brutalist-button h-20 px-12 flex items-center gap-4 bg-golden-yellow text-deep-black"
             >
                <CheckCircle2 size={24} /> CONTINUE_ACTIVE_SESSION
             </button>
          ) : (
             <button 
                onClick={() => setIsDialogOpen(true)}
                className="brutalist-button h-20 px-12 flex items-center gap-4 bg-golden-yellow text-deep-black"
             >
                <PlayCircle size={24} /> INITIALIZE_NEW_SHIFT
             </button>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Main Status Area */}
          <div className="md:col-span-2 brutalist-card bg-deep-black text-warm-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <ShoppingCart size={200} />
              </div>
              <div className="space-y-8 relative z-10">
                 <div className="space-y-4">
                    <span className="font-mono text-xs text-golden-yellow tracking-widest uppercase">AUDIT_STATUS_MONITOR</span>
                    <div className="flex items-center gap-6 mt-4">
                       <div className={`w-6 h-6 border-2 border-warm-white bg-golden-yellow animate-pulse ${activeSession ? 'opacity-100' : 'opacity-20'}`}></div>
                       <h2 className="text-5xl font-black italic tracking-tight">
                           {activeSession ? "TERMINAL_LINKED" : "SHIFT_LOCKED"}
                       </h2>
                    </div>
                 </div>

                 {activeSession ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t-2 border-warm-white/10 pt-8">
                         <div className="space-y-2">
                             <p className="font-mono text-[10px] tracking-widest text-gray-500 uppercase">Timestamp_Start</p>
                             <p className="text-3xl font-black italic">{new Date(activeSession.startTime).toLocaleTimeString()}</p>
                             <p className="font-mono text-[8px] text-golden-yellow uppercase">{new Date(activeSession.startTime).toLocaleDateString()}</p>
                         </div>
                         <div className="space-y-2">
                             <p className="font-mono text-[10px] tracking-widest text-gray-500 uppercase">Capital_In_Drawer</p>
                             <p className="text-3xl font-black italic text-golden-yellow">INR {activeSession.startingBalance.toFixed(2)}</p>
                             <p className="font-mono text-[8px] uppercase">Validated_Ready</p>
                         </div>
                    </div>
                 ) : (
                    <div className="bg-white/5 p-10 border-2 border-dashed border-white/20 text-center">
                        <Lock className="w-12 h-12 text-warm-white mx-auto mb-4" />
                        <p className="font-black text-xl mb-2 uppercase italic tracking-tight">System access suspended</p>
                        <p className="font-mono text-[10px] text-gray-500 uppercase">Authorization required to open sales window.</p>
                    </div>
                 )}
              </div>
          </div>

          {/* Audit Info Sidebar */}
          <div className="space-y-6">
              <div className="brutalist-card bg-white p-8">
                  <div className="flex items-center gap-4 border-b-2 border-deep-black pb-4 mb-6">
                      <div className="w-10 h-10 bg-deep-black text-warm-white flex items-center justify-center">
                         <History size={20} />
                      </div>
                      <h3 className="font-black uppercase italic tracking-tighter text-xl">Audit_Logs</h3>
                  </div>
                  <div className="space-y-8">
                      <div className="space-y-2">
                           <p className="font-mono text-[10px] tracking-widest text-gray-500 uppercase">Previous_Cycle_Sales</p>
                           <p className="text-4xl font-black italic text-deep-black">
                                {lastSession ? (lastSession.totalSales || 0).toFixed(2) : "0.00"}
                           </p>
                      </div>
                      <div className="pt-4 space-y-4 font-mono">
                           <div className="flex justify-between items-center text-[10px]">
                               <span className="text-gray-400 uppercase">Log_Status</span>
                               <span className="bg-deep-black text-warm-white px-2 py-0.5 uppercase">
                                   {lastSession ? lastSession.status : "NULL"}
                               </span>
                           </div>
                           <div className="flex justify-between items-center text-[10px]">
                               <span className="text-gray-400 uppercase">Head_Operator</span>
                               <span className="text-deep-black font-black uppercase italic">
                                  {lastSession ? "Admin" : "---"}
                               </span>
                           </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Audit Opening Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md p-10 bg-warm-white border-4 border-deep-black shadow-none ring-0">
              <DialogHeader>
                  <DialogTitle className="text-5xl font-black italic tracking-tighter uppercase leading-none">
                     Opening_Balance
                  </DialogTitle>
                  <DialogDescription className="font-mono text-[10px] tracking-widest text-gray-500 uppercase mt-2">
                     Protocol 402: Validate Cash Drawer Contents
                  </DialogDescription>
              </DialogHeader>
              <div className="py-10">
                  <div className="space-y-4">
                      <Label className="font-mono text-[10px] tracking-widest font-black uppercase">Declare_Amount (INR)</Label>
                      <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black italic text-gray-300">INR</span>
                          <input 
                              type="number"
                              value={startingBalance}
                              onChange={(e) => setStartingBalance(parseFloat(e.target.value) || 0)}
                              className="h-24 w-full bg-white border-4 border-deep-black text-5xl font-black italic pl-20 focus:outline-none focus:bg-golden-yellow transition-all"
                              placeholder="0"
                          />
                      </div>
                  </div>
              </div>
              <DialogFooter>
                  <button 
                    onClick={handleOpenSession} 
                    className="brutalist-button w-full h-20 text-2xl tracking-tighter"
                  >
                    AUTHORIZE_POS_LINK
                  </button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
