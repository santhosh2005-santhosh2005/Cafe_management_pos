import { useState, useEffect, useRef } from "react";
import { useGetOrdersQuery, useUpdateOrderMutation, useUpdateItemStatusMutation } from "@/services/orderApi";
import { socket } from "@/utils/socket";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, Flame, ChefHat, BellRing, XCircle } from "lucide-react";
import { toast } from "react-hot-toast";

const NEW_ORDER_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

export default function KitchenDisplay() {
  const { data: ordersData } = useGetOrdersQuery({ status: "pending,preparing,ready", limit: 50 });
  const [updateOrder] = useUpdateOrderMutation();
  const [updateItemStatus] = useUpdateItemStatusMutation();
  const [orders, setOrders] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (ordersData?.data) {
      const active = ordersData.data.filter((o: any) => ["pending", "preparing", "ready"].includes(o.status));
      setOrders(sortOrders(active));
    }
  }, [ordersData]);

  const sortOrders = (orderList: any[]) => {
    return [...orderList].sort((a, b) => {
      // Ready orders always go to the bottom of the "active" list if we want to focus on cooking
      if (a.status === "ready" && b.status !== "ready") return 1;
      if (b.status === "ready" && a.status !== "ready") return -1;
      
      // Higher priority score first
      const priorityDiff = (b.priorityScore || 0) - (a.priorityScore || 0);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then oldest first (FIFO within same priority)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  };

  useEffect(() => {
    socket.on("newOrder", (newOrder: any) => {
      setOrders((prev) => sortOrders([newOrder, ...prev]));
      toast.success("New Order Received!", { icon: "🔔" });
      if (audioRef.current) audioRef.current.play().catch(() => {});
    });

    socket.on("orderUpdated", (updatedOrder: any) => {
      setOrders((prev) => {
        if (["served", "cancelled", "completed"].includes(updatedOrder.status)) {
          return prev.filter(o => o._id !== updatedOrder._id);
        }
        const filtered = prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
        return sortOrders(filtered);
      });
    });

    // ── NEW: granular item-level sync ──────────────────────────────────────
    socket.on("itemStatusChanged", ({ orderId, updatedOrder }: any) => {
      setOrders((prev) => {
        const filtered = prev.map(o => o._id === orderId ? updatedOrder : o);
        return sortOrders(filtered);
      });
    });

    return () => {
      socket.off("newOrder");
      socket.off("orderUpdated");
      socket.off("itemStatusChanged");
    };
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string, confirmedTime?: number) => {
    try {
      const body: any = { status: newStatus };
      if (confirmedTime !== undefined) body.confirmedTime = confirmedTime;
      
      await updateOrder({ id, body }).unwrap();
      toast.success(`Order marked as ${newStatus}`);
    } catch {
      toast.error("Failed to update order status");
    }
  };

  /** Toggle a single item between 'unavailable' ↔ 'pending' */
  const handleItemUnavailable = async (orderId: string, itemId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "unavailable" ? "pending" : "unavailable";
    try {
      await updateItemStatus({ orderId, itemId, itemStatus: nextStatus }).unwrap();
      if (nextStatus === "unavailable") {
        toast.error("Item marked unavailable — bill auto-corrected!", { icon: "⚠️", duration: 4000 });
      } else {
        toast.success("Item restored — bill recalculated!", { icon: "✅" });
      }
    } catch {
      toast.error("Failed to update item status");
    }
  };

  const handleBoostPriority = async (id: string) => {
    try {
      await updateOrder({ id, body: { isPriorityBoosted: true } }).unwrap();
      toast.success("Order priority boosted!", { icon: "🚀" });
    } catch {
      toast.error("Failed to boost priority");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":   return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200";
      case "preparing": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200";
      case "ready":     return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200";
      default:          return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityBadge = (level: string) => {
    switch (level) {
      case "high": return <Badge className="bg-red-600 hover:bg-red-700 animate-pulse">URGENT 🔴</Badge>;
      case "medium": return <Badge className="bg-amber-500 hover:bg-amber-600">MEDIUM 🟡</Badge>;
      case "low": return <Badge className="bg-emerald-500 hover:bg-emerald-600">NORMAL 🟢</Badge>;
      default: return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50 dark:bg-black/40">
      <audio ref={audioRef} src={NEW_ORDER_SOUND} />

      {/* Header */}
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

      {/* Order Cards */}
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
                ${order.status === "preparing" ? "border-amber-400 shadow-amber-500/10 ring-2 ring-amber-400/20" : "dark:border-gray-800"}
                ${order.status === "ready"     ? "border-green-500 shadow-green-500/10" : ""}`}
            >
              {/* Card Header */}
              <div className="p-4 border-b dark:border-gray-800 flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{order.table?.name || "Take Away"}</h3>
                    {getPriorityBadge(order.priorityLevel)}
                  </div>
                  <p className="text-xs text-gray-500 font-mono flex items-center gap-2">
                    {order.customOrderID}
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">Score: {order.priorityScore?.toFixed(0)}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className={`font-bold capitalize px-3 py-1 ${getStatusColor(order.status)}`}>
                    {order.status}
                  </Badge>
                  {!order.isPriorityBoosted && order.status !== "ready" && (
                    <button 
                      onClick={() => handleBoostPriority(order._id)}
                      className="text-[10px] flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 transition-colors"
                    >
                      <BellRing className="w-2.5 h-2.5" /> BOOST
                    </button>
                  )}
                </div>
              </div>

              {/* Items List with per-item unavailable toggle */}
              <div className="flex-1 p-4 space-y-2 min-h-[150px]">
                {order.items.map((item: any) => {
                  const isUnavailable = item.itemStatus === "unavailable";
                  return (
                    <div
                      key={item._id}
                      className={`flex justify-between items-center rounded-xl px-3 py-2 transition-all ${
                        isUnavailable
                          ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 opacity-70"
                          : "bg-gray-50 dark:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex gap-2 items-center min-w-0">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-xs rounded-md shrink-0">
                          {item.quantity}x
                        </span>
                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${isUnavailable ? "line-through text-red-500" : ""}`}>
                            {item.product?.name}
                          </p>
                          <p className="text-[10px] text-gray-500">Size: {item.size}</p>
                        </div>
                        {isUnavailable && (
                          <span className="text-[9px] font-black uppercase text-red-600 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded-full shrink-0">
                            OUT
                          </span>
                        )}
                      </div>

                      {/* ⬅ Per-item unavailable button */}
                      <button
                        onClick={() => handleItemUnavailable(order._id, item._id, item.itemStatus || "pending")}
                        title={isUnavailable ? "Restore item" : "Mark unavailable"}
                        className={`shrink-0 ml-2 p-1.5 rounded-lg transition-all ${
                          isUnavailable
                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200"
                            : "bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200"
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 mt-auto border-t dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-500" />
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="font-black text-gray-800 dark:text-gray-200">
                    INR {order.totalPrice?.toFixed(2)}
                  </span>
                </div>

                {order.confirmedTime > 0 && (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/10 p-2 rounded-lg border border-green-100 dark:border-green-900/30">
                     <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-[10px] font-bold text-green-600 uppercase">Chef Confirmed</span>
                     </div>
                     <span className="text-xs font-black text-green-700">{order.confirmedTime} Mins</span>
                  </div>
                )}

                <div className="flex gap-2">
                  {order.status === "pending" && (
                    <div className="flex flex-col w-full gap-2">
                       <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 p-2 rounded-xl border border-blue-100 dark:border-blue-900/30">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-[10px] font-black text-blue-600 uppercase">Est. Prep Time (Mins)</span>
                          <input 
                            type="number" 
                            defaultValue={order.estimatedTime || 15}
                            id={`prep-time-${order._id}`}
                            className="w-12 h-8 bg-white dark:bg-gray-800 border rounded text-center font-bold text-xs"
                          />
                       </div>
                       <Button
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold"
                        onClick={() => {
                          const timeInput = document.getElementById(`prep-time-${order._id}`) as HTMLInputElement;
                          handleStatusUpdate(order._id, "preparing", parseInt(timeInput.value));
                        }}
                      >
                        <Flame className="w-4 h-4 mr-2" /> Confirm & Start
                      </Button>
                    </div>
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
