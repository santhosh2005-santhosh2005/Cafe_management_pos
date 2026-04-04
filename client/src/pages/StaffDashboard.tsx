import { useEffect } from "react";
import { useGetOrdersQuery, useConfirmDraftOrderMutation } from "@/services/orderApi";
import { socket } from "@/utils/socket";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ClipboardIcon, Edit3, Trash2, User } from "lucide-react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";

export default function StaffDashboard() {
  const user = useSelector((state: RootState) => state.user);
  const { data: ordersData, refetch } = useGetOrdersQuery({ status: "draft", limit: 50 });
  const [confirmOrder] = useConfirmDraftOrderMutation();
  
  // Only show orders assigned to this staff member
  const orders = (ordersData?.data || []).filter((o: any) => 
    o.responsibleStaff === user?.id || o.responsibleStaff?._id === user?.id
  );

  useEffect(() => {
    if (!user?.id) return;

    socket.on("orderUpdated", refetch);
    socket.on("newOrder", refetch);
    // Real-time listener for orders drafted for this specific staff
    socket.on(`newDraftOrder:${user.id}`, (order) => {
       refetch();
       toast.success(`New draft for Table #${order.table?.number || '?'}`);
    });

    return () => {
      socket.off("orderUpdated", refetch);
      socket.off("newOrder", refetch);
      socket.off(`newDraftOrder:${user.id}`);
    };
  }, [refetch, user?.id]);

  const handleConfirm = async (orderId: string) => {
    try {
      await confirmOrder(orderId).unwrap();
      toast.success("Order confirmed and sent to kitchen!");
    } catch (err) {
      toast.error("Failed to confirm order");
    }
  };

  const handleEdit = (order: any) => {
    Swal.fire({
       title: 'Review Items',
       html: `Order ${order.customOrderID} contains ${order.items.length} items. Manual editing logic to be integrated.`,
       icon: 'info',
       confirmButtonText: 'Understood'
    });
  };

  return (
    <div className="p-6 md:p-10 space-y-10 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-8 rounded-[40px] shadow-sm">
         <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white flex items-center gap-4">
               <User className="text-blue-600 w-10 h-10" /> Waiter Station
            </h1>
            <p className="text-gray-500 font-bold mt-1">Review customer drafts and managing table service.</p>
         </div>
         <div className="flex flex-col items-end">
            <Badge variant="outline" className="text-[10px] font-black py-1 px-4 border-blue-200 text-blue-600 bg-blue-50/50 mb-2">LIVE SYNC ACTIVE</Badge>
            <p className="text-3xl font-black text-blue-600">{orders.length} Drafts</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {orders.length === 0 ? (
           <div className="col-span-full py-20 text-center bg-gray-100 dark:bg-gray-800/50 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-gray-700">
              <ClipboardIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-black text-xl">No pending drafts to review.</p>
           </div>
        ) : (
          orders.map((order: any) => (
            <Card key={order._id} className="rounded-[40px] border-none shadow-xl dark:bg-gray-800 overflow-hidden group hover:scale-[1.02] transition-all">
              <CardHeader className="p-8 pb-4 flex flex-row justify-between items-start">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">TABLE {order.table?.tableNumber || "N/A"}</p>
                    <CardTitle className="text-xl font-black tracking-tighter">{order.customOrderID}</CardTitle>
                 </div>
                 <div className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full uppercase italic">Wait Review</div>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-6">
                <div className="space-y-3">
                   {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border dark:border-gray-700">
                         <div>
                            <p className="font-bold text-sm">{item.product?.name || "Product"}</p>
                            <p className="text-xs text-gray-500 font-bold">{item.size} x {item.quantity}</p>
                         </div>
                         <p className="font-extrabold text-blue-600 italic">INR {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                   ))}
                </div>

                <div className="flex flex-col gap-3 pt-4">
                   <div className="flex justify-between items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                      <span className="text-[10px] font-black text-blue-600 uppercase">Subtotal</span>
                      <span className="text-xl font-black text-blue-800 dark:text-blue-200 font-mono italic">INR {order.totalPrice.toFixed(2)}</span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => handleEdit(order)}
                        className="rounded-2xl h-14 border-2 font-black text-amber-600 hover:bg-amber-50 gap-2"
                      >
                         <Edit3 size={18} /> Edit
                      </Button>
                      <Button 
                        onClick={() => handleConfirm(order._id)}
                        className="rounded-2xl h-14 bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-500/20 gap-2"
                      >
                         <CheckCircle2 size={18} /> Confirm
                      </Button>
                   </div>
                   <Button variant="ghost" className="text-red-500 font-bold hover:bg-red-50 rounded-xl h-10 gap-2">
                       <Trash2 size={16} /> Discard Draft
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
