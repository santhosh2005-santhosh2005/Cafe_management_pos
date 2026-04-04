import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Categories from "@/components/CategoryBar";
import ProductCard from "@/components/SelectedProduct";
import OrderSidebar from "@/components/OrderSidebar";

import { useGetCategoriesQuery } from "@/services/categoryApi";
import {
  useGetProductsByCategoryQuery,
  useGetProductsQuery,
} from "@/services/productApi";

import { ShoppingCart, X, RefreshCcw } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useGetSettingsQuery } from "@/services/SettingsApi";
import { useGetActiveSessionQuery, useCloseSessionMutation } from "@/services/sessionApi";
import { useNavigate } from "react-router";
import { 
  LogOut, 
  Wallet,
  Scale
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "react-hot-toast";

interface Product {
  _id?: string;
  name?: string;
  price?: number;
  imageUrl?: string;
  [key: string]: any;
}

interface ProductApiResponse {
  data?: Product[];
  [key: string]: any;
}

const getSafeProducts = (
  response: Product[] | ProductApiResponse | undefined,
  prodLoading: boolean
): Product[] => {
  if (prodLoading) return Array(8).fill({});
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.data)) return response.data;
  return [];
};

const formatAMPM = (time: string) => {
  if (!time) return "--:--";
  const [hours, minutes] = time.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
};

export default function MainPage() {
  const navigate = useNavigate();
  const { items } = useSelector((state: RootState) => state.cart);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [isClosed, setIsClosed] = useState(false);
  const [closedMessage, setClosedMessage] = useState("");
  
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [endingBalance, setEndingBalance] = useState(0);

  const { data: settingsData, isLoading: settingsLoading } = useGetSettingsQuery({});
  const { data: activeData, isLoading: activeLoading } = useGetActiveSessionQuery();
  const [closeSession] = useCloseSessionMutation();

  const activeSession = activeData?.session;

  // Session Guard: Redirect if no active session
  useEffect(() => {
    if (!activeLoading && !activeSession) {
      navigate("/dashboard/pos");
    }
  }, [activeLoading, activeSession, navigate]);

  // Fetch categories
  const {
    data: categories = [],
    isLoading: catLoading,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();

  const {
    data: rawProducts,
    isLoading: prodLoading,
    refetch: refetchProducts,
  } = activeCategory
    ? useGetProductsByCategoryQuery(activeCategory)
    : useGetProductsQuery();

  const products = getSafeProducts(rawProducts, prodLoading);

  useEffect(() => {
    if (!settingsData?.data) return;

    const {
      offDays = [],
      openingTime = "00:00",
      closingTime = "23:59",
      businessName = "Cafe",
    } = settingsData.data;

    const now = new Date();
    const dayName = now.toLocaleDateString("en-US", { weekday: "long" });

    // Off day check
    if (offDays.includes(dayName)) {
      setIsClosed(true);
      setClosedMessage(`${businessName} is closed today (${dayName})`);
      return;
    }

    const [openHour, openMinute] = openingTime.split(":").map(Number);
    const [closeHour, closeMinute] = closingTime.split(":").map(Number);

    const openTime = new Date();
    openTime.setHours(openHour, openMinute, 0, 0);

    const closeTime = new Date();
    closeTime.setHours(closeHour, closeMinute, 0, 0);

    if (now < openTime || now > closeTime) {
      setIsClosed(true);
      setClosedMessage(
        `${businessName} is closed now. Open hours: ${formatAMPM(
          openingTime
        )} - ${formatAMPM(closingTime)}`
      );
      return;
    }

    setIsClosed(false);
    setClosedMessage("");
  }, [settingsData]);

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([refetchCategories(), (refetchProducts as any)()]);
    setLoading(false);
  };

  const handleCloseSession = async () => {
    if (!activeSession?._id) return;
    try {
      await closeSession({ id: activeSession._id, endingBalance }).unwrap();
      setIsCloseDialogOpen(false);
      toast.success("Shift Closed Successfully!");
      navigate("/dashboard/pos");
    } catch (err) {
      toast.error("Failed to close shift");
    }
  };

  // Show loading while settings load
  if (settingsLoading || activeLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
             <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
             <p className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">Validating Terminal Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] dark:bg-gray-900 flex flex-col md:flex-row transition-colors duration-300 px-2 sm:px-4 lg:px-6">
      <div className="flex-1 flex flex-col items-center py-2 px-2 md:px-6 w-full overflow-y-auto">
        {isClosed && (
          <div className="w-full p-4 mb-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-center font-semibold rounded">
            {closedMessage}
          </div>
        )}

        <div className="w-full max-w-5xl mb-6 flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border dark:border-gray-800">
          <div className="flex items-center gap-3 flex-1 w-full">
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading} className="rounded-xl">
                <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Input
                placeholder="Search menu items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 rounded-2xl border-none bg-gray-50 dark:bg-gray-900 focus-visible:ring-2 focus-visible:ring-blue-600 font-bold"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="hidden lg:flex flex-col items-end px-4 border-r dark:border-gray-700">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Session Status</p>
                <p className="text-xs font-black text-green-600 uppercase tracking-tighter">Live Stage</p>
             </div>
             <Button 
                onClick={() => setIsCloseDialogOpen(true)}
                variant="destructive" 
                className="rounded-2xl h-12 px-6 flex gap-2 font-black shadow-lg shadow-red-500/10"
             >
                <LogOut size={18} /> Close Session
             </Button>
          </div>
        </div>

        <Categories
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          categories={categories}
          catLoading={catLoading}
        />

        <div className="w-full p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 mt-6">
          {products
            .filter(
              (prod) =>
                !search ||
                prod?.name?.toLowerCase()?.includes(search.toLowerCase())
            )
            .map((prod, idx) => (
              <ProductCard
                key={prod._id ?? idx}
                product={prod}
                disabled={isClosed}
              />
            ))}
        </div>
      </div>

      <div className="hidden md:flex w-full md:w-[380px] lg:w-[420px] flex-col bg-[#f9f9f9] dark:bg-gray-800  border-gray-200 dark:border-gray-700">
        <div className="flex-1 overflow-y-auto">
          <OrderSidebar disabled={isClosed} />
        </div>
      </div>

      <Drawer>
        <DrawerTrigger asChild>
          <button
            className={`md:hidden fixed bottom-5 right-5 p-4 rounded-full shadow-lg flex items-center gap-2 transition-all duration-300 ${
              isClosed
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
            disabled={isClosed}
          >
            <span className="text-sm font-bold">{items.length || "0"}</span>
            <ShoppingCart size={24} />
          </button>
        </DrawerTrigger>

        <DrawerContent className="h-full w-[80%] ml-auto rounded-none bg-white dark:bg-gray-800 flex flex-col">
          <DrawerHeader className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
            <DrawerTitle className="text-lg font-semibold">
              Your Order
            </DrawerTitle>
            <DrawerClose asChild>
              <button>
                <X size={24} className="text-gray-600 dark:text-gray-300" />
              </button>
            </DrawerClose>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto">
            <OrderSidebar disabled={isClosed} />
          </div>
        </DrawerContent>
      </Drawer>

      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
          <DialogContent className="rounded-[40px] max-w-md p-8 border-none dark:bg-gray-900 shadow-2xl">
              <DialogHeader>
                  <DialogTitle className="text-3xl font-black flex items-center gap-3">
                      <Scale className="text-red-500" /> End of Shift
                  </DialogTitle>
                  <DialogDescription className="font-bold text-gray-400">
                      Settle today's trade and record the final closing balance.
                  </DialogDescription>
              </DialogHeader>
              
              <div className="py-8 space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border dark:border-gray-800 flex justify-between items-center">
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-gray-400 uppercase">Sales this Session</p>
                          <p className="text-2xl font-black text-blue-600">₹{(activeSession?.totalSales || 0).toFixed(2)}</p>
                       </div>
                       <Button variant="ghost" className="h-12 w-12 rounded-2xl bg-white dark:bg-gray-800 shadow-sm">
                          <Wallet className="text-gray-400" />
                       </Button>
                  </div>

                  <div className="space-y-3">
                      <Label className="text-xs uppercase font-black tracking-widest text-gray-500">Closing Balance (INR ₹)</Label>
                      <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-400 group-focus-within:text-red-500 transition-colors">₹</span>
                          <Input 
                              type="number"
                              value={endingBalance}
                              onChange={(e) => setEndingBalance(parseFloat(e.target.value) || 0)}
                              className="h-20 bg-gray-50 dark:bg-gray-800 border-none rounded-3xl text-3xl font-black pl-12 text-gray-900 dark:text-white focus-visible:ring-2 focus-visible:ring-red-500 transition-all shadow-inner"
                              placeholder="0.00"
                          />
                      </div>
                      <p className="text-[10px] text-gray-400 italic text-center font-bold">Recommended: ₹{((activeSession?.startingBalance || 0) + (activeSession?.totalSales || 0)).toFixed(2)}</p>
                  </div>
              </div>

              <DialogFooter>
                  <Button 
                    onClick={handleCloseSession} 
                    className="w-full h-16 bg-red-500 hover:bg-red-600 text-white rounded-3xl font-black text-xl shadow-xl shadow-red-500/30 active:scale-95 transition-all"
                  >
                    CONFIRM & CLOSE SHIFT
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
