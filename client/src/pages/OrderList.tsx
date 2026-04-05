import { useRef, useState, useEffect, type RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { socket } from "@/utils/socket";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  useDeleteOrderMutation,
  useGetOrdersQuery,
  useUpdateOrderMutation,
} from "@/services/orderApi";
import { useGetSettingsQuery } from "@/services/SettingsApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Loader, Search, X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import type { Order, OrdersResponse } from "@/types/User";
import Swal from "sweetalert2";
import type { RootState } from "@/store";
import { useSelector } from "react-redux";

// final price
const calculateFinalPrice = (order: Order) => {
  const subtotal = order.totalPrice;
  const discount = (subtotal * (order.discountPercent ?? 0)) / 100;
  const tax = ((subtotal - discount) * (order.taxRate ?? 0)) / 100;
  return subtotal - discount + tax;
};

const statusConfig = {
  pending:   { bg: "bg-yellow-500",  text: "PENDING",   dot: "bg-yellow-400" },
  preparing: { bg: "bg-orange-500",  text: "PREPARING", dot: "bg-orange-400" },
  served:    { bg: "bg-green-600",   text: "SERVED",    dot: "bg-green-400"  },
  cancelled: { bg: "bg-red-600",     text: "CANCELLED", dot: "bg-red-400"    },
} as const;

const paymentConfig = {
  upi:     { label: "UPI",     icon: "📱", color: "text-purple-700 bg-purple-100" },
  digital: { label: "DIGITAL", icon: "💳", color: "text-blue-700 bg-blue-100"    },
  cash:    { label: "CASH",    icon: "💵", color: "text-green-700 bg-green-100"  },
} as const;

const OrdersDashboard = () => {
  const { role } = useSelector((state: RootState) => state.user);
  const [selectedPayment, setSelectedPayment] = useState<"cash" | "digital" | "upi">("cash");
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const { data: settingsData } = useGetSettingsQuery({});
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const ref: RefObject<HTMLDivElement | null> = useRef(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [status, setStatus] = useState<"pending" | "preparing" | "served" | "cancelled" | "">("");
  const today = new Date();
  const localToday = today.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const [startDate, setStartDate] = useState<string>(localToday);
  const [endDate, setEndDate] = useState<string>(localToday);
  const start = new Date(`${startDate}T00:00:00+06:00`).toISOString();
  const end = new Date(`${endDate}T23:59:59+06:00`).toISOString();

  const [query, setQuery] = useState<{
    page: number;
    limit: number;
    status: "pending" | "preparing" | "served" | "cancelled" | "";
    startDate: string;
    endDate: string;
    orderId?: string;
  }>({
    page: 1,
    limit: 20,
    status: "",
    startDate: start,
    endDate: end,
  });

  const { data: response, isLoading, isError, isFetching, refetch } = useGetOrdersQuery(
    {
      page: query.page,
      limit: query.limit,
      status: query.status || undefined,
      startDate: query.startDate || undefined,
      endDate: query.endDate || undefined,
      orderId: query.orderId,
    },
    { refetchOnMountOrArgChange: true }
  ) as {
    data?: OrdersResponse;
    isLoading: boolean;
    isError: boolean;
    isFetching: boolean;
    refetch: () => void;
  };

  useEffect(() => {
    socket.on("newOrder", refetch);
    socket.on("orderUpdated", refetch);
    socket.on("orderConfirmed", refetch);
    socket.on("itemStatusChanged", refetch);

    return () => {
      socket.off("newOrder", refetch);
      socket.off("orderUpdated", refetch);
      socket.off("orderConfirmed", refetch);
      socket.off("itemStatusChanged", refetch);
    };
  }, [refetch]);

  const [deleteOrder] = useDeleteOrderMutation();
  const [updateOrder] = useUpdateOrderMutation();

  const orders = response?.data ?? [];
  const totalPages = response?.pagination?.totalPages ?? 1;

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await updateOrder({ id: orderId, data: { status: newStatus } }).unwrap();
      if (activeOrder && activeOrder._id === orderId) {
        setActiveOrder({ ...activeOrder, status: newStatus });
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const paybill = (order: Order) => {
    setActivePaymentOrder(order);
    setOpenPaymentDialog(true);
  };

  const handleSearch = () => {
    setQuery({
      page: 1,
      limit,
      status,
      startDate: start,
      endDate: end,
      ...(searchTerm ? { orderId: searchTerm } : {}),
    });
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    setQuery((prev) => ({ ...prev, page: p }));
  };

  useOutsideClick(ref as React.RefObject<HTMLDivElement>, () => setActiveOrder(null));

  if (isLoading) return <LoadingSkeleton />;

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-warm-white">
        <div className="text-center border-4 border-red-600 p-16 bg-white shadow-[16px_16px_0px_0px_#cc0000]">
          <div className="text-6xl mb-6 font-black font-mono text-red-600">ERR_404</div>
          <h3 className="font-sans font-black uppercase text-2xl text-deep-black mb-2">STREAM_FAILURE</h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Failed to load order stream. Check connection status.
          </p>
        </div>
      </div>
    );
  }

  const statusButtons: { label: string; value: "" | "preparing" | "served" | "pending" | "cancelled" }[] = [
    { label: "ALL_ORDERS", value: "" },
    { label: "PENDING",    value: "pending" },
    { label: "PREPARING",  value: "preparing" },
    { label: "SERVED",     value: "served" },
    { label: "CANCELLED",  value: "cancelled" },
  ];

  return (
    <div className="bg-warm-white space-y-16 animate-in fade-in duration-700">

      {/* ── HEADER ─────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row justify-between items-start gap-12 border-b-4 border-deep-black pb-12">
        <div>
          <span className="font-mono text-[10px] tracking-[0.4em] text-golden-yellow font-black uppercase mb-4 block">
            System_Directory / Orders
          </span>
          <h1 className="text-7xl font-sans font-black text-deep-black leading-[0.8] tracking-tighter uppercase">
            ORDER<br />
            <span className="text-golden-yellow">HISTORY.</span>
          </h1>
          <p className="font-mono text-xs uppercase tracking-widest text-deep-black/60 mt-6 max-w-lg">
            Transaction ledger. Real-time record of all order streams, payment methods, and operational status.
          </p>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-3 self-end">
          {statusButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setStatus(btn.value)}
              className={cn(
                "h-12 px-6 font-sans font-black uppercase text-xs border-2 border-deep-black transition-all active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none",
                status === btn.value
                  ? "bg-deep-black text-golden-yellow"
                  : "bg-white text-deep-black hover:bg-golden-yellow hover:text-deep-black"
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── FILTER PANEL ───────────────────────────────── */}
      <div className="brutalist-panel-dark border-r-8 border-b-8 border-golden-yellow shadow-none">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 border-2 border-golden-yellow flex items-center justify-center">
              <Search size={20} className="text-golden-yellow" />
            </div>
            <span className="font-mono text-[10px] tracking-[0.4em] text-golden-yellow uppercase font-black">
              QUERY_PROTOCOL
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Items per page */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[9px] tracking-widest text-warm-white/40 uppercase font-black">Items_Per_Page</label>
              <Select value={String(limit)} onValueChange={(val) => setLimit(Number(val))}>
                <SelectTrigger className="h-12 bg-warm-white text-deep-black rounded-none border-2 border-golden-yellow font-black uppercase text-xs focus:ring-0">
                  <SelectValue placeholder="LIMIT" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-2 border-deep-black bg-white p-0 shadow-none">
                  {["5","10","20","100","200"].map(v => (
                    <SelectItem key={v} value={v} className="font-black uppercase text-xs hover:bg-golden-yellow transition-colors">{v} ITEMS</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Order ID */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[9px] tracking-widest text-warm-white/40 uppercase font-black">Order_ID_Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="ENTER_ORDER_ID..."
                className="h-12 border-2 border-golden-yellow bg-warm-white text-deep-black font-black uppercase text-xs px-4 focus:outline-none focus:border-warm-white focus:bg-golden-yellow transition-colors"
              />
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[9px] tracking-widest text-warm-white/40 uppercase font-black">Status_Filter</label>
              <Select
                value={status || "all"}
                onValueChange={(val) => setStatus(val === "all" ? "" : (val as any))}
              >
                <SelectTrigger className="h-12 bg-warm-white text-deep-black rounded-none border-2 border-golden-yellow font-black uppercase text-xs focus:ring-0">
                  <SelectValue placeholder="ALL_STATUS" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-2 border-deep-black bg-white p-0 shadow-none">
                  {["all","pending","preparing","served","cancelled"].map(v => (
                    <SelectItem key={v} value={v} className="font-black uppercase text-xs hover:bg-golden-yellow transition-colors">{v.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[9px] tracking-widest text-warm-white/40 uppercase font-black">Start_Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-12 border-2 border-golden-yellow bg-warm-white text-deep-black font-black text-xs px-4 focus:outline-none focus:border-warm-white focus:bg-golden-yellow transition-colors"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[9px] tracking-widest text-warm-white/40 uppercase font-black">End_Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-12 border-2 border-golden-yellow bg-warm-white text-deep-black font-black text-xs px-4 focus:outline-none focus:border-warm-white focus:bg-golden-yellow transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t-2 border-warm-white/10">
            <button
              onClick={handleSearch}
              disabled={isFetching}
              className="h-14 px-12 bg-golden-yellow text-deep-black font-sans font-black uppercase border-2 border-golden-yellow hover:bg-warm-white transition-all flex items-center gap-4 disabled:opacity-40 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-1"
            >
              {isFetching ? (
                <><Loader className="animate-spin w-5 h-5" /> QUERYING...</>
              ) : (
                <><Search className="w-5 h-5" /> EXECUTE_QUERY</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── ORDER COUNT STRIP ──────────────────────────── */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-golden-yellow"></div>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black">
            Records_Found: <span className="text-deep-black">{orders.length}</span>
          </span>
        </div>
        <div className="flex-1 h-[2px] bg-deep-black/10"></div>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-black">
          Page {page}/{totalPages}
        </span>
      </div>

      {/* ── ORDER GRID ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 border-l-2 border-t-2 border-deep-black">
        {orders.length === 0 ? (
          <div className="col-span-full border-r-2 border-b-2 border-deep-black p-20 bg-white flex flex-col items-center justify-center gap-6 text-center">
            <div className="text-6xl font-black font-mono text-deep-black/20">0x00</div>
            <h3 className="font-sans font-black uppercase text-2xl tracking-tighter">NO_RECORDS_FOUND</h3>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Adjust your query parameters and re-execute.</p>
          </div>
        ) : (
          orders.map((order) => {
            const sc = statusConfig[order.status as keyof typeof statusConfig] ?? statusConfig.pending;
            const pc = paymentConfig[order.paymentMethod as keyof typeof paymentConfig] ?? paymentConfig.cash;
            return (
              <motion.div
                key={order._id}
                className="border-r-2 border-b-2 border-deep-black bg-white hover:bg-warm-white transition-all cursor-pointer group relative overflow-hidden flex flex-col"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.1 }}
                onClick={() => setActiveOrder(order)}
              >
                {/* Accent Corner */}
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
                  <div className={cn("absolute top-0 right-0 w-24 h-24 translate-x-12 -translate-y-12 rotate-45 opacity-80 group-hover:opacity-100 transition-opacity", sc.bg)}></div>
                </div>

                <div className="p-8 flex flex-col gap-6 flex-1">
                  {/* Top Row */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground font-black mb-2">Order_ID</p>
                      <h4 className="font-sans font-black text-lg text-deep-black tracking-tighter leading-none">
                        #{(order.customOrderID ?? order._id).substring(0, 10)}
                      </h4>
                      <p className="font-mono text-[9px] uppercase tracking-tight text-muted-foreground mt-2">
                        {order.table?.name || "TAKEAWAY"}
                      </p>
                    </div>
                    <div className={cn("px-3 py-1 font-mono text-[9px] font-black uppercase text-white border-b-2 border-black/20", sc.bg)}>
                      {sc.text}
                    </div>
                  </div>

                  {/* Date / Time */}
                  <div className="flex gap-6 border-t-2 border-dotted border-deep-black/10 pt-4">
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mb-1">Date</p>
                      <p className="font-sans font-black text-xs text-deep-black uppercase">
                        {new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mb-1">Time</p>
                      <p className="font-sans font-black text-xs text-deep-black uppercase">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mb-1">Payment</p>
                      <span className={cn("font-mono font-black text-[9px] uppercase px-2 py-1", pc.color)}>
                        {pc.icon} {pc.label}
                      </span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="space-y-3 border-t-2 border-deep-black/10 pt-4 flex-1">
                    {order.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-deep-black text-warm-white flex items-center justify-center font-mono font-black text-[9px]">
                            {item.quantity}
                          </div>
                          <span className="font-sans font-black text-xs text-deep-black uppercase tracking-tight">
                            {item.product?.name ?? "DELETED"}
                          </span>
                        </div>
                        <span className="font-mono font-black text-xs text-deep-black">
                          ₹{(item.quantity * item.price).toFixed(0)}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="font-mono text-[9px] uppercase text-muted-foreground">
                        +{order.items.length - 3} MORE_ITEMS
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center border-t-2 border-deep-black pt-6 mt-auto">
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mb-1">Total_Amount</p>
                      <p className="font-sans font-black text-2xl text-deep-black tracking-tighter leading-none">
                        ₹{calculateFinalPrice(order).toFixed(0)}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveOrder(order); }}
                        className="h-10 px-4 font-mono font-black uppercase text-[9px] border-2 border-deep-black bg-white hover:bg-golden-yellow transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1"
                      >
                        DETAILS
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); paybill(order); }}
                        className="h-10 px-4 font-mono font-black uppercase text-[9px] border-2 border-deep-black bg-deep-black text-warm-white hover:bg-golden-yellow hover:text-deep-black transition-all shadow-[3px_3px_0px_0px_rgba(245,180,0,1)] active:shadow-none active:translate-y-1"
                      >
                        PAY_BILL
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ── PAGINATION ─────────────────────────────────── */}
      <div className="flex items-center justify-between border-t-2 border-deep-black pt-8">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground font-black">
          Page_Index: {page} of {totalPages}
        </span>
        <Pagination>
          <PaginationContent className="gap-2">
            <PaginationPrevious>
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="h-12 w-12 border-2 border-deep-black bg-white hover:bg-golden-yellow flex items-center justify-center font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1"
              >
                <ChevronLeft size={18} />
              </button>
            </PaginationPrevious>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNumber = i + Math.max(1, Math.min(page - 2, totalPages - 4));
              return (
                <PaginationItem key={i}>
                  <button
                    onClick={() => goToPage(pageNumber)}
                    className={cn(
                      "h-12 w-12 border-2 border-deep-black font-sans font-black text-sm transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1",
                      page === pageNumber
                        ? "bg-deep-black text-golden-yellow"
                        : "bg-white text-deep-black hover:bg-golden-yellow"
                    )}
                  >
                    {pageNumber}
                  </button>
                </PaginationItem>
              );
            })}
            <PaginationNext>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className="h-12 w-12 border-2 border-deep-black bg-white hover:bg-golden-yellow flex items-center justify-center font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1"
              >
                <ChevronRight size={18} />
              </button>
            </PaginationNext>
          </PaginationContent>
        </Pagination>
      </div>

      {/* ── ORDER DETAIL MODAL ─────────────────────────── */}
      <AnimatePresence>
        {activeOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 z-50 grid place-items-center p-4 backdrop-blur-sm"
          >
            <motion.div
              ref={ref}
              layout
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-warm-white border-4 border-deep-black shadow-[24px_24px_0px_0px_#F5B400] max-w-2xl w-full relative max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="bg-deep-black text-warm-white p-8 relative">
                <button
                  onClick={() => setActiveOrder(null)}
                  className="absolute top-6 right-6 w-10 h-10 border-2 border-warm-white/30 flex items-center justify-center hover:bg-golden-yellow hover:text-deep-black hover:border-golden-yellow transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-golden-yellow mb-2 font-black">
                  Order_Record
                </p>
                <h2 className="font-sans font-black text-4xl uppercase tracking-tighter leading-none mb-2">
                  ORDER_DETAIL
                </h2>
                <p className="font-mono text-[9px] uppercase tracking-widest text-warm-white/40 font-black">
                  ID: {activeOrder.customOrderID ?? activeOrder._id}
                </p>
              </div>

              <div className="p-8 space-y-8">
                {/* Billing Summary */}
                <div className="grid grid-cols-2 gap-0 border-2 border-deep-black">
                  <div className="p-6 border-r-2 border-deep-black">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-3 font-black">Billing_Summary</p>
                    <p className="font-mono text-[10px] text-deep-black/70 mb-1 uppercase">Subtotal: ₹{activeOrder.totalPrice.toFixed(2)}</p>
                    <p className="font-mono text-[10px] text-green-700 mb-1 uppercase">Discount ({activeOrder.discountPercent ?? 0}%): -₹{((activeOrder.totalPrice * (activeOrder.discountPercent ?? 0)) / 100).toFixed(2)}</p>
                    <p className="font-mono text-[10px] text-orange-700 uppercase">Tax ({activeOrder.taxRate ?? 0}%): +₹{(((activeOrder.totalPrice - (activeOrder.totalPrice * (activeOrder.discountPercent ?? 0)) / 100) * (activeOrder.taxRate ?? 0)) / 100).toFixed(2)}</p>
                    <div className="border-t-2 border-deep-black mt-4 pt-4">
                      <p className="font-sans font-black text-3xl text-deep-black tracking-tighter">₹{calculateFinalPrice(activeOrder).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-3 font-black">Transaction_Meta</p>
                    <div className="space-y-2">
                      <p className="font-mono text-[10px] uppercase text-deep-black">Payment: <span className="font-black text-deep-black">{activeOrder.paymentMethod?.toUpperCase()}</span></p>
                      {activeOrder.table && (
                        <>
                          <p className="font-mono text-[10px] uppercase text-deep-black">Table: <span className="font-black">{activeOrder.table.name}</span></p>
                          <p className={cn("font-mono text-[10px] uppercase font-black", activeOrder.table.status === "occupied" ? "text-red-600" : "text-green-600")}>
                            Status: {activeOrder.table.status?.toUpperCase()}
                          </p>
                        </>
                      )}
                      <p className="font-mono text-[10px] uppercase text-deep-black">Date: <span className="font-black">{new Date(activeOrder.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</span></p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-8 h-8 bg-deep-black flex items-center justify-center font-mono font-black text-golden-yellow text-xs">
                      {activeOrder.items.length}
                    </div>
                    <h3 className="font-sans font-black text-xl uppercase tracking-tighter">ORDER_ITEMS</h3>
                  </div>
                  <div className="border-l-2 border-t-2 border-deep-black max-h-80 overflow-y-auto">
                    {activeOrder.items.map((item) => (
                      <div key={item._id} className="border-r-2 border-b-2 border-deep-black p-5 flex items-center justify-between bg-white hover:bg-warm-white transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-deep-black text-golden-yellow flex items-center justify-center font-mono font-black text-sm shrink-0">
                            {item.quantity}x
                          </div>
                          <div>
                            <p className="font-sans font-black text-sm uppercase tracking-tight text-deep-black">
                              {item.product?.name ?? "PRODUCT_DELETED"}
                            </p>
                            <p className="font-mono text-[9px] uppercase text-muted-foreground">
                              Size: {item.size} · ₹{item.price} each
                            </p>
                          </div>
                        </div>
                        <p className="font-sans font-black text-lg text-deep-black tracking-tighter">
                          ₹{(item.quantity * item.price).toFixed(0)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 border-t-2 border-deep-black pt-8">
                  <Select
                    value={activeOrder.status}
                    onValueChange={(val) => handleStatusChange(activeOrder._id, val)}
                    disabled={updatingId === activeOrder._id}
                  >
                    <SelectTrigger className="flex-1 h-14 bg-white text-deep-black rounded-none border-2 border-deep-black font-black uppercase text-xs focus:ring-0">
                      <SelectValue placeholder="UPDATE_STATUS" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-2 border-deep-black bg-white p-0 shadow-none">
                      {["pending","preparing","served","cancelled"].map(v => (
                        <SelectItem key={v} value={v} className="font-black uppercase text-xs hover:bg-golden-yellow transition-colors">{v.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {role === "admin" && (
                    <button
                      className="flex-1 h-14 bg-red-600 text-white border-2 border-red-800 font-sans font-black uppercase flex items-center justify-center gap-3 hover:bg-red-700 transition-all shadow-[4px_4px_0px_0px_rgba(150,0,0,1)] active:shadow-none active:translate-y-1"
                      onClick={async () => {
                        Swal.showLoading();
                        await deleteOrder(activeOrder._id);
                        Swal.close();
                        setActiveOrder(null);
                      }}
                    >
                      <Trash2 size={18} /> DELETE_RECORD
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PAYMENT DIALOG ─────────────────────────────── */}
      <AlertDialog open={openPaymentDialog} onOpenChange={setOpenPaymentDialog}>
        <AlertDialogContent className="rounded-none border-4 border-deep-black shadow-[24px_24px_0px_0px_#F5B400] max-w-md bg-warm-white p-0">
          <div className="bg-deep-black text-warm-white p-8">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-sans font-black text-3xl uppercase tracking-tighter text-warm-white text-left">PAYMENT_PROTOCOL</AlertDialogTitle>
              <AlertDialogDescription className="font-mono text-[10px] uppercase tracking-[0.3em] text-golden-yellow text-left">
                Select payment vector for this transaction.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div>
              <label className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-2 block font-black">Payment_Method</label>
              <Select
                value={selectedPayment}
                onValueChange={(val) => setSelectedPayment(val as "cash" | "digital" | "upi")}
              >
                <SelectTrigger className="h-14 bg-white text-deep-black rounded-none border-2 border-deep-black font-black uppercase text-xs focus:ring-0">
                  <SelectValue placeholder="CHOOSE_METHOD" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-2 border-deep-black bg-white p-0 shadow-none">
                  {settingsData?.data?.allowCash    && <SelectItem value="cash"    className="font-black uppercase text-xs hover:bg-golden-yellow">💵 CASH</SelectItem>}
                  {settingsData?.data?.allowDigital && <SelectItem value="digital" className="font-black uppercase text-xs hover:bg-golden-yellow">💳 DIGITAL (CARD/BANK)</SelectItem>}
                  {settingsData?.data?.allowUPI     && <SelectItem value="upi"     className="font-black uppercase text-xs hover:bg-golden-yellow">📱 UPI_QR_PAY</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {selectedPayment === "upi" && activePaymentOrder && (
              <div className="flex flex-col items-center bg-white border-2 border-deep-black p-8 relative">
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-golden-yellow border-2 border-deep-black"></div>
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-golden-yellow border-2 border-deep-black"></div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-6 font-black">SCAN_TO_COLLECT</p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${settingsData?.data?.upiId}&pn=${settingsData?.data?.businessName}&am=${calculateFinalPrice(activePaymentOrder).toFixed(2)}&cu=INR&tn=Order_${activePaymentOrder.customOrderID}`)}`}
                  alt="UPI QR"
                  className="w-44 h-44 border-2 border-deep-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                />
                <div className="mt-6 text-center">
                  <p className="font-sans font-black uppercase text-sm text-deep-black">{settingsData?.data?.businessName}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{settingsData?.data?.upiId}</p>
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter className="flex gap-4 px-8 pb-8 border-t-2 border-deep-black pt-6">
            <AlertDialogCancel className="flex-1 h-14 bg-white border-2 border-deep-black font-sans font-black uppercase text-sm hover:bg-warm-white transition-all rounded-none">
              ABORT
            </AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 h-14 bg-deep-black text-warm-white border-2 border-deep-black font-sans font-black uppercase text-sm hover:bg-golden-yellow hover:text-deep-black transition-all rounded-none shadow-[4px_4px_0px_0px_#F5B400] active:shadow-none"
              onClick={async () => {
                if (!activePaymentOrder) return;
                try {
                  await updateOrder({ id: activePaymentOrder._id, data: { paymentMethod: selectedPayment } }).unwrap();
                  setOpenPaymentDialog(false);
                  Swal.fire("✅ TRANSACTION_CONFIRMED", `Payment committed via ${selectedPayment.toUpperCase()}`, "success");
                } catch {
                  Swal.fire("❌ TRANSACTION_FAILED", "Unable to update payment method", "error");
                }
              }}
            >
              CONFIRM_PAYMENT
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrdersDashboard;
