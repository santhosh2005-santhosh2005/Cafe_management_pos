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

import { ShoppingCart, X, RefreshCcw, LogOut, Wallet, Scale } from "lucide-react";
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

// Forest green palette
const GREEN = "#1A2E1A";      // deep forest green
const CREAM = "#F5F0E8";      // warm cream / off-white
const YELLOW = "#F5B400";     // golden yellow accent
const GREEN_MID = "#2C4A2C";  // mid green for cards

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

  useEffect(() => {
    if (!activeLoading && !activeSession) {
      navigate("/dashboard/pos");
    }
  }, [activeLoading, activeSession, navigate]);

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
      setClosedMessage(`${businessName} is closed now. Open hours: ${formatAMPM(openingTime)} - ${formatAMPM(closingTime)}`);
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

  if (settingsLoading || activeLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: GREEN }}>
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-t-transparent rounded-none mx-auto animate-spin" style={{ borderColor: YELLOW, borderTopColor: "transparent" }}></div>
          <p className="font-black uppercase tracking-widest text-sm" style={{ color: CREAM }}>Validating Terminal Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: GREEN }}>

      {/* ── LEFT PANEL: Menu Area ── */}
      <div className="flex-1 flex flex-col py-4 px-3 md:px-6 overflow-y-auto">

        {/* Closed Banner */}
        {isClosed && (
          <div className="w-full p-4 mb-4 font-black text-center uppercase tracking-widest text-sm border-2"
            style={{ background: "#c0392b", color: CREAM, borderColor: "#e74c3c" }}>
            ⚠ {closedMessage}
          </div>
        )}

        {/* Top Bar */}
        <div className="w-full mb-5 flex flex-col md:flex-row items-center gap-3 p-3 border-b-2" style={{ borderColor: YELLOW }}>
          <div className="flex items-center gap-2 flex-1 w-full">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="w-10 h-10 flex items-center justify-center border-2 transition-all hover:opacity-80"
              style={{ borderColor: YELLOW, color: YELLOW, background: "transparent" }}
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <input
              placeholder="SEARCH MENU ITEMS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 h-10 px-4 font-black text-sm uppercase tracking-wider border-2 focus:outline-none bg-transparent placeholder-opacity-50"
              style={{
                borderColor: `${YELLOW}60`,
                color: CREAM,
                background: `${GREEN_MID}`,
              }}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="hidden lg:flex flex-col items-end pr-3 border-r-2" style={{ borderColor: `${YELLOW}40` }}>
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: `${CREAM}60` }}>Session Status</span>
              <span className="text-xs font-black uppercase tracking-tighter" style={{ color: "#4ade80" }}>● LIVE STAGE</span>
            </div>
            <button
              onClick={() => setIsCloseDialogOpen(true)}
              className="h-10 px-5 flex items-center gap-2 font-black uppercase text-xs border-2 transition-all hover:opacity-80"
              style={{ background: "#c0392b", color: CREAM, borderColor: "#e74c3c" }}
            >
              <LogOut size={15} /> Close Session
            </button>
          </div>
        </div>

        {/* Categories */}
        <Categories
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          categories={categories}
          catLoading={catLoading}
        />

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
          {products
            .filter((prod) => !search || prod?.name?.toLowerCase()?.includes(search.toLowerCase()))
            .map((prod, idx) => (
              <ProductCard
                key={prod._id ?? idx}
                product={prod}
                disabled={isClosed}
              />
            ))}
        </div>
      </div>

      {/* ── RIGHT PANEL: Order Sidebar ── */}
      <div className="hidden md:flex w-full md:w-[360px] lg:w-[400px] flex-col border-l-2" style={{ borderColor: `${YELLOW}30`, background: GREEN_MID }}>
        <div className="flex-1 overflow-y-auto">
          <OrderSidebar disabled={isClosed} />
        </div>
      </div>

      {/* ── MOBILE CART DRAWER ── */}
      <Drawer>
        <DrawerTrigger asChild>
          <button
            className={`md:hidden fixed bottom-5 right-5 p-4 flex items-center gap-2 border-2 shadow-lg font-black text-sm transition-all ${isClosed ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isClosed}
            style={{ background: YELLOW, color: GREEN, borderColor: GREEN }}
          >
            <span>{items.length || "0"}</span>
            <ShoppingCart size={22} />
          </button>
        </DrawerTrigger>
        <DrawerContent className="h-full w-[85%] ml-auto rounded-none border-none" style={{ background: GREEN_MID }}>
          <DrawerHeader className="flex justify-between items-center border-b-2 pb-3" style={{ borderColor: `${YELLOW}40` }}>
            <DrawerTitle className="font-black uppercase tracking-tight" style={{ color: CREAM }}>Current Order</DrawerTitle>
            <DrawerClose asChild>
              <button style={{ color: `${CREAM}80` }}><X size={22} /></button>
            </DrawerClose>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto">
            <OrderSidebar disabled={isClosed} />
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── CLOSE SESSION DIALOG ── */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent className="max-w-md border-2 shadow-2xl rounded-none p-0" style={{ background: GREEN, borderColor: YELLOW }}>
          <div className="p-6 border-b-2" style={{ borderColor: `${YELLOW}40`, background: GREEN_MID }}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3" style={{ color: CREAM }}>
                <Scale style={{ color: YELLOW }} size={22} /> End of Shift
              </DialogTitle>
              <DialogDescription className="font-mono text-xs uppercase tracking-widest mt-1" style={{ color: `${CREAM}60` }}>
                Settle today's trade and record the final closing balance.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5">
            <div className="p-4 border-2 flex justify-between items-center" style={{ borderColor: `${YELLOW}30`, background: `${GREEN_MID}` }}>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: `${CREAM}50` }}>Sales This Session</p>
                <p className="text-2xl font-black" style={{ color: YELLOW }}>INR {(activeSession?.totalSales || 0).toFixed(2)}</p>
              </div>
              <Wallet size={28} style={{ color: `${CREAM}30` }} />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest" style={{ color: `${CREAM}60` }}>Closing Balance (INR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-sm" style={{ color: `${CREAM}40` }}>₹</span>
                <input
                  type="number"
                  value={endingBalance}
                  onChange={(e) => setEndingBalance(parseFloat(e.target.value) || 0)}
                  className="w-full h-16 pl-10 text-2xl font-black border-2 focus:outline-none bg-transparent"
                  placeholder="0.00"
                  style={{ borderColor: YELLOW, color: CREAM, background: GREEN_MID }}
                />
              </div>
              <p className="text-[9px] font-mono italic text-center" style={{ color: `${CREAM}40` }}>
                Recommended: INR {((activeSession?.startingBalance || 0) + (activeSession?.totalSales || 0)).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="p-6 pt-0">
            <button
              onClick={handleCloseSession}
              className="w-full h-14 font-black uppercase tracking-widest text-base border-2 transition-all hover:opacity-90"
              style={{ background: "#c0392b", color: CREAM, borderColor: "#e74c3c" }}
            >
              CONFIRM & CLOSE SHIFT
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
