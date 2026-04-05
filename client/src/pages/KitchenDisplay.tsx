import { useState, useEffect, useRef } from "react";
import { useGetOrdersQuery, useUpdateOrderMutation, useUpdateItemStatusMutation } from "@/services/orderApi";
import { socket } from "@/utils/socket";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Clock, CheckCircle2, Flame, ChefHat, BellRing, XCircle, LayoutGrid, Zap, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import BrutalistButton from "../components/BrutalistButton";

const NEW_ORDER_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const TimingOverride = ({ orders, onSync }: { orders: any[], onSync: (id: string, time: number) => void }) => {
  const [selectedId, setSelectedId] = useState("");
  const [duration, setDuration] = useState(15);

  return (
    <div className="brutalist-card bg-golden-yellow p-8 border-l-[12px] border-deep-black w-full max-w-md">
      <div className="flex items-center gap-2 mb-6 border-b-4 border-deep-black pb-4">
        <Clock className="w-6 h-6" />
        <h3 className="text-2xl font-black italic tracking-tighter uppercase">Timing_Override</h3>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <p className="system-status text-[10px] font-bold opacity-60">[SELECT_TARGET_ENTITY]</p>
          <Select value={selectedId} onValueChange={setSelectedId} disabled={orders.length === 0}>
            <SelectTrigger className="h-16 border-4 border-deep-black bg-white rounded-none font-black italic text-lg focus:ring-0 disabled:opacity-50">
              <SelectValue placeholder={orders.length === 0 ? "NO_ORDERS_AVAILABLE" : `CHOOSE_ORDER (${orders.length})...`} />
            </SelectTrigger>
            <SelectContent className="border-4 border-deep-black rounded-none bg-white z-[1000] max-h-80 overflow-y-auto">
              {orders.length === 0 ? (
                <SelectItem value="none" disabled className="font-black italic">
                  NO_ACTIVE_ORDERS
                </SelectItem>
              ) : (
                orders.map(o => (
                  <SelectItem key={o._id} value={o._id} className="font-black italic hover:bg-golden-yellow transition-colors cursor-pointer py-4">
                    <span className="flex items-center gap-2">
                      <span className="bg-deep-black text-white px-2 py-0.5 text-[10px] rounded-none not-italic">
                        {o.table?.tableNumber || o.table?.number || o.table?.name || 'TAKEAWAY'}
                      </span>
                      {o.customOrderID?.slice(-6) || o._id.slice(-6)}
                    </span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="system-status text-[10px] font-bold opacity-60">[TARGET_DURATION_MINS]</p>
          <div className="relative">
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className="h-24 border-4 border-deep-black bg-white rounded-none text-6xl font-black italic text-right pr-8 focus:ring-0"
            />
          </div>
        </div>

        <button
          onClick={() => onSync(selectedId, duration)}
          disabled={!selectedId}
          className="w-full h-20 bg-deep-black text-white font-black italic text-xl uppercase hover:bg-white hover:text-deep-black border-4 border-deep-black transition-all disabled:opacity-30"
        >
          Broadcast_Sync
        </button>
      </div>
    </div>
  );
};

export default function KitchenDisplay() {
  const { data: ordersData, isLoading, refetch } = useGetOrdersQuery({ status: "pending,preparing,ready", limit: 50 });
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
    const handleNewOrder = (newOrder: any) => {
      if (["pending", "preparing", "ready"].includes(newOrder.status)) {
        setOrders((prev) => {
          const exists = prev.some(o => o._id === newOrder._id);
          if (exists) return prev.map(o => o._id === newOrder._id ? newOrder : o);
          return sortOrders([newOrder, ...prev]);
        });
        toast.success("New Order Received!", { icon: "🔔" });
        if (audioRef.current) audioRef.current.play().catch(() => { });
      }
    };

    const handleOrderConfirmed = (confirmedOrder: any) => {
      setOrders((prev) => {
        const exists = prev.some(o => o._id === confirmedOrder._id);
        if (exists) return prev.map(o => o._id === confirmedOrder._id ? confirmedOrder : o);
        return sortOrders([confirmedOrder, ...prev]);
      });
      toast.success(`Order ${confirmedOrder.customOrderID} sent to kitchen!`, { icon: "🔥" });
      if (audioRef.current) audioRef.current.play().catch(() => { });
    };

    const handleOrderUpdated = (updatedOrder: any) => {
      setOrders((prev) => {
        if (["served", "cancelled", "completed"].includes(updatedOrder.status)) {
          return prev.filter(o => o._id !== updatedOrder._id);
        }
        
        const exists = prev.some(o => o._id === updatedOrder._id);
        if (!exists && ["pending", "preparing", "ready"].includes(updatedOrder.status)) {
           return sortOrders([...prev, updatedOrder]);
        }

        const filtered = prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
        return sortOrders(filtered);
      });
    };

    const handleItemStatusChanged = ({ orderId, updatedOrder }: any) => {
      setOrders((prev) => {
        const filtered = prev.map(o => o._id === orderId ? updatedOrder : o);
        return sortOrders(filtered);
      });
    };

    socket.on("newOrder", handleNewOrder);
    socket.on("orderConfirmed", handleOrderConfirmed);
    socket.on("orderUpdated", handleOrderUpdated);
    socket.on("itemStatusChanged", handleItemStatusChanged);

    return () => {
      socket.off("newOrder", handleNewOrder);
      socket.off("orderConfirmed", handleOrderConfirmed);
      socket.off("orderUpdated", handleOrderUpdated);
      socket.off("itemStatusChanged", handleItemStatusChanged);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-black/40">
        <div className="w-20 h-20 border-8 border-golden-yellow border-t-transparent rounded-full animate-spin mb-8"></div>
        <p className="text-4xl font-black italic tracking-tighter uppercase animate-pulse">Syncing_KDS_Stream...</p>
      </div>
    );
  }

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
      case "pending": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200";
      case "preparing": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200";
      case "ready": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200";
      default: return "bg-gray-100 text-gray-700";
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

      {/* Header / KDS Sync Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Left: Timing Override Panel */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border-l-[10px] border-deep-black">
            <div className="p-4 bg-deep-black text-white rounded-2xl">
              <LayoutGrid size={32} />
            </div>
            <div className="flex-1">
              <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">System_KDS</h1>
              <div className="system-status text-[10px] font-bold text-red-500 mt-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 animate-pulse"></div> Protocol_Active
              </div>
            </div>
            <button 
              onClick={() => refetch()}
              className="p-4 border-4 border-deep-black hover:bg-golden-yellow transition-all"
              title="Manual Sync"
            >
              <RefreshCw size={24} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>

          <TimingOverride
            orders={orders.filter(o => o.status === 'pending' || o.status === 'preparing')}
            onSync={(id, time) => handleStatusUpdate(id, "preparing", time)}
          />
        </div>

        {/* Right: Kitchen State Monitor */}
        <div className="brutalist-card bg-white p-12 flex flex-col items-center justify-center min-h-[400px] border-deep-black border-4 shadow-none">
          <div className={`w-24 h-24 border-4 border-deep-black flex items-center justify-center mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${orders.filter(o => o.status === 'pending').length > 0 ? 'bg-red-500 animate-pulse' : 'bg-golden-yellow'}`}>
            <ChefHat size={48} className="text-deep-black" />
          </div>
          <h2 className="text-7xl font-black italic tracking-tight uppercase">
            Kitchen_State: <span className={orders.filter(o => o.status === 'pending').length > 0 ? 'text-red-500' : 'text-golden-yellow'}>
              {orders.filter(o => o.status === 'pending').length > 0 ? 'Active' : 'Ideal'}
            </span>
          </h2>
          <p className="system-status text-xs tracking-[0.4em] opacity-30 mt-8 uppercase font-bold italic">
            {orders.length > 0 ? 'Operational_Load_Detected' : 'No_Active_Authorizations_Required'}
          </p>

          <div className="grid grid-cols-2 gap-8 mt-16 w-full max-w-lg">
            <div className={`text-center p-8 border-4 border-deep-black ${orders.filter(o => o.status === "pending").length > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50'}`}>
              <p className="system-status text-[10px] font-black uppercase mb-2">Pending_Transmissions</p>
              <p className="text-6xl font-black italic">{orders.filter(o => o.status === "pending").length}</p>
            </div>
            <div className={`text-center p-8 border-4 border-deep-black ${orders.filter(o => o.status === "preparing").length > 0 ? 'bg-golden-yellow' : 'bg-gray-50'}`}>
              <p className="system-status text-[10px] font-black uppercase mb-2">Cooking_Units</p>
              <p className="text-6xl font-black italic">{orders.filter(o => o.status === "preparing").length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Order Grid */}
      <div className="mb-8 border-b-8 border-deep-black pb-4 flex items-center gap-4">
        <Zap className="text-golden-yellow" />
        <h2 className="text-4xl font-black italic tracking-tighter uppercase">Live_Operational_Queue</h2>
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
                ${order.status === "preparing" ? "border-amber-400 shadow-amber-500/10 ring-2 ring-amber-400/20" : "dark:border-gray-800"}
                ${order.status === "ready" ? "border-green-500 shadow-green-500/10" : ""}`}
            >
              {/* Card Header */}
              <div className="p-4 border-b dark:border-gray-800 flex justify-between items-start">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{order.table?.tableNumber || order.table?.number || order.table?.name || "Take Away"}</h3>
                      {getPriorityBadge(order.priorityLevel)}
                    </div>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] text-white bg-deep-black px-2 py-1 font-black uppercase tracking-widest leading-none">
                      {order.customOrderID ? order.customOrderID.slice(-8) : order._id.slice(-8)}
                    </p>
                    <Badge className="bg-gray-100 text-deep-black border-2 border-deep-black text-[10px] font-black rounded-none">
                      SCORE: {order.priorityScore?.toFixed(0) || 0}
                    </Badge>
                  </div>
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
                      className={`flex justify-between items-center rounded-xl px-3 py-2 transition-all ${isUnavailable
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
                        className={`shrink-0 ml-2 p-1.5 rounded-lg transition-all ${isUnavailable
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
                      <BrutalistButton
                        className="w-full h-20 text-xl font-black italic uppercase"
                        variant="accent"
                        onClick={() => {
                          const timeInput = document.getElementById(`prep-time-${order._id}`) as HTMLInputElement;
                          const prepTime = parseInt(timeInput.value) || 15;
                          handleStatusUpdate(order._id, "preparing", prepTime);
                        }}
                      >
                        <Flame className="w-6 h-6 mr-3" /> AUTHORIZE_START
                      </BrutalistButton>
                    </div>
                  )}
                  {order.status === "preparing" && (
                    <BrutalistButton
                      className="w-full h-20 text-xl bg-electric-lime text-deep-black"
                      onClick={() => handleStatusUpdate(order._id, "ready")}
                    >
                      <CheckCircle2 className="w-6 h-6 mr-3" /> BROADCAST_READY
                    </BrutalistButton>
                  )}
                  {order.status === "ready" && (
                    <BrutalistButton
                      className="w-full h-20 text-xl"
                      variant="primary"
                      onClick={() => handleStatusUpdate(order._id, "served")}
                    >
                      <CheckCircle2 className="w-6 h-6 mr-3" /> ARCHIVE_SESSION
                    </BrutalistButton>
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
