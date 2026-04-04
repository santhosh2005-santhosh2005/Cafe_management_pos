import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearCart, removeItem, updateQuantity } from "@/store/cartSlice";
import type { RootState } from "@/store";
import {
  Banknote,
  CheckCircle,
  CreditCard,
  Minus,
  Plus,
  QrCode,
  ShoppingCart,
  Trash2,
  Receipt,
  Tag,
} from "lucide-react";
import { useCreateOrderMutation } from "@/services/orderApi";
import { useGetTablesQuery, useUpdateTableStatusMutation } from "@/services/tableApi";
import { useGetSettingsQuery } from "@/services/SettingsApi";
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
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { DiscountDialog } from "./SetDiscount";
import { printReceipt } from "@/utils/printReceipt";
import { io } from "socket.io-client";
import BrutalistButton from "./BrutalistButton";

const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5001");

// ── Theme (Modern Organic Brutalist with Forest Green base) ──────────────────
const FOREST_GREEN = "#012E21";
const RICH_CREAM = "#FDFBF7";
const GOLDEN_YELLOW = "#F5B400";
const ELECTRIC_LIME = "#C6FF00";
const DEEP_BLACK = "#0A0A0A";

interface OrderSidebarProps {
  disabled?: boolean;
}

export default function OrderSidebar({ disabled }: OrderSidebarProps) {
  const dispatch = useDispatch();
  const { items, totalPrice } = useSelector((state: RootState) => state.cart);
  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const [updateTableStatus] = useUpdateTableStatusMutation();
  const { data: tablesData } = useGetTablesQuery();
  const tables = tablesData?.data || [];

  const [discountDialog, setDiscountDialog] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "digital" | "upi">("cash");
  const [showQR, setShowQR] = useState(false);
  const [showGateway, setShowGateway] = useState(false);
  const [gatewayProcessing, setGatewayProcessing] = useState(false);
  const [selectedGatewayMethod, setSelectedGatewayMethod] = useState<string>("CC");
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<any>(null);
  const [qrVerifying, setQrVerifying] = useState(false);

  const { data: settingsData } = useGetSettingsQuery({});
  const taxRate = settingsData?.data?.taxRate || 0;
  const defaultDiscount = settingsData?.data?.defaultDiscount || 0;

  useEffect(() => {
    if (settingsData?.data) {
      setDiscountPercent(settingsData.data.defaultDiscount || 0);
    }
  }, [settingsData]);

  const discountAmount = (totalPrice * discountPercent) / 100;
  const taxAmount = (totalPrice - discountAmount) * (taxRate / 100);
  const finalTotal = totalPrice - discountAmount + taxAmount;

  useEffect(() => {
    socket.emit("cashierCartUpdate", {
      cart: items,
      totalPrice: finalTotal,
      paymentStatus: showSuccessScreen ? "paid" : "unpaid"
    });
  }, [items, finalTotal, showSuccessScreen]);

  const confirmCheckout = async (shouldPrint: boolean = true) => {
    let receiptWindow: any = null;
    if (shouldPrint) {
      receiptWindow = window.open("", "_blank", "width=800,height=600");
    }
    try {
      Swal.showLoading();
      const itemsToPrint = items.map((item) => ({ ...item, productId: { name: item.name } }));
      const orderData = {
        items: items.map((item) => ({
          product: item.productId, quantity: item.quantity, size: item.size, price: item.price,
        })),
        totalItems: items.reduce((acc, item) => acc + item.quantity, 0),
        totalPrice: finalTotal,
        discount: discountAmount,
        tax: taxAmount,
        paymentMethod,
        table: selectedTable || null,
        status: "pending",
      };
      const result = await createOrder(orderData).unwrap();
      const finalResult = result.data || result;
      setLastOrderDetails({ id: finalResult._id?.slice(-6).toUpperCase(), total: finalTotal });
      setShowSuccessScreen(true);
      dispatch(clearCart());
      setDiscountPercent(defaultDiscount);
      setConfirmOpen(false);
      setShowQR(false);
      setTimeout(() => setShowSuccessScreen(false), 4500);
      if (selectedTable) {
        await updateTableStatus({ id: selectedTable, status: "occupied" }).unwrap();
        setSelectedTable(null);
      }
      if (shouldPrint && settingsData?.data && receiptWindow) {
        printReceipt(finalResult, itemsToPrint, discountPercent, tables, selectedTable, totalPrice, {
          businessName: settingsData.data.businessName, address: settingsData.data.address,
          phone: settingsData.data.phone, website: settingsData.data.website,
          receiptFooter: settingsData.data.receiptFooter, taxRate: settingsData.data.taxRate,
        }, receiptWindow);
      }
    } catch (err) {
      if (receiptWindow) receiptWindow.close();
      Swal.close();
      toast.error("Failed to place order");
    }
  };

  const handlePaymentWithAPI = () => {
    const keyId = settingsData?.data?.razorpayKeyId;
    if (keyId) {
      const options = {
        key: keyId,
        amount: Math.round(finalTotal * 100),
        currency: "INR",
        name: settingsData?.data?.businessName || "Odoo POS Cafe",
        description: "Point of Sale Settlement",
        handler: function (response: any) {
          toast.success(`Payment Success: ${response.razorpay_payment_id}`);
          confirmCheckout(true);
        },
        modal: { ondismiss: function () { toast.error("Payment was cancelled"); } },
        prefill: { name: "Guest Customer", email: "guest@odoocafe.com" },
        theme: { color: GOLDEN_YELLOW },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } else {
      setShowGateway(true);
      setGatewayProcessing(false);
    }
  };

  const simulateGatewaySettlement = () => {
    setGatewayProcessing(true);
    toast.promise(
      new Promise((res) => setTimeout(res, 2500)),
      { loading: "Authorizing with Bank...", success: "Payment Captured!", error: "Authorization Failed" }
    ).then(() => { setShowGateway(false); confirmCheckout(true); });
  };

  const handleClearCart = () => { dispatch(clearCart()); toast.success("Cart cleared!"); };

  return (
    <div className="w-full h-full flex flex-col p-6 bg-forest-green border-l-[10px] border-deep-black text-rich-cream">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-6 border-b-4 border-golden-yellow/20">
        <h2 className="text-xl font-heading italic uppercase tracking-tighter flex items-center gap-3 text-white">
          <Receipt className="w-6 h-6 text-golden-yellow" /> CURRENT_ORDER
        </h2>
        <button
          onClick={handleClearCart}
          className="text-[10px] font-heading italic uppercase tracking-widest px-4 py-2 border-2 border-white/20 bg-transparent hover:bg-red-500 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]"
        >
          RESET_MANIFEST
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-4 pr-2 custom-scrollbar">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 opacity-20">
            <ShoppingCart className="w-16 h-16" />
            <p className="text-xs font-heading italic uppercase">NO_ACTIVE_TRANSMISSIONS</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={`${item.productId}-${item.size}`}
              className="flex items-center gap-4 p-4 border-2 border-white/10 bg-white/5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:border-golden-yellow/50 transition-colors"
            >
              <img
                src={item.imageUrl || "/placeholder.png"}
                className="w-12 h-12 object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-heading italic text-xs uppercase truncate text-white">{item.name}</p>
                <p className="text-[10px] font-mono mt-0.5 opacity-50">{item.size} | ₹{item.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 border-2 border-white/20 bg-black/20">
                <button onClick={() => dispatch(updateQuantity({ productId: item.productId, size: item.size, quantity: Math.max(1, item.quantity - 1) }))}>
                  <Minus className="w-4 h-4 text-golden-yellow" />
                </button>
                <span className="text-xs font-heading italic w-4 text-center text-white">{item.quantity}</span>
                <button onClick={() => dispatch(updateQuantity({ productId: item.productId, size: item.size, quantity: item.quantity + 1 }))}>
                  <Plus className="w-4 h-4 text-golden-yellow" />
                </button>
              </div>
              <button 
                onClick={() => dispatch(removeItem({ productId: item.productId, size: item.size }))}
                className="p-2 hover:bg-red-500/20 text-red-400 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Bottom Controls */}
      <div className="space-y-4 pt-6 border-t-4 border-golden-yellow/20">
        {/* Table & Discount */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest opacity-40">MAPPING_STATION</label>
            <select
              className="w-full h-12 px-3 font-heading italic uppercase text-xs border-2 border-white/20 bg-black/40 text-white focus:outline-none focus:border-golden-yellow transition-colors"
              value={selectedTable || ""}
              onChange={(e) => setSelectedTable(e.target.value || null)}
            >
              <option value="" className="bg-forest-green">REMOTE_PICKUP</option>
              {tables.map((t: any) => (
                <option key={t._id} value={t._id} disabled={t.status === "occupied"} className="bg-forest-green">
                  STATION_{t.tableName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest opacity-40">SYSTEM_CREDIT</label>
            <button
              onClick={() => setDiscountDialog(true)}
              className="w-full h-12 font-heading italic uppercase text-xs border-2 border-white/20 bg-black/20 flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
            >
              <Tag className="w-4 h-4 text-golden-yellow" /> {discountPercent}%_SET
            </button>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono uppercase tracking-widest opacity-40">SETTLEMENT_PROTOCOL</label>
          <div className="flex gap-2">
            {[
              { key: "cash", icon: <Banknote className="w-5 h-5" />, label: "CASH" },
              { key: "digital", icon: <CreditCard className="w-5 h-5" />, label: "CARD" },
              { key: "upi", icon: <QrCode className="w-5 h-5" />, label: "UPI" },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setPaymentMethod(key as any)}
                className={`flex-1 py-4 border-4 flex flex-col items-center gap-2 font-heading italic transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-none ${
                  paymentMethod === key
                    ? "bg-golden-yellow text-deep-black border-white"
                    : "bg-white/5 text-white/60 border-white/10 hover:border-white/30"
                }`}
              >
                {icon}
                <span className="text-[9px] uppercase tracking-widest">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Price Summary */}
        <div className="p-4 border-2 border-white/10 bg-black/30 space-y-2">
          <div className="flex justify-between text-[10px] font-mono uppercase opacity-50">
            <span>Subtotal</span><span>₹{totalPrice.toFixed(2)}</span>
          </div>
          {discountPercent > 0 && (
            <div className="flex justify-between text-[10px] font-mono uppercase text-electric-lime">
              <span>Discount ({discountPercent}%)</span><span>-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-[10px] font-mono uppercase opacity-50">
            <span>Tax ({taxRate}%)</span><span>+₹{taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-heading italic text-3xl pt-3 border-t-2 border-white/10 text-white">
            <span>TOTAL</span>
            <span className="text-golden-yellow">₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <BrutalistButton
          disabled={items.length === 0 || disabled || isLoading}
          onClick={() => {
            if (paymentMethod === "digital") handlePaymentWithAPI();
            else { setShowQR(paymentMethod === "upi"); setConfirmOpen(true); }
          }}
          variant="primary"
          className="w-full h-16 text-sm"
        >
          {paymentMethod === "digital" ? "INIT_SECURE_GATEWAY" : "EXECUTE_SETTLEMENT"}
        </BrutalistButton>
      </div>

      <DiscountDialog open={discountDialog} onClose={() => setDiscountDialog(false)} onApply={setDiscountPercent} />

      {/* ── UPI / Cash Confirm Dialog ── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md border-[6px] border-deep-black bg-white rounded-none p-0 overflow-hidden shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
          <AlertDialogHeader className="p-8 border-b-4 border-deep-black bg-forest-green text-white">
            <AlertDialogTitle className="text-3xl font-heading italic uppercase tracking-tighter flex items-center justify-center gap-3">
              {qrVerifying ? (
                <div className="flex flex-col items-center gap-6 py-4">
                  <div className="w-16 h-16 border-8 border-t-transparent animate-spin border-electric-lime"></div>
                  <div className="text-center">
                    <p className="text-xl italic">SYNCING_STATUS...</p>
                    <p className="system-status text-electric-lime animate-pulse mt-2">LINK_DETECTED_AUTHORIZING</p>
                  </div>
                </div>
              ) : (
                <><QrCode className="w-8 h-8 text-golden-yellow" /> VERIFY_SETTLEMENT</>
              )}
            </AlertDialogTitle>
            {!qrVerifying && (
              <AlertDialogDescription className="text-center system-status opacity-50 mt-4 text-white/60">
                [ PROTOCOL ]: WAIT_FOR_CUSTOMER_AUTH_PIN_ENTRY<br/>
                CLICK_VERIFY_TO_CLOSE_LEDGER
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>

          {!qrVerifying && showQR && (
            <div className="flex flex-col items-center justify-center p-8 bg-rich-cream">
              <div className="p-4 bg-white border-4 border-deep-black shadow-[12px_12px_0px_0px_#000]">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${settingsData?.data?.upiId}%26pn=${settingsData?.data?.businessName}%26am=${finalTotal.toFixed(2)}%26cu=INR`}
                  alt="UPI QR"
                  className="w-48 h-48 grayscale hover:grayscale-0 transition-all"
                />
              </div>
              <p className="mt-8 font-heading italic text-3xl px-8 py-2 bg-golden-yellow border-4 border-deep-black shadow-[4px_4px_0_0_#000]">
                ₹{finalTotal.toFixed(2)}
              </p>
            </div>
          )}

          <AlertDialogFooter className="p-6 gap-4 bg-white">
            {!qrVerifying && (
              <>
                <AlertDialogCancel
                  onClick={() => setShowQR(false)}
                  className="flex-1 h-16 font-heading italic uppercase text-xs border-4 border-deep-black rounded-none shadow-[4px_4px_0px_0px_#000] hover:bg-rich-cream transition-all"
                >
                  ABORT_SESSION
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    setQrVerifying(true);
                    setTimeout(() => { setQrVerifying(false); confirmCheckout(true); }, 2500);
                  }}
                  className="flex-1 h-16 font-heading italic uppercase text-xs border-4 border-deep-black bg-golden-yellow text-deep-black rounded-none shadow-[4px_4px_0px_0px_#000] hover:bg-electric-lime transition-all"
                >
                  {showQR ? "VERIFY_&_PRINT" : "AUTH_MANUAL"}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Digital Gateway Dialog ── */}
      <AlertDialog open={showGateway} onOpenChange={setShowGateway}>
        <AlertDialogContent className="max-w-md border-[6px] border-deep-black bg-white rounded-none p-0 overflow-hidden shadow-[20px_20px_0px_0px_#F5B400]">
          <div className="p-8 text-center border-b-4 border-deep-black bg-forest-green text-white">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 border-4 border-golden-yellow bg-white text-deep-black">
              <CreditCard className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-heading italic uppercase">SECURE_GATEWAY_V2</h3>
            <p className="system-status text-golden-yellow mt-2">ENCRYPTED_MERCHANT_TUNNEL</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="flex justify-between items-center pb-6 border-b-4 border-deep-black">
              <span className="system-status">AMOUNT_DUE</span>
              <span className="text-4xl font-heading italic">₹{finalTotal.toFixed(2)}</span>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setSelectedGatewayMethod("CC")}
                className={`w-full p-6 border-4 flex items-center gap-6 transition-all ${
                  selectedGatewayMethod === "CC"
                  ? "bg-golden-yellow border-deep-black shadow-[8px_8px_0px_0px_#000]"
                  : "bg-rich-cream border-deep-black/10 grayscale"
                }`}
              >
                <div className="w-12 h-12 flex items-center justify-center font-heading text-xl bg-white border-2 border-deep-black">CC</div>
                <div className="flex-1 text-left">
                  <p className="font-heading italic text-sm uppercase">CREDIT_DEBIT_UNIT</p>
                  <p className="system-status opacity-40">ISO_AUTHORIZATION_ENABLED</p>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-4">
                {[{ key: "NB", icon: <Banknote className="w-5 h-5" />, label: "NET_LINK" }, { key: "U", icon: <QrCode className="w-5 h-5" />, label: "UPI_DIRECT" }].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setSelectedGatewayMethod(m.key)}
                    className={`p-4 border-4 flex flex-col items-center gap-2 transition-all ${
                      selectedGatewayMethod === m.key
                      ? "bg-golden-yellow border-deep-black shadow-[4px_4px_0px_0px_#000]"
                      : "bg-rich-cream border-deep-black/10 grayscale"
                    }`}
                  >
                    {m.icon}
                    <span className="system-status text-[9px]">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <BrutalistButton
              onClick={simulateGatewaySettlement}
              disabled={gatewayProcessing}
              variant="primary"
              className="w-full"
            >
              {gatewayProcessing ? "EXECUTING_SYNC..." : "AUTHORIZE_MANIFEST"}
            </BrutalistButton>
            <p className="system-status text-center text-[8px]">PCI_DSS_V4.0 • 4096_BIT_RSA_ENCRYPTION</p>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Success Screen ── */}
      {showSuccessScreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-deep-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="p-16 text-center max-w-lg w-full mx-4 border-[8px] border-electric-lime bg-white shadow-[30px_30px_0px_0px_#000] rotate-1">
            <div className="w-24 h-24 flex items-center justify-center mx-auto mb-8 border-4 border-deep-black bg-electric-lime text-deep-black">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-5xl font-heading italic uppercase italic mb-4">MANIFEST_VERIFIED</h2>
            <p className="system-status opacity-50 mb-10 tracking-[0.3em]">TRANSACTION_LOCKED_&_ACKNOWLEDGED</p>

            <div className="p-6 space-y-4 mb-10 border-4 border-deep-black bg-rich-cream text-left">
              <div className="flex justify-between system-status">
                <span>INVOICE_ID</span>
                <span className="font-bold">ORD_{lastOrderDetails?.id || "N/A"}</span>
              </div>
              <div className="flex justify-between system-status pt-4 border-t-2 border-deep-black/10">
                <span>AUTH_METHOD</span>
                <span className="text-golden-yellow font-bold">{paymentMethod.toUpperCase()}</span>
              </div>
            </div>

            <div className="text-7xl font-heading italic mb-10">₹{lastOrderDetails?.total.toFixed(2)}</div>

            <div className="flex items-center justify-center gap-4 py-4 bg-deep-black text-electric-lime">
              <div className="w-3 h-3 bg-electric-lime animate-ping"></div>
              <span className="font-heading italic uppercase text-sm tracking-widest">KITCHEN_SYNC_OPERATIONAL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
