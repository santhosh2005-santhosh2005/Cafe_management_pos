import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useGetFloorsQuery } from "@/services/floorApi";
import { useGetTablesQuery, useUpdateTableStatusMutation } from "@/services/tableApi";
import { useCreateOrderMutation, useGetOrdersQuery, useUpdateOrderMutation } from "@/services/orderApi";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { 
  ArrowLeft,
  Activity
} from "lucide-react";
import BrutalistButton from "@/components/BrutalistButton";
import ProductCard from "@/components/SelectedProduct";
import Categories from "@/components/CategoryBar";
import { useGetCategoriesQuery } from "@/services/categoryApi";
import { useGetProductsByCategoryQuery, useGetProductsQuery } from "@/services/productApi";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store";
import { clearCart } from "@/store/cartSlice";

type Phase = "location" | "station" | "menu" | "checkout" | "tracking";

const Sidebar = ({ title, highlight, sub, backAction }: { title: string, highlight?: string, sub: string, backAction?: () => void }) => (
  <div className="w-full md:w-[30%] lg:w-[25%] bg-deep-black text-white p-12 flex flex-col justify-between border-r-[10px] border-golden-yellow">
    <div>
      <div className="w-20 h-20 bg-white p-2 mb-16 shadow-[8px_8px_0px_0px_#F5B400]">
         <img src="/logo.png" alt="Cafe Sync" className="w-full h-full object-contain" />
      </div>
      <h1 className="text-7xl lg:text-8xl font-heading leading-[0.8] mb-12">
         <span className="block">{title}</span>
         {highlight && <span className="text-golden-yellow block">{highlight}</span>}
         <span className="block italic">{sub}</span>
      </h1>
      
      <p className="system-status text-[10px] text-white/30 uppercase tracking-[0.2em] leading-relaxed">
         [ ACCESS_PROTOCOL_INITIATED ]<br />
         VERSION: 2.1.0 - BRUTALIST EDITION<br />
         ENCRYPTED SESSION MANAGEMENT
      </p>
    </div>

    {backAction && (
      <button 
        onClick={backAction}
        className="group flex items-center gap-3 font-heading italic text-xl uppercase text-golden-yellow hover:pl-4 transition-all"
      >
        <ArrowLeft size={24} /> 
        CHANGE_PARAM
      </button>
    )}
  </div>
);

const SectionHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div className="mb-12">
     <p className="system-status mb-4 tracking-[0.4em] opacity-40">{subtitle}</p>
     <h2 className="text-6xl font-heading leading-none uppercase italic border-b-4 border-deep-black pb-4">{title}</h2>
  </div>
);

export default function SelfOrdering() {
  const { tableId: initialTableId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [phase, setPhase] = useState<Phase>("location");
  const [selectedFloor, setSelectedFloor] = useState<any>(null);
  const [activeOrderIds, setActiveOrderIds] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem("customer_order_history") || "[]");
  });

  const { data: floorsData } = useGetFloorsQuery();
  const floors = floorsData || [];
  const { data: tablesData } = useGetTablesQuery();
  const tables = tablesData?.data || [];

  const { items: cartItems, totalPrice: cartTotal } = useSelector((state: RootState) => state.cart);

  // Auto-detect table if URL param exists
  useEffect(() => {
    if (initialTableId && tables.length > 0) {
      const table = tables.find((t: any) => t._id === initialTableId || t.tableName === initialTableId);
      if (table) {
        localStorage.setItem("session_table", JSON.stringify(table));
        const floor = floors.find((f: any) => f._id === table.floor || f.name === table.floor);
        setSelectedFloor(floor || { name: "DETECTED" });
        setPhase("menu");
      }
    } else {
        const storedTable = JSON.parse(localStorage.getItem("session_table") || "null");
        if (storedTable) {
            setSelectedFloor(JSON.parse(localStorage.getItem("session_floor") || "null"));
            setPhase("menu");
        }
    }
  }, [initialTableId, tables, floors]);

  const handleSelectTable = (table: any) => {
    localStorage.setItem("session_table", JSON.stringify(table));
    localStorage.setItem("session_floor", JSON.stringify(selectedFloor));
    setPhase("menu");
  };

  const handleNewOrder = () => {
     localStorage.removeItem("session_table");
     localStorage.removeItem("session_floor");
     setSelectedFloor(null);
     setPhase("location");
  };

  // ── PHASE 1: FLOOR SELECTION ──
  if (phase === "location") {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-rich-cream">
        <Sidebar title="SELECT." highlight="LEVEL." sub="LOCATION." />
        <div className="flex-1 p-12 lg:p-20 overflow-y-auto">
          <SectionHeader title="FLOOR_SELECTION_V2.0" subtitle="INITIALIZING_GRID..." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {floors.map((floor: any) => (
              <button 
                key={floor._id}
                onClick={() => { setSelectedFloor(floor); setPhase("station"); }}
                className="brutalist-card bg-white p-16 group hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all flex flex-col items-center justify-center min-h-[300px]"
              >
                <h3 className="text-6xl font-heading uppercase italic mb-4">{floor.name}</h3>
                <p className="system-status text-[10px] tracking-widest opacity-40">[ FLOOR_PROTOCOL_LOADED ]</p>
              </button>
            ))}
          </div>
          {activeOrderIds.length > 0 && (
             <div className="mt-20 flex justify-end">
                <button onClick={() => setPhase("tracking")} className="font-heading italic border-b-4 border-deep-black text-2xl hover:text-golden-yellow transition-colors">TRACK_EXISTING_SESSION</button>
             </div>
          )}
        </div>
      </div>
    );
  }

  // ── PHASE 2: STATION SELECTION ──
  if (phase === "station") {
    const filteredTables = tables.filter((t: any) => t.floor === selectedFloor?._id || t.floor === selectedFloor?.name);
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-rich-cream">
        <Sidebar 
          title="SELECT." 
          highlight="STATION." 
          sub="MAP." 
          backAction={() => setPhase("location")}
        />
        <div className="flex-1 p-12 lg:p-20 overflow-y-auto">
          <SectionHeader title={`${selectedFloor?.name}_STATIONS`} subtitle={`FILTERED_BY_FLOOR: ${selectedFloor?.name}`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTables.map((table: any) => (
              <button 
                key={table._id}
                onClick={() => handleSelectTable(table)}
                className="brutalist-card bg-white p-12 group hover:translate-x-2 hover:translate-y-2 hover:shadow-none transition-all"
              >
                <p className="system-status text-[8px] opacity-20 mb-10">[ STATION_ID_{table._id.slice(-4).toUpperCase()} ]</p>
                <div className="flex flex-col items-center py-10">
                   <h3 className="text-7xl font-heading mb-4 leading-none">{table.tableName}</h3>
                   <span className={`px-4 py-1 font-mono text-[10px] ${table.status === 'occupied' ? 'bg-deep-black text-red-500' : 'bg-deep-black text-electric-lime'}`}>
                     {table.status === 'occupied' ? 'RESTRICTED' : 'ACCESS_GRANTED'}
                   </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE 3: MENU / COLLECTION ──
  if (phase === "menu") {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-rich-cream">
        <Sidebar title="RESTAURANT." highlight="TECH" sub="NIQUE." backAction={() => setPhase("station")} />
        <div className="flex-1 flex flex-col h-screen">
           <div className="p-12 lg:p-20 overflow-y-auto flex-1">
             <SectionHeader title="THE COLLECTION" subtitle="LIVE_INVENTORY" />
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <MenuContent />
             </div>
           </div>
           
           {/* Manifest Footer */}
           {cartItems.length > 0 && (
             <div className="p-8 bg-forest-green border-t-[8px] border-deep-black flex justify-between items-center">
                <div>
                   <p className="system-status text-electric-lime text-xs">[ MANIFEST_CONTENTS: {cartItems.length} UNITS ]</p>
                   <h4 className="text-white text-4xl font-heading italic">INR {cartTotal}/-</h4>
                </div>
                <BrutalistButton variant="primary" size="lg" onClick={() => setPhase("checkout")} className="bg-electric-lime border-white">
                   VERIFY_MANIFEST
                </BrutalistButton>
             </div>
           )}
        </div>
      </div>
    );
  }

  // ── PHASE 4: CHECKOUT / VERIFICATION ──
  if (phase === "checkout") {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-rich-cream">
        <Sidebar title="ORDERING." highlight="TECH" sub="NIQUE." backAction={() => setPhase("menu")} />
        <div className="flex-1 p-12 lg:p-20 overflow-y-auto">
          <SectionHeader title="VERIFICATION" subtitle="IDENTITY_VERIFIED_SESSION" />
          
          <div className="flex flex-col lg:flex-row gap-12 items-start justify-center">
             {/* Cart Receipt */}
             <div className="brutalist-card bg-white p-12 w-full lg:max-w-md">
                <p className="system-status mb-8 opacity-40">[ CART_CONTENTS ]</p>
                <div className="space-y-6 mb-12">
                   {cartItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-end border-b-2 border-dotted border-deep-black pb-2">
                         <span className="font-heading uppercase italic text-xl">{item.name} <span className="text-golden-yellow">X{item.quantity}</span></span>
                         <span className="font-bold text-2xl">₹{item.price * item.quantity}</span>
                      </div>
                   ))}
                </div>
                <div className="pt-8">
                   <p className="system-status text-xs opacity-40">TOTAL_PAYABLE</p>
                   <h3 className="text-7xl font-heading leading-none italic">₹{cartTotal}</h3>
                </div>
             </div>

             {/* Payment Action */}
             <div className="w-full lg:max-w-md space-y-8">
                <div className="brutalist-card bg-white p-12 flex flex-col items-center">
                   <p className="system-status mb-8 text-golden-yellow">[ SCAN_TO_SETTLE ]</p>
                   <div className="w-64 h-64 border-4 border-deep-black p-4 mb-4">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=charan@upi&pn=CAFE_SYNC&am=${cartTotal}`} alt="UPI" className="w-full h-full" />
                   </div>
                   <p className="system-status text-[8px] opacity-40 mt-4 text-center">WORKS WITH ALL UPI APPS<br/>GPAY / PHONEPE / PAYTM</p>
                   
                   <BrutalistButton className="w-full mt-10 bg-deep-black text-white h-20" onClick={() => toast.success("PAYMENT_SIGNAL_SENT")}>
                      I_HAVE_PAID
                   </BrutalistButton>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                   <button onClick={() => setPhase("menu")} className="h-20 brutalist-card bg-white font-heading uppercase text-sm">EDIT_ORDER</button>
                   <OrderPlacementButton onOrderCreated={(id) => {
                      setActiveOrderIds(prev => {
                        const newIds = [...prev, id];
                        localStorage.setItem("customer_order_history", JSON.stringify(newIds));
                        return newIds;
                      });
                      setPhase("tracking");
                      dispatch(clearCart());
                   }} />
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE 5: TRACKING / LIVE QUEUE ──
  if (phase === "tracking") {
    return (
       <LiveTrackingView activeIds={activeOrderIds} onBack={handleNewOrder} onModify={() => setPhase("menu")} />
    );
  }

  return null;
}

// ── SUBCOMPONENTS ──

function MenuContent() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: rawProducts, isLoading: prodLoading } = activeCategory
    ? useGetProductsByCategoryQuery(activeCategory)
    : useGetProductsQuery();

  const products = useMemo(() => {
    if (!rawProducts) return [];
    const list = Array.isArray(rawProducts) ? rawProducts : (rawProducts as any).data || [];
    return list;
  }, [rawProducts]);

  if (prodLoading) return <p className="font-heading italic opacity-20">LOAD_INVENTORY...</p>;

  return (
    <div className="col-span-full space-y-12">
       <div className="flex flex-col md:flex-row gap-8 items-center border-b-8 border-deep-black pb-8">
          <div className="flex-1 w-full flex gap-4 overflow-x-auto no-scrollbar">
             <Categories 
               categories={categories} 
               activeCategory={activeCategory} 
               setActiveCategory={setActiveCategory} 
               catLoading={false} 
             />
          </div>
          <div className="relative w-full md:w-80">
             <input 
               placeholder="SEARCH_THE_COLLECTION..."
               className="w-full h-16 border-4 border-deep-black bg-white px-8 italic uppercase font-heading text-sm focus:bg-electric-lime/5 transition-colors"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {products
            .filter((p: any) => !search || p.name.toLowerCase().includes(search.toLowerCase()))
            .map((p: any) => (
              <ProductCard key={p._id} product={p} />
            ))}
       </div>
    </div>
  );
}

function OrderPlacementButton({ onOrderCreated }: { onOrderCreated: (id: string) => void }) {
  const { items, totalPrice } = useSelector((state: RootState) => state.cart);
  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();
  const [updateOrder, { isLoading: isUpdating }] = useUpdateOrderMutation();
  const [updateTableStatus] = useUpdateTableStatusMutation();
  const storedTable = JSON.parse(localStorage.getItem("session_table") || "{}");

  // Fetch existing draft order for this table
  const { data: draftOrdersData } = useGetOrdersQuery({ 
    tableId: storedTable._id, 
    status: "draft", 
    limit: 1 
  }, { skip: !storedTable?._id });

  const existingDraft = draftOrdersData?.data?.[0];

  const handlePlaceOrder = async () => {
    if (!storedTable?._id) {
       toast.error("TABLE_MAPPING_FAILURE");
       return;
    }
    
    try {
      if (existingDraft) {
        // Merge items: if product exists in draft, add quantities, else append new item
        const updatedItems = [...existingDraft.items.map((i: any) => ({
          product: i.product._id || i.product,
          quantity: i.quantity,
          size: i.size || "Regular",
          price: i.price
        }))];

        items.forEach(cartItem => {
          const existing = updatedItems.find(i => i.product === cartItem.productId);
          if (existing) {
            existing.quantity += cartItem.quantity;
          } else {
            updatedItems.push({
              product: cartItem.productId,
              quantity: cartItem.quantity,
              size: cartItem.size || "Regular",
              price: cartItem.price
            });
          }
        });

        await updateOrder({ 
          id: existingDraft._id, 
          body: { items: updatedItems } 
        }).unwrap();
        toast.success("ORDER_SYNCED_WITH_DRAFT");
        onOrderCreated(existingDraft._id);
      } else {
        const orderData = {
          tableId: storedTable._id,
          items: items.map(i => ({
            product: i.productId,
            quantity: i.quantity,
            size: i.size || "Regular",
            price: i.price
          })),
          totalPrice: totalPrice,
          status: "draft" // Use 'draft' as the initial status for customer orders
        };

        const res: any = await createOrder(orderData).unwrap();
        await updateTableStatus({ id: storedTable._id, status: "occupied" }).unwrap();
        toast.success("ORDER_PROPAGATED_TO_SYSTEM");
        onOrderCreated(res.data?._id || res._id);
      }
    } catch (err) {
      toast.error("SYSTEM_SYNC_ERROR");
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <BrutalistButton 
      onClick={handlePlaceOrder} 
      disabled={isLoading || items.length === 0}
      variant="accent"
      className="h-20"
    >
      {isLoading ? "EXECUTING..." : "EXECUTE_RAZORPAY"}
    </BrutalistButton>
  );
}

function LiveTrackingView({ activeIds, onBack, onModify }: { activeIds: string[], onBack: () => void, onModify: () => void }) {
  const { data: ordersData } = useGetOrdersQuery({});
  const orders = useMemo(() => {
     const list = Array.isArray(ordersData) ? ordersData : (ordersData as any)?.data || [];
     return list.filter((o: any) => activeIds.includes(o._id));
  }, [ordersData, activeIds]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-rich-cream">
      <div className="w-full md:w-[30%] lg:w-[25%] bg-deep-black text-white p-12 flex flex-col justify-between border-r-[10px] border-golden-yellow">
        <div>
           <div className="w-20 h-20 bg-white p-2 mb-16 shadow-[8px_8px_0px_0px_#F5B400]">
              <img src="/logo.png" alt="Cafe Sync" className="w-full h-full object-contain" />
           </div>
           <h1 className="text-7xl font-heading leading-[0.8] mb-12">
              ACTIVE.<br/>
              <span className="text-golden-yellow">SESSIONS.</span><br/>
              REPORTS.
           </h1>
           <p className="system-status text-[10px] text-white/30 uppercase tracking-[0.2em] leading-relaxed">
             [QUEUE_SYNC_STATUS]: ACTIVE<br/>
             TOTAL_SESSIONS: {orders.length}<br/>
             TERMINAL: CAFE_SYNC_PRO_22
           </p>
           
           <div className="mt-12 h-2 w-full bg-deep-black border border-white/20 overflow-hidden">
              <motion.div 
                className="h-full bg-white/40" 
                animate={{ width: ["0%", "100%"] }} 
                transition={{ duration: 2, repeat: Infinity }} 
              />
           </div>
        </div>

        <div className="space-y-4">
           <BrutalistButton onClick={onModify} variant="accent" className="h-20 w-full">
             ADD_MORE_ITEMS
           </BrutalistButton>
           <BrutalistButton onClick={onBack} variant="ghost" className="h-20 w-full">
             NEW_ORDER
           </BrutalistButton>
        </div>
      </div>

      <div className="flex-1 p-12 lg:p-20 overflow-y-auto">
         <SectionHeader title="LIVE_SESSION_QUEUE" subtitle="MISSION_TRACKING_IN_PROGRESS" />
         
         <div className="space-y-12 max-w-4xl">
            {orders.length === 0 && (
               <div className="p-20 border-4 border-dashed border-deep-black flex flex-col items-center opacity-30">
                  <Activity size={64} className="mb-4" />
                  <p className="font-heading italic uppercase">NO_ACTIVE_TRANSMISSIONS</p>
               </div>
            )}
            
            {[...orders].reverse().map((order: any) => (
               <div key={order._id} className="relative">
                  <div className="flex justify-between items-end mb-4">
                     <div>
                        <span className="bg-golden-yellow text-deep-black px-2 py-1 font-mono text-[10px] font-bold">ORDER_SESSION_{order._id.slice(-4).toUpperCase()}</span>
                        <h3 className="text-7xl font-heading uppercase italic mt-4">
                           {order.status === 'pending' || order.status === 'draft' ? 'DRAFT' : order.status.toUpperCase()}
                        </h3>
                     </div>
                     <div className="text-right">
                        <p className="system-status opacity-20 text-xs">#{order._id.slice(-6).toUpperCase()}</p>
                        <p className="text-4xl font-heading italic text-golden-yellow">{order.estimatedTime || 20} <span className="text-sm">MINS</span></p>
                     </div>
                  </div>

                  <div className="brutalist-card bg-white p-8 border-l-[12px] border-deep-black">
                     <div className="space-y-4">
                        {order.items.map((item: any, idx: number) => (
                           <div key={idx} className="flex justify-between items-center group">
                              <span className="font-heading italic text-2xl uppercase">
                                 <span className="text-golden-yellow mr-4">{item.quantity}X</span>
                                 {item.product?.name || 'ITEM'}
                              </span>
                              <span className="px-3 py-1 border-2 border-deep-black text-[10px] uppercase font-mono opacity-20">
                                 {order.status === 'pending' || order.status === 'draft' ? 'PENDING' : 'CONFIRMED'}
                              </span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}