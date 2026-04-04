import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store";
import { setSession } from "../store/userSlice";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

const SessionGuard = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { sessionId, token } = useSelector((state: RootState) => state.user);
  const [showModal, setShowModal] = useState(false);
  const [startingBalance, setStartingBalance] = useState("0");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkActiveSession = async () => {
      if (!token) return;
      
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
        const res = await axios.get(`${apiUrl}/api/sessions/active`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.session) {
          dispatch(setSession(res.data.session._id));
        } else {
          setShowModal(true);
        }
      } catch (error) {
        console.error("Failed to check session", error);
      }
    };

    if (!sessionId && token) {
      checkActiveSession();
    }
  }, [sessionId, token, dispatch]);

  const handleOpenSession = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const res = await axios.post(`${apiUrl}/api/sessions/open`, 
        { startingBalance: parseFloat(startingBalance) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        dispatch(setSession(res.data.session._id));
        setShowModal(false);
        toast.success("Session opened successfully!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to open session");
    } finally {
      setLoading(false);
    }
  };

  if (!sessionId && token) {
    return (
      <>
        <Dialog open={showModal} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Open POS Session</DialogTitle>
              <DialogDescription>
                Welcome back! Please enter your starting cash balance to begin your shift.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="balance" className="text-right">
                  Starting Cash
                </Label>
                <Input
                  id="balance"
                  type="number"
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(e.target.value)}
                  className="col-span-3"
                  placeholder="0.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleOpenSession} disabled={loading}>
                {loading ? "Opening..." : "Open Session"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <p className="text-gray-500 italic">Waiting for session to open...</p>
        </div>
      </>
    );
  }

  return <>{children}</>;
};

export default SessionGuard;
