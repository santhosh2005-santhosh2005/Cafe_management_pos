import { useState } from "react";
import { useGetActiveSessionQuery, useGetSessionsQuery, useOpenSessionMutation } from "@/services/sessionApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, History, Landmark, Clock, User, CheckCircle2, ShoppingCart, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
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
    <div className="p-6 md:p-12 space-y-10 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
             <h1 className="text-4xl font-black text-gray-900 dark:text-white flex items-center gap-4">
                <ShoppingCart className="w-10 h-10 text-blue-600" />
                POS Terminal Setup
             </h1>
             <p className="text-gray-500 font-medium text-sm">Manage your daily sales sessions</p>
          </div>
          
          {activeSession ? (
             <Button 
                onClick={() => navigate("/dashboard/pos/terminal")}
                className="bg-green-600 hover:bg-green-700 text-white rounded-2xl h-14 px-8 font-black text-lg shadow-xl shadow-green-500/20 flex gap-3"
             >
                <CheckCircle2 /> Continue Current Session
             </Button>
          ) : (
             <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 px-8 font-black text-lg shadow-xl shadow-blue-500/20 flex gap-3"
             >
                <PlayCircle /> Open New Session
             </Button>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Status Card */}
          <Card className="md:col-span-2 rounded-[40px] border-none shadow-sm dark:bg-gray-800 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <ShoppingCart size={200} />
              </div>
              <CardHeader className="p-10 pb-4">
                 <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">Active Terminal Status</CardTitle>
                 <div className="flex items-center gap-4 mt-4">
                    <div className={`w-4 h-4 rounded-full animate-pulse ${activeSession ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <h2 className="text-5xl font-black text-gray-900 dark:text-white">
                        {activeSession ? "TERMINAL ACTIVE" : "TERMINAL LOCKED"}
                    </h2>
                 </div>
              </CardHeader>
              <CardContent className="p-10 pt-6 space-y-8">
                  {activeSession ? (
                      <div className="grid grid-cols-2 gap-6">
                           <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl">
                               <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Started At</p>
                               <p className="text-xl font-bold">{new Date(activeSession.startTime).toLocaleTimeString()}</p>
                               <div className="flex items-center gap-2 mt-2 text-xs text-blue-600 font-bold">
                                  <Clock size={12} /> {new Date(activeSession.startTime).toLocaleDateString()}
                               </div>
                           </div>
                           <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl">
                               <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Opening Fund</p>
                               <p className="text-xl font-black">₹{activeSession.startingBalance.toFixed(2)}</p>
                               <div className="flex items-center gap-2 mt-2 text-xs text-green-600 font-bold uppercase">
                                  <Landmark size={12} /> Cash In Drawer
                               </div>
                           </div>
                      </div>
                  ) : (
                      <div className="bg-blue-50 dark:bg-blue-900/10 p-10 rounded-[32px] border-2 border-dashed border-blue-100 dark:border-blue-900/30 text-center">
                          <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                          <p className="text-gray-900 dark:text-white font-black text-lg mb-2">No shift currently active</p>
                          <p className="text-gray-500 text-sm italic">Click "Open New Session" above to start the point of sale window for today's trade.</p>
                      </div>
                  )}
              </CardContent>
          </Card>

          {/* Previous Audit Info */}
          <div className="space-y-6">
              <Card className="rounded-[32px] border-none shadow-sm dark:bg-gray-800">
                  <CardHeader className="p-8 pb-4 flex flex-row items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center">
                         <History className="w-5 h-5 text-gray-500" />
                      </div>
                      <CardTitle className="text-base font-black">Audit History</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-6">
                      <div className="space-y-2">
                           <p className="text-[10px] font-black text-gray-400 uppercase">Last Closing Sale</p>
                           <p className="text-3xl font-black text-blue-600">
                                ₹{lastSession ? (lastSession.totalSales || 0).toFixed(2) : "0.00"}
                           </p>
                      </div>
                      <div className="pt-4 border-t dark:border-gray-700 space-y-3">
                           <div className="flex justify-between items-center text-xs font-bold">
                               <span className="text-gray-400 uppercase">Status</span>
                               <span className="bg-gray-100 dark:bg-gray-900 px-3 py-1 rounded-full text-gray-600 uppercase tracking-tighter">
                                   {lastSession ? lastSession.status : "No Records"}
                               </span>
                           </div>
                           <div className="flex justify-between items-center text-xs font-bold">
                               <span className="text-gray-400 uppercase">Auditor</span>
                               <span className="text-gray-900 dark:text-white flex items-center gap-1">
                                  <User size={12} /> {lastSession ? "Admin" : "---"}
                               </span>
                           </div>
                      </div>
                  </CardContent>
              </Card>
          </div>
      </div>

      {/* Opening Session Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="rounded-[40px] max-w-md p-8 border-none dark:bg-gray-900 shadow-2xl">
              <DialogHeader>
                  <DialogTitle className="text-3xl font-black flex items-center gap-3">
                      <Landmark className="text-blue-600" /> Opening Fund
                  </DialogTitle>
                  <DialogDescription className="font-bold text-gray-400">
                      Enter the starting balance for your cash drawer today.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-8 space-y-4">
                  <div className="space-y-3">
                      <Label className="text-xs uppercase font-black tracking-widest text-gray-500">Opening Balance (INR ₹)</Label>
                      <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-400 group-focus-within:text-blue-600 transition-colors">₹</span>
                          <Input 
                              type="number"
                              value={startingBalance}
                              onChange={(e) => setStartingBalance(parseFloat(e.target.value) || 0)}
                              className="h-20 bg-gray-50 dark:bg-gray-800 border-none rounded-3xl text-3xl font-black pl-12 text-gray-900 dark:text-white focus-visible:ring-2 focus-visible:ring-blue-600 transition-all shadow-inner"
                              placeholder="0.00"
                          />
                      </div>
                  </div>
              </div>
              <DialogFooter>
                  <Button 
                    onClick={handleOpenSession} 
                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-xl shadow-xl shadow-blue-500/30 active:scale-95 transition-all"
                  >
                    CONFIRM & OPEN POS
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
