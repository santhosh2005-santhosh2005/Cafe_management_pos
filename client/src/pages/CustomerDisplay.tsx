import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { socket } from "@/utils/socket";
import { useGetFloorsQuery } from "@/services/floorApi";
import { useGetTablesQuery } from "@/services/tableApi";
import { useGetProductsQuery } from "@/services/productApi";
import { useGetCategoriesQuery } from "@/services/categoryApi";
import { useCreateOrderMutation, useUpdateOrderMutation } from "@/services/orderApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetSettingsQuery } from "@/services/SettingsApi";
import { 
  LogOut, 
  LayoutGrid, 
  MapPin, 
  ChevronRight, 
  ShoppingCart, 
  Plus, 
  Minus, 
  CheckCircle2,
  ChefHat,
  Timer,
  X,
  DollarSign,
  Filter,
  Zap,
  Package,
  QrCode,
  Scan,
  CreditCard,
  Clock,
  RefreshCw
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Html5Qrcode } from "html5-qrcode";

type Step = "floor" | "table" | "menu" | "payment" | "status";

export default function CustomerDisplay() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("floor");
  const [selectedFloor, setSelectedFloor] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    socket.on("orderUpdated", (updatedOrder: any) => {
      if (activeOrder && updatedOrder._id === activeOrder._id) {
        setActiveOrder(updatedOrder);
        toast.success("Order status updated!");
      }
    });

    socket.on("itemStatusChanged", ({ orderId, updatedOrder }: any) => {
      if (activeOrder && orderId === activeOrder._id) {
        setActiveOrder(updatedOrder);
      }
    });

    return () => {
      socket.off("orderUpdated");
      socket.off("itemStatusChanged");
    };
  }, [activeOrder]);

  // 1. All Hooks at the top level
  const { user } = useSelector((state: RootState) => state.user);
  const { data: floorsData, isLoading: floorsLoading } = useGetFloorsQuery();
  const { data: tablesData, isLoading: tablesLoading } = useGetTablesQuery();
  const { data: categories, isLoading: categoriesLoading } = useGetCategoriesQuery();
  const { data: productsResponse, isLoading: productsLoading } = useGetProductsQuery({ limit: 100 });
  const { data: settingsData } = useGetSettingsQuery({});
  const [createOrder] = useCreateOrderMutation();
  const [updateOrder] = useUpdateOrderMutation();

  // ── MODIFY RECENT ORDER STATE ──────────────────────────────────────────
  const [modificationCountdown, setModificationCountdown] = useState<number | null>(null);
  const [isModifying, setIsModifying] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    if (modificationCountdown !== null && modificationCountdown > 0) {
      timer = setInterval(() => {
        setModificationCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
      }, 1000);
    } else if (modificationCountdown === 0) {
      setModificationCountdown(null);
      // We don't necessarily reset isModifying here, but the window for starting modification is closed
    }
    return () => clearInterval(timer);
  }, [modificationCountdown]);

  // 2. Data derived from queries (with safety checks)
  const floors = (floorsData as any)?.data || [];
  const allTables = (tablesData as any)?.data || [];
  const products = productsResponse?.data || [];

  // Memoize handleScanTable to avoid unnecessary effect re-runs
  const handleScanTable = useCallback((table: any) => {
    const floor = floors.find((f: any) => {
      const floorId = table.floor?._id || table.floor;
      return f._id.toString() === floorId.toString();
    });
    
    if (floor) {
      setSelectedFloor(floor);
      setSelectedTable(table);
      setStep("menu");
      setIsScannerOpen(false);
      toast.success(`Connected to Table ${table.number}`);
    } else {
      toast.error("Invalid Table Configuration");
    }
  }, [floors]);

  useEffect(() => {
    let scanner: Html5Qrcode | null = null;
    
    if (isScannerOpen) {
      console.log("QR Scanner: Initializing...");
      const timer = setTimeout(async () => {
        try {
          const readerElement = document.getElementById("reader");
          if (!readerElement) {
            console.error("QR Scanner: #reader element not found");
            return;
          }

          // Use static configuration for cleaner initialization
          scanner = new Html5Qrcode("reader");
          console.log("QR Scanner: Instance created");

          const config = { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            showFocusLine: true
          };

          // Explicitly request camera permissions before starting
          await scanner.start(
            { facingMode: "environment" },
            config,
            (decodedText: string) => {
              console.log("QR Scanner: Scanned text:", decodedText);
              // Handle both ID and Number based scanning
              const foundTable = allTables.find((t: any) => 
                t.number.toString() === decodedText.toString() || 
                t._id.toString() === decodedText.toString()
              );

              if (foundTable) {
                // Play feedback sound or vibrate if possible
                if (navigator.vibrate) navigator.vibrate(50);
                handleScanTable(foundTable);
              } else {
                toast.error(`Table ${decodedText} not recognized`);
              }
            },
            (errorMessage: string) => {
              // Ignore frequent scan failures (normal behavior)
            }
          );
          console.log("QR Scanner: Camera started successfully");
        } catch (err: any) {
          console.error("QR Scanner: Startup error:", err);
          
          // Handle specific camera errors
          if (err?.name === "NotAllowedError" || err === "NotAllowedError") {
            toast.error("Camera access denied. Please allow camera permissions in your browser.");
          } else if (err?.name === "NotFoundError" || err === "NotFoundError") {
            toast.error("No camera found on this device.");
          } else {
            toast.error("Scanner failed to start. Try refreshing the page.");
          }
        }
      }, 800); // Increased timeout to ensure DOM is ready

      return () => {
        clearTimeout(timer);
        if (scanner) {
          console.log("QR Scanner: Cleaning up...");
          const stopScanner = async () => {
            try {
              if (scanner?.isScanning) {
                await scanner.stop();
                scanner.clear();
                console.log("QR Scanner: Stopped and cleared");
              }
            } catch (e) {
              console.warn("QR Scanner: Cleanup failed", e);
            }
          };
          stopScanner();
        }
      };
    }
  }, [isScannerOpen, allTables, handleScanTable]);

  // Wait time logic
  useEffect(() => {
    if (activeOrder) {
      const updateTimer = () => {
        const confirmedAt = activeOrder.timeConfirmedAt ? new Date(activeOrder.timeConfirmedAt).getTime() : new Date(activeOrder.createdAt).getTime();
        const duration = (activeOrder.confirmedTime || activeOrder.estimatedTime || 15) * 60 * 1000;
        const now = Date.now();
        const elapsed = now - confirmedAt;
        const remaining = Math.max(0, Math.ceil((duration - elapsed) / 60000));
        setTimeLeft(remaining);
      };

      updateTimer();
      const timer = setInterval(updateTimer, 30000); // Update every 30 seconds
      return () => clearInterval(timer);
    }
  }, [activeOrder]);

  if (floorsLoading || tablesLoading || categoriesLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-deep-black text-white flex flex-col items-center justify-center font-black">
        <div className="w-20 h-20 border-8 border-golden-yellow border-t-transparent rounded-full animate-spin mb-8"></div>
        <p className="text-4xl italic tracking-tighter uppercase animate-pulse">Initializing_System...</p>
      </div>
    );
  }

  const filteredTables = (allTables || []).filter((t: any) => {
    // Check both t.floor and t.floor._id depending on population
    const floorId = t.floor?._id || t.floor;
    const selectedId = selectedFloor?._id;
    return floorId && selectedId && floorId.toString() === selectedId.toString();
  });

  const filteredProducts = selectedCategory === "all" 
    ? (products || []) 
    : (products || []).filter((p: any) => {
        const catId = p.category?._id || p.category;
        return catId && selectedCategory && catId.toString() === selectedCategory.toString();
      });

  console.log("CustomerDisplay Debug:", { 
    totalTables: allTables.length,
    selectedFloorId: selectedFloor?._id, 
    firstTableFloor: allTables[0]?.floor,
    filteredTablesCount: filteredTables.length,
    filteredTables: filteredTables
  });

  // Cart logic
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
        price: product.basePrice,
        quantity: 1,
        imageUrl: product.imageUrl,
        size: "Regular"
      }]);
    }
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

  const handleRazorpayPayment = async () => {
    const keyId = settingsData?.data?.razorpayKeyId;
    if (!keyId) {
      toast.error("Online payment is not configured. Please contact administrator.");
      return;
    }

    const options = {
      key: keyId,
      amount: Math.round(total * 100),
      currency: "INR",
      name: settingsData?.data?.businessName || "Odoo POS Cafe",
      description: `Order for Table ${selectedTable?.number}`,
      handler: async function (response: any) {
        toast.success(`Payment Success: ${response.razorpay_payment_id}`);
        await handlePlaceOrder("digital");
      },
      modal: {
        ondismiss: function () {
          toast.error("Payment was cancelled");
        },
      },
      prefill: {
        name: user?.name || "Guest Customer",
        email: user?.email || "guest@odoocafe.com",
      },
      theme: {
        color: "#F5B400",
      },
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Razorpay error:", err);
      toast.error("Failed to initialize payment gateway");
    }
  };

  const handlePlaceOrder = async (method: string) => {
    try {
      const orderData = {
        items: cart.map(item => ({
          product: item.productId,
          quantity: item.quantity,
          size: item.size,
          price: item.price
        })),
        tableId: selectedTable._id,
        paymentMethod: method,
        isCustomerOrder: true
      };

      let res;
      if (isModifying && currentOrderId) {
        res = await updateOrder({ id: currentOrderId, body: orderData }).unwrap();
        toast.success("Order updated successfully!");
      } else {
        res = await createOrder(orderData).unwrap();
      }

      setActiveOrder(res.data);
      setCurrentOrderId(res.data._id);
      setModificationCountdown(60); // Start 1 minute timer
      setStep("status");
      setCart([]);
      setIsModifying(false);
    } catch (err) {
      toast.error("Failed to place order");
    }
  };

  const renderHeader = (title: string, subtitle?: string) => (
    <div className="bg-deep-black text-white p-8 border-b-8 border-golden-yellow">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="font-mono text-[10px] text-golden-yellow uppercase tracking-[0.3em]">Session_User: {user?.name || "GUEST"}</p>
          <h1 className="text-6xl font-black italic tracking-tighter uppercase">{title}</h1>
          {subtitle && <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mt-2">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          {step === "floor" && (
            <button 
              onClick={() => setIsScannerOpen(true)}
              className="bg-golden-yellow text-deep-black p-4 border-4 border-deep-black shadow-[4px_4px_0px_0px_#fff] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-2 font-black uppercase italic text-xs"
            >
              <QrCode size={20} /> SCAN_TABLE_QR
            </button>
          )}
          <button 
            onClick={() => navigate("/login")}
            className="bg-red-500 p-4 border-4 border-deep-black shadow-[4px_4px_0px_0px_#fff] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
          >
            <LogOut size={24} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderFooter = () => {
    if (step === "menu" && cart.length > 0) {
      return (
        <div className="fixed bottom-0 inset-x-0 p-8 z-50 bg-transparent pointer-events-none">
          <div className="bg-deep-black text-white p-8 border-4 border-golden-yellow shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] flex flex-col md:flex-row items-center justify-between pointer-events-auto max-w-6xl mx-auto relative overflow-hidden border-solid gap-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-golden-yellow/20"></div>
            
            {isModifying && (
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-[10px] font-black uppercase italic tracking-widest flex items-center gap-2">
                <RefreshCw size={12} className="animate-spin" /> Modifying Existing Order
              </div>
            )}

            <div className="flex items-center gap-8 md:gap-12">
               <div>
                  <p className="font-mono text-[10px] text-golden-yellow uppercase tracking-widest mb-1">Cart_Units</p>
                  <p className="text-4xl font-black italic">{cart.reduce((a, b) => a + b.quantity, 0)}</p>
               </div>
               <div className="w-px h-16 bg-white/20"></div>
               <div>
                  <p className="font-mono text-[10px] text-golden-yellow uppercase tracking-widest mb-1">Total_Investment</p>
                  <p className="text-5xl font-black italic tracking-tighter">INR {total.toFixed(2)}</p>
               </div>
            </div>
            
            <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
               <button 
                onClick={() => setCart([])}
                className="font-mono text-[10px] font-black uppercase tracking-widest border-b-2 border-white/20 hover:border-white transition-all text-white/60 hover:text-white"
               >
                 Abort_Order
               </button>
               <Button 
                onClick={() => setStep("payment")}
                className="bg-golden-yellow text-deep-black h-20 px-12 rounded-none border-4 border-deep-black shadow-[6px_6px_0px_0px_#fff] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all text-xl font-black uppercase italic flex gap-4"
               >
                 Initialize_Checkout <CheckCircle2 size={24} />
               </Button>
            </div>
          </div>
        </div>
      );
    }
    
    if (step === "floor" && selectedFloor && selectedTable) {
      return (
        <div className="fixed bottom-0 inset-x-0 p-8 z-50 bg-transparent pointer-events-none animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="bg-deep-black text-white p-8 border-4 border-golden-yellow shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] flex flex-col md:flex-row items-center justify-between pointer-events-auto max-w-6xl mx-auto border-solid gap-6">
            <div className="text-center md:text-left">
              <p className="font-mono text-[10px] text-golden-yellow uppercase tracking-widest mb-1">Ready_for_Transmission</p>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-tight">
                Floor: <span className="text-golden-yellow">{selectedFloor?.name}</span> / Table: <span className="text-golden-yellow">{selectedTable?.number}</span>
              </h3>
            </div>
            <Button 
              onClick={() => setStep("menu")}
              className="bg-golden-yellow text-deep-black h-20 px-12 w-full md:w-auto rounded-none border-4 border-deep-black shadow-[6px_6px_0px_0px_#fff] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all text-2xl font-black uppercase italic flex items-center justify-center gap-4"
            >
              Initialize_Menu <ChevronRight size={32} />
            </Button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] selection:bg-golden-yellow selection:text-deep-black">
      
      {/* STEP 1: FLOOR SELECTION */}
      {step === "floor" && (
        <>
          {renderHeader("Select_Your_Space.")}
          <div className="p-12 max-w-7xl mx-auto space-y-12">
            <div className="flex items-center gap-4 border-b-4 border-deep-black pb-4">
               <LayoutGrid className="text-golden-yellow" size={32} />
               <h2 className="text-4xl font-black italic uppercase">01. Choose_Floor</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {floors.map((f: any) => (
                <Card 
                  key={f._id}
                  onClick={() => setSelectedFloor(f)}
                  className={`cursor-pointer border-4 transition-all h-48 flex flex-col justify-center p-8 rounded-none shadow-[8px_8px_0px_0px_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${selectedFloor?._id === f._id ? 'bg-deep-black text-white border-golden-yellow' : 'bg-white text-deep-black border-deep-black'}`}
                >
                  <p className="font-mono text-[10px] uppercase tracking-widest opacity-40 mb-2">Level_Identifier</p>
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-tight">{f.name}</h3>
                </Card>
              ))}
            </div>

            {selectedFloor && (
              <div className="pt-12 animate-in fade-in slide-in-from-top-8 duration-500">
                <div className="flex items-center gap-4 border-b-4 border-deep-black pb-4 mb-8">
                   <MapPin className="text-golden-yellow" size={32} />
                   <h2 className="text-4xl font-black italic uppercase">02. Select_Table</h2>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
                  {filteredTables.map((t: any) => {
                    const oneHour = 60 * 60 * 1000;
                    const isOccupied = t.status === "occupied";
                    const isReserved = t.lastBookedAt && (Date.now() - new Date(t.lastBookedAt).getTime() < oneHour);
                    const isUnavailable = isOccupied || isReserved;

                    return (
                      <Card 
                        key={t._id}
                        onClick={() => !isUnavailable && setSelectedTable(t)}
                        className={`cursor-pointer border-4 transition-all p-6 rounded-none shadow-[4px_4px_0px_0px_#000] flex flex-col items-center justify-center gap-2 
                          ${selectedTable?._id === t._id ? 'bg-deep-black text-white border-golden-yellow' : 'bg-white text-deep-black border-deep-black'}
                          ${isUnavailable ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:translate-x-1 hover:translate-y-1 hover:shadow-none'}
                        `}
                      >
                        <p className="font-mono text-[8px] uppercase tracking-widest opacity-40">Table</p>
                        <h3 className="text-4xl font-black italic">{t.number}</h3>
                        <p className={`font-mono text-[8px] uppercase font-black ${isUnavailable ? 'text-red-500' : 'text-green-500'}`}>
                          {isOccupied ? 'Occupied' : isReserved ? 'Reserved' : 'Available'}
                        </p>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {renderFooter()}
        </>
      )}

      {/* STEP 2: DIGITAL MENU */}
      {step === "menu" && (
        <>
          <div className="bg-deep-black text-white p-8 border-b-8 border-golden-yellow sticky top-0 z-[60]">
            <div className="flex justify-between items-center max-w-[1600px] mx-auto">
               <div className="space-y-1">
                  <p className="font-mono text-[10px] text-golden-yellow uppercase tracking-[0.3em]">System_User: {user?.name || "GUEST"}</p>
                  <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">ODOO<br/>DIGITAL_MENU.</h1>
               </div>

               <div className="flex items-center gap-6">
                  <div className="bg-white/5 border-2 border-white/10 p-4 font-mono text-[10px] uppercase tracking-widest hidden lg:block">
                     <span className="text-golden-yellow">Kitchen_Status:</span> Fast Delivery
                  </div>
                  <div className="bg-white/5 border-2 border-white/10 p-4 font-mono text-[10px] uppercase tracking-widest hidden lg:block">
                     <span className="text-golden-yellow">Location:</span> Table {selectedTable?.number}
                  </div>
                  <Button className="bg-golden-yellow text-deep-black font-black italic uppercase text-xs h-12 px-6 rounded-none border-2 border-deep-black shadow-[4px_4px_0px_0px_#fff] hover:shadow-none flex gap-2">
                     <Timer size={16} /> Track_Orders
                  </Button>
                  <button onClick={() => setStep("table")} className="bg-red-500 p-3 border-2 border-deep-black shadow-[3px_3px_0px_0px_#fff]">
                     <LogOut size={18} />
                  </button>
               </div>
            </div>
          </div>

          <div className="max-w-[1600px] mx-auto p-12">
            <div className="flex items-center gap-8 mb-16 border-b-4 border-deep-black pb-8 overflow-x-auto no-scrollbar">
               <div className="flex items-center gap-3 shrink-0">
                  <Filter size={20} className="text-golden-yellow" />
                  <span className="font-mono text-xs font-black uppercase tracking-widest">Category_Filter</span>
               </div>
               <div className="w-px h-8 bg-deep-black hidden md:block"></div>
               <div className="flex gap-4">
                  <button 
                    onClick={() => setSelectedCategory("all")}
                    className={`px-8 py-3 font-black uppercase italic text-sm border-4 transition-all ${selectedCategory === 'all' ? 'bg-deep-black text-white border-deep-black shadow-[4px_4px_0px_0px_#F5B400]' : 'bg-white text-deep-black border-deep-black hover:bg-gray-50'}`}
                  >
                    All_Items
                  </button>
                  {categories?.map((cat: any) => (
                    <button 
                      key={cat._id}
                      onClick={() => setSelectedCategory(cat._id)}
                      className={`px-8 py-3 font-black uppercase italic text-sm border-4 transition-all whitespace-nowrap ${selectedCategory === cat._id ? 'bg-deep-black text-white border-deep-black shadow-[4px_4px_0px_0px_#F5B400]' : 'bg-white text-deep-black border-deep-black hover:bg-gray-50'}`}
                    >
                      {cat.name.replace(' ', '_')}
                    </button>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-12">
              {filteredProducts.map((p: any) => (
                <Card key={p._id} className="group border-4 border-deep-black rounded-none bg-white shadow-[12px_12px_0px_0px_#000] overflow-hidden flex flex-col">
                  <div className="relative h-64 overflow-hidden border-b-4 border-deep-black">
                    <img src={p.imageUrl || "/placeholder.png"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                       <span className="bg-deep-black text-golden-yellow px-3 py-1 font-mono text-[8px] font-black uppercase tracking-widest">{p.category?.name || "CAFE"}</span>
                       <span className="bg-green-500 text-white px-3 py-1 font-mono text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><div className="w-1.5 h-1.5 bg-white rounded-full"></div> Veg</span>
                    </div>
                  </div>
                  <CardContent className="p-8 flex-1 flex flex-col">
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2 leading-none">{p.name}</h3>
                    <p className="text-gray-400 font-mono text-[10px] leading-relaxed mb-8 flex-1">{p.description || "A premium selection from our artisan kitchen. Crafted with local ingredients and traditional techniques."}</p>
                    
                    <div className="h-px bg-gray-100 w-full mb-6"></div>
                    
                    <div className="flex items-center justify-between">
                       <div>
                          <p className="font-mono text-[8px] text-gray-400 uppercase tracking-widest mb-1">Price_Unit</p>
                          <p className="text-3xl font-black italic tracking-tighter">INR {p.basePrice}</p>
                       </div>
                       
                       {cart.find(item => item.productId === p._id) ? (
                         <div className="flex items-center gap-4 bg-deep-black text-white p-2 border-2 border-deep-black">
                            <button onClick={() => updateQuantity(p._id, -1)} className="hover:text-golden-yellow transition-colors"><Minus size={16} /></button>
                            <span className="font-black text-lg w-6 text-center">{cart.find(item => item.productId === p._id).quantity}</span>
                            <button onClick={() => updateQuantity(p._id, 1)} className="hover:text-golden-yellow transition-colors"><Plus size={16} /></button>
                         </div>
                       ) : (
                         <Button 
                          onClick={() => addToCart(p)}
                          className="bg-golden-yellow text-deep-black h-12 px-6 rounded-none border-2 border-deep-black shadow-[4px_4px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all font-black uppercase italic text-xs flex gap-2"
                         >
                           <ShoppingCart size={16} /> Add_to_Cart
                         </Button>
                       )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          {renderFooter()}
        </>
      )}

      {/* STEP 3: PAYMENT METHOD */}
      {step === "payment" && (
        <>
          {renderHeader("Complete_Transaction.", "Secure encrypted payment protocol")}
          <div className="p-12 max-w-4xl mx-auto space-y-12">
            <div className="flex items-center gap-4 border-b-4 border-deep-black pb-4 mb-12">
               <DollarSign className="text-golden-yellow" size={32} />
               <h2 className="text-4xl font-black italic uppercase">03. Select_Payment</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {[
                 { id: "upi", name: "Digital UPI", desc: "Instant mobile transfer", icon: Zap, action: () => handlePlaceOrder("upi") },
                 { id: "card", name: "Razorpay Secure", desc: "Cards, Netbanking & Wallets", icon: CreditCard, action: handleRazorpayPayment },
                 { id: "cash", name: "Cash on Table", desc: "Physical currency", icon: DollarSign, action: () => handlePlaceOrder("cash") },
                 { id: "digital", name: "Odoo Wallet", desc: "System credit balance", icon: Package, action: () => handlePlaceOrder("digital") }
               ].map((method) => (
                 <Card 
                  key={method.id}
                  onClick={method.action}
                  className="cursor-pointer bg-white border-4 border-deep-black p-8 rounded-none shadow-[8px_8px_0px_0px_#000] hover:bg-golden-yellow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group border-solid"
                 >
                   <div className="flex items-center gap-6">
                      <div className="p-4 bg-deep-black text-white border-2 border-deep-black shadow-[4px_4px_0px_0px_#F5B400] group-hover:shadow-none transition-all">
                         <method.icon size={32} />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black italic uppercase tracking-tighter">{method.name}</h3>
                         <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest group-hover:text-deep-black/60">{method.desc}</p>
                      </div>
                   </div>
                 </Card>
               ))}
            </div>
            
            <button 
              onClick={() => setStep("menu")}
              className="w-full py-6 border-4 border-dashed border-deep-black text-deep-black/40 font-black uppercase italic tracking-widest hover:text-deep-black hover:border-solid transition-all"
            >
              Back_to_Menu_Selection
            </button>
          </div>
        </>
      )}

      {/* STEP 4: ORDER STATUS */}
      {step === "status" && (
        <div className="min-h-screen bg-deep-black text-white flex flex-col items-center justify-center p-12 text-center overflow-hidden relative">
          {/* Animated Background Grids */}
          <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full border-[100px] border-white/5 rotate-12 scale-150"></div>
             <div className="absolute top-0 left-0 w-full h-full border-[100px] border-golden-yellow/5 -rotate-12 scale-150"></div>
          </div>

          <div className="relative z-10 max-w-2xl w-full">
            <div className="mb-12 inline-flex items-center justify-center w-32 h-32 bg-golden-yellow text-deep-black border-4 border-white shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]">
               <ChefHat size={64} className="animate-bounce" />
            </div>
            
            <p className="font-mono text-[10px] text-golden-yellow uppercase tracking-[0.4em] mb-4">Transmission_Successful</p>
            <h1 className="text-7xl font-black italic tracking-tighter uppercase mb-8 leading-none">ORDER_CONFIRMED.</h1>
            
            <div className="bg-white text-deep-black p-12 border-4 border-golden-yellow shadow-[20px_20px_0px_0px_rgba(245,180,0,0.2)] mb-12 border-solid">
               <div className="flex flex-col items-center mb-12">
                  <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-4">Tracking_Identifier</p>
                  <p className="text-6xl font-black italic tracking-tighter border-b-8 border-golden-yellow pb-2">{activeOrder?.customOrderID || "OD-4242"}</p>
               </div>

               {modificationCountdown !== null && (
                 <div className="mb-12 p-6 bg-golden-yellow/10 border-4 border-dashed border-golden-yellow flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3">
                       <Clock className="text-golden-yellow animate-pulse" size={24} />
                       <span className="text-2xl font-black italic uppercase tracking-tighter">Modification_Window: {modificationCountdown}s</span>
                    </div>
                    <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest text-center">
                       You can still add or remove items from your order within this timeframe
                    </p>
                    <div className="flex gap-4 w-full">
                       <Button 
                        onClick={() => {
                          if (activeOrder) {
                            setCart(activeOrder.items.map((it: any) => ({
                              productId: it.product._id,
                              name: it.product.name,
                              price: it.price,
                              quantity: it.quantity,
                              imageUrl: it.product.imageUrl,
                              size: it.size
                            })));
                            setIsModifying(true);
                            setStep("menu");
                            toast.success("Add more items to your order");
                          }
                        }}
                        className="flex-1 bg-deep-black text-white rounded-none font-black uppercase italic h-16 border-2 border-deep-black hover:bg-golden-yellow hover:text-deep-black transition-all"
                       >
                         <Plus size={20} className="mr-2" /> Add More
                       </Button>
                       <Button 
                        onClick={() => {
                          if (activeOrder) {
                            setCart(activeOrder.items.map((it: any) => ({
                              productId: it.product._id,
                              name: it.product.name,
                              price: it.price,
                              quantity: it.quantity,
                              imageUrl: it.product.imageUrl,
                              size: it.size
                            })));
                            setIsModifying(true);
                            setStep("menu");
                            toast.success("Modify items in your order");
                          }
                        }}
                        className="flex-1 bg-white text-red-600 border-2 border-red-600 rounded-none font-black uppercase italic h-16 hover:bg-red-600 hover:text-white transition-all"
                       >
                         <Minus size={20} className="mr-2" /> Remove
                       </Button>
                    </div>
                 </div>
               )}

               <div className="grid grid-cols-2 gap-12 border-t-4 border-deep-black/5 pt-12">
                  <div className="text-left border-l-4 border-golden-yellow pl-6">
                     <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-2">Live_Status</p>
                     <p className="text-3xl font-black italic uppercase tracking-tighter text-blue-600">Preparing</p>
                  </div>
                  <div className="text-right border-r-4 border-golden-yellow pr-6">
                     <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-2">Wait_Estimate</p>
                     <p className="text-5xl font-black italic tracking-tighter">{timeLeft || 15}m</p>
                  </div>
               </div>
            </div>

            <div className="flex gap-6">
               <Button 
                onClick={() => setStep("floor")}
                className="flex-1 h-20 bg-transparent text-white border-4 border-white hover:bg-white hover:text-deep-black transition-all rounded-none font-black uppercase italic text-lg"
               >
                 New_Order
               </Button>
               <Button 
                onClick={() => navigate("/history")}
                className="flex-1 h-20 bg-golden-yellow text-deep-black border-4 border-deep-black shadow-[8px_8px_0px_0px_#fff] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all rounded-none font-black uppercase italic text-lg"
               >
                 View_History
               </Button>
            </div>
          </div>
        </div>
      )}

      {/* SCANNER SIMULATION MODAL */}
      <AnimatePresence>
        {isScannerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-deep-black/95 z-[200] flex items-center justify-center p-8 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="bg-white border-8 border-deep-black w-full max-w-2xl relative shadow-[20px_20px_0px_0px_#F5B400]"
            >
              <button 
                onClick={() => setIsScannerOpen(false)}
                className="absolute -top-6 -right-6 bg-red-500 text-white p-4 border-4 border-deep-black shadow-[4px_4px_0px_0px_#000] hover:shadow-none transition-all"
              >
                <X size={24} />
              </button>

              <div className="p-8 bg-deep-black text-white border-b-4 border-deep-black flex items-center justify-between">
                 <div>
                    <p className="font-mono text-[10px] text-golden-yellow uppercase tracking-[0.4em] mb-2">Interface_Active</p>
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter">SCAN_TABLE.</h2>
                 </div>
                 <Scan size={48} className="text-golden-yellow animate-pulse" />
              </div>

              <div className="p-12 space-y-8">
                 <div className="flex flex-col items-center justify-center border-4 border-dashed border-gray-200 p-8 bg-gray-50 relative overflow-hidden min-h-[400px]">
                    <div id="reader" className="w-full max-w-[400px] border-4 border-golden-yellow bg-black shadow-[8px_8px_0px_0px_#000] overflow-hidden aspect-square">
                       {/* Camera feed will be rendered here by html5-qrcode */}
                    </div>
                    <div className="mt-8 flex flex-col items-center gap-2">
                       <p className="font-mono text-xs text-gray-400 uppercase tracking-widest text-center max-w-xs">
                          Align table QR code within the frame
                       </p>
                       <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-[10px] font-black uppercase text-green-600">Camera_Ready</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <p className="font-mono text-[10px] font-black uppercase tracking-widest text-gray-400">Direct_Input_Bypass</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                       {allTables.map((t: any) => (
                         <button 
                          key={t._id}
                          onClick={() => handleScanTable(t)}
                          className="bg-white border-2 border-deep-black p-4 font-black uppercase italic text-xs hover:bg-golden-yellow hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_#000] transition-all"
                         >
                           Table_{t.number}
                         </button>
                       ))}
                    </div>
                 </div>
              </div>
              
              <div className="p-8 bg-gray-50 border-t-4 border-deep-black">
                 <p className="text-center font-mono text-[8px] text-gray-400 uppercase tracking-[0.5em]">System_Encryption_Active_AES256</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
