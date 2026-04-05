import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import type { RootState } from "@/store";
import { useGetOrdersQuery } from "@/services/orderApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ShoppingCart, 
  Clock, 
  Package, 
  CheckCircle2, 
  XCircle,
  Timer,
  Calendar,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending:   { bg: "bg-yellow-500",  text: "PENDING",   icon: Clock },
  preparing: { bg: "bg-orange-500",  text: "PREPARING", icon: Timer },
  served:    { bg: "bg-green-600",   text: "SERVED",    icon: CheckCircle2 },
  cancelled: { bg: "bg-red-600",     text: "CANCELLED", icon: XCircle },
} as const;

export default function CustomerHistory() {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.user);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Fetch orders for the current user
  const { data: response, isLoading } = useGetOrdersQuery({
    limit: 50,
    // Assuming backend filters by user if customer role
  });

  const orders = response?.data || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-black text-white flex flex-col items-center justify-center font-black">
        <div className="w-20 h-20 border-8 border-golden-yellow border-t-transparent rounded-full animate-spin mb-8"></div>
        <p className="text-4xl italic tracking-tighter uppercase animate-pulse">Retrieving_Records...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] selection:bg-golden-yellow selection:text-deep-black pb-20">
      
      {/* HEADER */}
      <div className="bg-deep-black text-white p-8 border-b-8 border-golden-yellow sticky top-0 z-50">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="space-y-1">
            <p className="font-mono text-[10px] text-golden-yellow uppercase tracking-[0.3em]">Vault_Access: {user?.name || "GUEST"}</p>
            <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">ORDER_HISTORY.</h1>
          </div>
          <button 
            onClick={() => navigate("/customer-display")}
            className="bg-white text-deep-black p-4 border-4 border-deep-black shadow-[4px_4px_0px_0px_#F5B400] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-2 font-black uppercase italic text-xs"
          >
            <ChevronLeft size={20} /> Back_to_Portal
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-12">
        
        {/* SUMMARY STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-white border-4 border-deep-black p-8 shadow-[8px_8px_0px_0px_#000]">
              <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-2">Total_Orders</p>
              <h3 className="text-5xl font-black italic">{orders.length}</h3>
           </div>
           <div className="bg-white border-4 border-deep-black p-8 shadow-[8px_8px_0px_0px_#F5B400]">
              <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-2">Last_Transaction</p>
              <h3 className="text-2xl font-black italic uppercase truncate">
                {orders[0] ? new Date(orders[0].createdAt).toLocaleDateString() : "NONE"}
              </h3>
           </div>
           <div className="bg-deep-black text-white border-4 border-deep-black p-8 shadow-[8px_8px_0px_0px_#F5B400]">
              <p className="font-mono text-[10px] text-golden-yellow uppercase tracking-widest mb-2">Account_Status</p>
              <h3 className="text-3xl font-black italic uppercase">ACTIVE_MEMBER</h3>
           </div>
        </div>

        {/* ORDERS LIST */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 border-b-4 border-deep-black pb-4">
             <Package className="text-golden-yellow" size={32} />
             <h2 className="text-4xl font-black italic uppercase">01. Recent_Transactions</h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {orders.length === 0 ? (
              <div className="bg-white border-4 border-dashed border-deep-black p-20 text-center">
                 <p className="text-gray-400 font-black italic uppercase text-2xl">No_Records_Found_In_Vault</p>
              </div>
            ) : (
              orders.map((order: any) => {
                const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                return (
                  <Card 
                    key={order._id}
                    onClick={() => setSelectedOrder(order)}
                    className="cursor-pointer border-4 border-deep-black bg-white rounded-none shadow-[8px_8px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row">
                       <div className={cn("w-full md:w-48 flex flex-col items-center justify-center p-8 text-white", config.bg)}>
                          <config.icon size={48} className="mb-4" />
                          <span className="font-black italic uppercase tracking-tighter text-xl">{config.text}</span>
                       </div>
                       
                       <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
                          <div className="space-y-1">
                             <p className="font-mono text-[8px] text-gray-400 uppercase tracking-widest">Tracking_ID</p>
                             <p className="text-2xl font-black italic uppercase truncate">#{(order.customOrderID || order._id).substring(0, 10)}</p>
                          </div>
                          
                          <div className="space-y-1">
                             <p className="font-mono text-[8px] text-gray-400 uppercase tracking-widest">Date_Time</p>
                             <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-golden-yellow" />
                                <span className="font-black text-sm">{new Date(order.createdAt).toLocaleDateString()}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <Clock size={14} className="text-golden-yellow" />
                                <span className="font-black text-sm">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             </div>
                          </div>

                          <div className="space-y-1">
                             <p className="font-mono text-[8px] text-gray-400 uppercase tracking-widest">Item_Count</p>
                             <p className="text-2xl font-black italic">{order.items?.length || 0} UNITS</p>
                          </div>

                          <div className="text-right space-y-1">
                             <p className="font-mono text-[8px] text-gray-400 uppercase tracking-widest">Total_Investment</p>
                             <p className="text-4xl font-black italic tracking-tighter text-deep-black">INR {order.totalPrice}</p>
                          </div>
                       </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ORDER DETAIL MODAL */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-deep-black/90 z-[100] flex items-center justify-center p-8 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border-8 border-deep-black w-full max-w-2xl relative shadow-[20px_20px_0px_0px_#F5B400]"
            >
              <button 
                onClick={() => setSelectedOrder(null)}
                className="absolute -top-6 -right-6 bg-red-500 text-white p-4 border-4 border-deep-black shadow-[4px_4px_0px_0px_#000]"
              >
                <XCircle size={24} />
              </button>

              <div className="p-8 bg-deep-black text-white border-b-4 border-deep-black">
                 <p className="font-mono text-[10px] text-golden-yellow uppercase tracking-[0.4em] mb-2">Record_Details</p>
                 <h2 className="text-5xl font-black italic uppercase tracking-tighter">ORDER_MANIFEST.</h2>
              </div>

              <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-2 gap-8 border-b-4 border-deep-black pb-8">
                    <div>
                       <p className="font-mono text-[8px] text-gray-400 uppercase tracking-widest mb-1">Status</p>
                       <p className="text-2xl font-black italic uppercase text-blue-600">{selectedOrder.status}</p>
                    </div>
                    <div className="text-right">
                       <p className="font-mono text-[8px] text-gray-400 uppercase tracking-widest mb-1">Payment</p>
                       <p className="text-2xl font-black italic uppercase">{selectedOrder.paymentMethod || "CASH"}</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    {selectedOrder.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-4 border-2 border-deep-black bg-gray-50">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-deep-black text-golden-yellow flex items-center justify-center font-black">{item.quantity}x</div>
                            <span className="font-black uppercase italic">{item.product?.name || "DELETED_ITEM"}</span>
                         </div>
                         <span className="font-black">INR {item.price * item.quantity}</span>
                      </div>
                    ))}
                 </div>

                 <div className="bg-golden-yellow border-4 border-deep-black p-6 flex justify-between items-center">
                    <span className="text-2xl font-black italic uppercase tracking-tighter">Grand_Total</span>
                    <span className="text-4xl font-black italic tracking-tighter">INR {selectedOrder.totalPrice}</span>
                 </div>
              </div>
              
              <div className="p-8 bg-gray-50 border-t-4 border-deep-black">
                 <Button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-full h-16 bg-deep-black text-white rounded-none font-black uppercase italic text-xl hover:bg-golden-yellow hover:text-deep-black transition-all border-4 border-deep-black shadow-[6px_6px_0px_0px_#F5B400] active:shadow-none"
                 >
                   Close_Manifest
                 </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
