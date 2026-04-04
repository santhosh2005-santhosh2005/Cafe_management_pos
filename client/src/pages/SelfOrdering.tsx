import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useGetProductsQuery } from "@/services/productApi";
import { useGetCategoriesQuery } from "@/services/categoryApi";
import { socket } from "@/utils/socket";
import { useEffect } from "react";
import { useCreateOrderMutation, useGetOrdersQuery, useUpdateOrderMutation } from "@/services/orderApi";
import { useGetTablesQuery } from "@/services/tableApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Plus, Minus, CheckCircle, ReceiptText, ChefHat, MapPin, Edit3 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function SelfOrdering() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { data: productsData, isLoading: prodLoading } = useGetProductsQuery(undefined);
  const { data: categoriesData } = useGetCategoriesQuery(undefined);
  const { data: tablesData } = useGetTablesQuery();
  const [createOrder] = useCreateOrderMutation();
  const [updateOrder] = useUpdateOrderMutation();

  // Fetch existing draft order for this table
  const { data: draftOrdersData, refetch: refetchDrafts } = useGetOrdersQuery({ 
    tableId: tableId, 
    status: "draft", 
    limit: 1 
  }, { skip: !tableId });

  const existingDraft = draftOrdersData?.data?.[0];

  const [cart, setCart] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isOrdered, setIsOrdered] = useState(false);
  const [orderNum, setOrderNum] = useState("");
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const products = (productsData as any)?.data || [];
  const categories = (categoriesData as any)?.data || [];
  const activeTable = (tablesData as any)?.data?.find((t: any) => t._id === tableId);

  // Sync activeOrder with existingDraft if found
  useEffect(() => {
    if (existingDraft && !activeOrder) {
      setActiveOrder(existingDraft);
      setOrderNum(existingDraft.customOrderID);
      setIsOrdered(true);
    }
  }, [existingDraft, activeOrder]);

  const [kitchenLoad, setKitchenLoad] = useState<"low" | "medium" | "high">("low");

  useEffect(() => {
    const fetchLoad = async () => {
       try {
         const res = await fetch(`${import.meta.env.VITE_API_URL}/api/staff/kitchen-load`);
         const data = await res.json();
         if (data.success) setKitchenLoad(data.data.load);
       } catch (err) {}
    };
    fetchLoad();
    const interval = setInterval(fetchLoad, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const filteredProducts = selectedCategory === "all" 
    ? products 
    : products.filter((p: any) => p.category?._id === selectedCategory);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.productId === product._id);
    if (existing) {
      setCart(cart.map(item => item.productId === product._id 
        ? { ...item, quantity: item.quantity + 1 } 
        : item));
    } else {
      setCart([...cart, { 
        productId: product._id, 
        name: product.name, 
        price: product.price, 
        quantity: 1,
        imageUrl: product.imageUrl,
        size: "Regular"
      }]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    try {
      if (activeOrder && activeOrder.status === "draft") {
        // Update existing draft
        const updatedItems = [...activeOrder.items.map((i: any) => ({
          product: i.product._id || i.product,
          quantity: i.quantity,
          size: i.size,
          price: i.price
        }))];

        cart.forEach(cartItem => {
          const existing = updatedItems.find(i => i.product === cartItem.productId);
          if (existing) {
            existing.quantity += cartItem.quantity;
          } else {
            updatedItems.push({
              product: cartItem.productId,
              quantity: cartItem.quantity,
              size: cartItem.size,
              price: cartItem.price
            });
          }
        });

        const res = await updateOrder({ 
          id: activeOrder._id, 
          body: { items: updatedItems } 
        }).unwrap();
        setActiveOrder((res as any).data);
      } else {
        // Create new order
        const orderData = {
          items: cart.map(item => ({
            product: item.productId,
            quantity: item.quantity,
            size: item.size,
            price: item.price
          })),
          tableId: tableId,
          paymentMethod: "cash", 
          isCustomerOrder: true
        };

        const res = await createOrder(orderData).unwrap();
        const order = (res as any).data;
        setOrderNum(order.customOrderID || "OD-4242");
        setActiveOrder(order);
        setIsOrdered(true);
      }
      setCart([]);
      toast.success("Order Updated!");
    } catch (err) {
      toast.error("Failed to process order. Please call staff.");
    }
  };

  const handleModifyOrder = () => {
    setIsOrdered(false);
  };

  const handlePayBill = () => {
    toast.success("Please proceed to the cashier for payment.");
  };

  // Real-time updates for active order
  useEffect(() => {
    const handleUpdate = (updatedOrder: any) => {
       if (activeOrder?._id === updatedOrder._id) {
          setActiveOrder(updatedOrder);
          if (updatedOrder.status !== "draft") {
            // Once approved, customer can't modify anymore but can still see status
            setIsOrdered(true);
          }
       }
    };
    socket.on("orderUpdated", handleUpdate);
    return () => { socket.off("orderUpdated", handleUpdate); };
  }, [activeOrder?._id]);

  // Countdown Logic
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeOrder?.confirmedTime && activeOrder?.timeConfirmedAt) {
         const endTime = new Date(activeOrder.timeConfirmedAt).getTime() + (activeOrder.confirmedTime * 60 * 1000);
         const diff = Math.max(0, Math.floor((endTime - Date.now()) / 60000));
         setTimeLeft(diff);
      } else {
         setTimeLeft(activeOrder?.estimatedTime || null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeOrder]);

  if (prodLoading) return <div className="h-screen flex items-center justify-center font-black animate-pulse">SETTING UP DIGITAL MENU...</div>;

  if (isOrdered) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
         <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600 animate-bounce" />
         </div>
         <h1 className="text-3xl font-black text-gray-900 mb-2">Order Confirmed!</h1>
         <p className="text-gray-500 font-bold mb-8">Wait for our staff to serve you perfectly.</p>
         
         <div className="bg-white p-8 rounded-[40px] shadow-xl w-full max-w-sm space-y-6">
            <div className="flex flex-col items-center">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Order Tracking Number</p>
               <p className="text-4xl font-black text-blue-600">{orderNum}</p>
            </div>
            
            <div className="h-px bg-gray-100 w-full" />

            <div className="flex justify-between items-center px-2">
               <div className="text-left">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Status</p>
                  <p className="text-lg font-black text-amber-600 capitalize">{activeOrder?.status || "Processing"}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Est. Wait</p>
                  <p className="text-3xl font-black text-gray-900">{timeLeft !== null ? `${timeLeft}m` : "--"}</p>
               </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 py-3 rounded-2xl">
               <ChefHat size={14} className={activeOrder?.status === 'preparing' ? 'animate-bounce text-amber-500' : ''} />
               {activeOrder?.status === 'draft' 
                 ? 'Waiting for waiter verification' 
                 : activeOrder?.confirmedTime 
                   ? 'Chef is cooking your meal' 
                   : 'Forwarded to Kitchen'}
            </div>

            {activeOrder?.status === 'draft' && (
               <Button 
                 onClick={handleModifyOrder} 
                 variant="outline" 
                 className="w-full rounded-2xl h-12 font-black border-2 border-blue-600 text-blue-600 gap-2"
               >
                  <Edit3 size={16} /> ADD MORE ITEMS
               </Button>
            )}

            {activeOrder?.status !== 'draft' && (
               <Button 
                 onClick={handlePayBill} 
                 className="w-full rounded-2xl h-12 font-black bg-green-600 hover:bg-green-700 text-white gap-2"
               >
                  <ReceiptText size={16} /> PAY BILL
               </Button>
            )}
         </div>
         
         <Button onClick={() => window.location.reload()} variant="outline" className="mt-12 rounded-2xl h-14 px-8 font-black">
            Order Something Else
         </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 rounded-b-[40px] shadow-lg sticky top-0 z-50">
        <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-black uppercase tracking-widest opacity-80">Digital Menu</p>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black ${
                kitchenLoad === 'low' ? 'bg-green-500/20 text-green-100' :
                kitchenLoad === 'medium' ? 'bg-amber-500/20 text-amber-100' :
                'bg-red-500/20 text-red-100'
              }`}>
                 <ChefHat size={12} /> KITCHEN: {kitchenLoad.toUpperCase()}
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-[10px] font-black">
                 <MapPin size={10} /> TABLE {activeTable?.tableNumber || "--"}
              </div>
            </div>
        </div>
        <h1 className="text-2xl font-black">Odoo POS Cafe</h1>
      </div>

      {/* Hero Category Bar */}
      <div className="flex gap-4 overflow-x-auto p-6 no-scrollbar">
          <button 
            onClick={() => setSelectedCategory("all")}
            className={`flex-shrink-0 px-6 py-3 rounded-2xl font-black text-sm transition-all ${selectedCategory === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-100 text-gray-400'}`}
          >
            All Items
          </button>
          {categories.map((cat: any) => (
             <button 
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`flex-shrink-0 px-6 py-3 rounded-2xl font-black text-sm transition-all ${selectedCategory === cat._id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-100 text-gray-400'}`}
             >
                {cat.name}
             </button>
          ))}
      </div>

      {/* Product List */}
      <div className="px-6 grid grid-cols-1 gap-6">
        {filteredProducts.map((p: any) => (
          <Card key={p._id} className="rounded-[32px] border-none bg-gray-50/50 shadow-sm overflow-hidden flex h-32">
             <img src={p.imageUrl || "/placeholder.png"} className="w-32 h-full object-cover" />
             <CardContent className="p-4 flex-1 flex flex-col justify-between">
                <div>
                   <h3 className="font-black text-base leading-tight">{p.name}</h3>
                   <p className="text-blue-600 font-extrabold text-sm">INR {p.price}</p>
                </div>
                {/* Cart Controller */}
                <div className="flex justify-end items-center gap-3">
                   {cart.find(item => item.productId === p._id) ? (
                      <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-2xl shadow-sm border">
                         <button onClick={() => updateQuantity(p._id, -1)} className="text-blue-600">
                            <Minus size={16} />
                         </button>
                         <span className="font-black text-sm">{cart.find(item => item.productId === p._id).quantity}</span>
                         <button onClick={() => updateQuantity(p._id, 1)} className="text-blue-600">
                            <Plus size={16} />
                         </button>
                      </div>
                   ) : (
                      <button 
                        onClick={() => addToCart(p)}
                        className="w-10 h-10 bg-white rounded-2xl shadow-sm border flex items-center justify-center text-blue-600 active:scale-90 transition-all"
                      >
                         <Plus size={20} />
                      </button>
                   )}
                </div>
             </CardContent>
          </Card>
        ))}
      </div>

      {/* Cart Drawer */}
      {cart.length > 0 && (
         <div className="fixed bottom-0 inset-x-0 p-6 z-50">
            <div className="bg-white rounded-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] p-6 border border-gray-100 animate-in slide-in-from-bottom duration-300">
               <div className="flex justify-between items-center mb-6 px-2">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                        <ShoppingCart size={18} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Your Cart</p>
                        <p className="text-sm font-black">{cart.length} Selections</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-2xl font-black text-blue-800">INR {total}</p>
                  </div>
               </div>

               <Button 
                onClick={handlePlaceOrder}
                className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-lg flex gap-3 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
               >
                  <ReceiptText size={20} /> PLACE DRAFT ORDER
               </Button>
            </div>
         </div>
      )}
    </div>
  );
}
