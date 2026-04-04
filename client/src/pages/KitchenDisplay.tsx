import { useState, useEffect, useRef } from "react";
import { useGetOrdersQuery, useUpdateOrderMutation } from "@/services/orderApi";
import { socket } from "@/utils/socket";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, Flame, ChefHat, BellRing } from "lucide-react";
import { toast } from "react-hot-toast";

// Sound for new orders
const NEW_ORDER_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export default function KitchenDisplay() {
  const { data: ordersData } = useGetOrdersQuery({ status: "pending,preparing,ready", limit: 50 });
  const [updateOrder] = useUpdateOrderMutation();
  const [orders, setOrders] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (ordersData?.data) {
      setOrders(ordersData.data.filter((o: any) => ["pending", "preparing", "ready"].includes(o.status)));
    }
  }, [ordersData]);

  useEffect(() => {
    // Listen for new orders
    socket.on("newOrder", (newOrder: any) => {
      setOrders((prev) => [newOrder, ...prev]);
      toast.success("New Order Received!", { icon: "🔔" });
      if (audioRef.current) audioRef.current.play().catch(() => {});
    });

    // Listen for order updates
    socket.on("orderUpdated", (updatedOrder: any) => {
      setOrders((prev) => {
        if (["served", "cancelled", "completed"].includes(updatedOrder.status)) {
           return prev.filter(o => o._id !== updatedOrder._id);
        }
        return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
      });
    });

    return () => {
      socket.off("newOrder");
      socket.off("orderUpdated");
    };
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateOrder({ id, body: { status: newStatus } }).unwrap();
      toast.success(`Order marked as ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update order status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200";
      case "preparing": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200";
      case "ready": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-black/40">
      <audio ref={audioRef} src={NEW_ORDER_SOUND} />
      
      <div className="flex justify-between items-center mb-8 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border dark:border-gray-800">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                <ChefHat className="w-8 h-8" />
            </div>
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Kitchen Display</h1>
                <p className="text-gray-500 text-sm flex items-center gap-1">
                    <BellRing className="w-3 h-3 text-green-500" /> Live Connection Active
                </p>
            </div>
        </div>
        <div className="flex gap-4">
            <div className="text-center px-4 py-2 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                <p className="text-xs font-bold text-red-600 uppercase">Pending</p>
                <p className="text-xl font-bold">{orders.filter(o => o.status === "pending").length}</p>
            </div>
            <div className="text-center px-4 py-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
                <p className="text-xs font-bold text-amber-600 uppercase">Cooking</p>
                <p className="text-xl font-bold">{orders.filter(o => o.status === "preparing").length}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {orders.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4 bg-white dark:bg-gray-900 rounded-3xl border border-dashed dark:border-gray-800">
             <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <ChefHat className="w-10 h-10 text-gray-400" />
             </div>
             <p className="text-xl font-medium text-gray-500">No active orders. Kitchen is clear!</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className={`relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-sm border transition-all duration-300 transform hover:scale-[1.01] overflow-hidden 
              ${order.status === 'preparing' ? 'border-amber-400 shadow-amber-500/10 ring-2 ring-amber-400/20' : 'dark:border-gray-800'}
              ${order.status === 'ready' ? 'border-green-500 shadow-green-500/10' : ''}`}
            >
              {/* Header */}
              <div className="p-4 border-b dark:border-gray-800 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{order.table?.name || "Take Away"}</h3>
                  <p className="text-xs text-gray-500 font-mono">{order.customOrderID}</p>
                </div>
                <Badge variant="outline" className={`font-bold capitalize px-3 py-1 ${getStatusColor(order.status)}`}>
                  {order.status}
                </Badge>
              </div>

              {/* Items Section */}
              <div className="flex-1 p-4 space-y-3 min-h-[150px]">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center group">
                    <div className="flex gap-3">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-xs rounded-md">
                            {item.quantity}x
                        </span>
                        <div>
                            <p className="text-sm font-bold group-hover:text-blue-600 transition-colors">{item.product?.name}</p>
                            <p className="text-[10px] text-gray-500">Size: {item.size}</p>
                        </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer / Actions */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 mt-auto border-t dark:border-gray-800 space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <Clock className="w-3 h-3 text-blue-500" />
                    Ordered {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                
                <div className="flex gap-2">
                    {order.status === "pending" && (
                        <Button 
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold"
                            onClick={() => handleStatusUpdate(order._id, "preparing")}
                        >
                            <Flame className="w-4 h-4 mr-2" /> Start Cooking
                        </Button>
                    )}
                    {order.status === "preparing" && (
                        <Button 
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                            onClick={() => handleStatusUpdate(order._id, "ready")}
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Ready
                        </Button>
                    )}
                    {order.status === "ready" && (
                        <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            onClick={() => handleStatusUpdate(order._id, "served")}
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Picked Up
                        </Button>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
