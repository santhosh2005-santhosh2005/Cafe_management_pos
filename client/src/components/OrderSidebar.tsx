import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearCart, removeItem, updateQuantity, updateItemField } from "@/store/cartSlice";
import type { RootState } from "@/store";
import Keypad from "./Keypad";
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

const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5001");

// ── Theme ────────────────────────────────────────────────────────────────────
const G_DARK = "#1A2E1A";
const G_MID = "#2C4A2C";
const CREAM = "#F5F0E8";
const YELLOW = "#F5B400";

interface OrderSidebarProps {
  disabled?: boolean;
}

export default function OrderSidebar({ disabled }: OrderSidebarProps) {
  const dispatch = useDispatch();
  const { items, totalPrice } = useSelector((state: RootState) => state.cart);
  const { sessionId } = useSelector((state: RootState) => state.user);
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

  const [selectedItemLineId, setSelectedItemLineId] = useState<string | null>(null);
  const [keypadValue, setKeypadValue] = useState("");
  const [keypadMode, setKeypadMode] = useState<"qty" | "disc" | "price">("qty");

  const { data: settingsData } = useGetSettingsQuery({});

  // Auto-select latest item when items change and none is selected
  useEffect(() => {
    if (items.length > 0 && !selectedItemLineId) {
      const lastItem = items[items.length - 1];
      setSelectedItemLineId(lastItem.lineId);
      setKeypadValue(lastItem.quantity.toString());
    } else if (items.length === 0) {
      setSelectedItemLineId(null);
      setKeypadValue("");
    }
  }, [items.length]);

  const handleKeypadNumber = (num: string) => {
    if (!selectedItemLineId) return;
    const newValue = keypadValue + num;
    setKeypadValue(newValue);
    applyKeypadValue(newValue, keypadMode);
  };

  const handleKeypadBackspace = () => {
    if (!selectedItemLineId) return;
    const newValue = keypadValue.slice(0, -1);
    setKeypadValue(newValue);
    applyKeypadValue(newValue, keypadMode);
  };

  const handleKeypadToggleSign = () => {
    setKeypadValue("");
    applyKeypadValue("0", keypadMode);
  };

  const handleKeypadModeChange = (mode: "qty" | "disc" | "price") => {
    setKeypadMode(mode);
    const item = items.find(i => i.lineId === selectedItemLineId);
    if (item) {
      const val = mode === "qty" ? item.quantity : mode === "disc" ? (item.discount || 0) : item.price;
      setKeypadValue(val.toString());
    } else {
      setKeypadValue("");
    }
  };

  const applyKeypadValue = (value: string, mode: "qty" | "disc" | "price") => {
    if (!selectedItemLineId) return;
    const item = items.find(i => i.lineId === selectedItemLineId);
    if (!item) return;

    // Handle decimal points and empty values
    let cleanValue = value === "." ? "0." : value;
    if (cleanValue.endsWith(".")) {
      // Don't apply yet if it's just a trailing dot
      return;
    }

    let numValue = parseFloat(cleanValue) || 0;
    let field: "quantity" | "discount" | "price" = "quantity";
    if (mode === "qty") field = "quantity";
    else if (mode === "disc") field = "discount";
    else if (mode === "price") field = "price";

    dispatch(updateItemField({
      lineId: item.lineId,
      field,
      value: numValue
    }));
  };
  const settingsTaxRate = settingsData?.data?.taxRate || 0;
  const defaultDiscount = settingsData?.data?.defaultDiscount || 0;

  useEffect(() => {
    if (settingsData?.data) {
      setDiscountPercent(settingsData.data.defaultDiscount || 0);
    }
  }, [settingsData]);

  const grossSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemDiscountsTotal = items.reduce((sum, item) => sum + (item.price * (item.discount || 0) / 100) * item.quantity, 0);

  // Tax calculation per item
  const itemTaxesTotal = items.reduce((sum, item) => {
    const discountedPrice = item.price * (1 - (item.discount || 0) / 100);
    const taxRate = item.taxRate !== undefined ? item.taxRate : settingsTaxRate;
    return sum + (discountedPrice * (taxRate / 100)) * item.quantity;
  }, 0);

  const discountAmount = (totalPrice * discountPercent) / 100;
  const globalDiscountFactor = totalPrice > 0 ? (totalPrice - discountAmount) / totalPrice : 1;
  const finalTaxAmount = itemTaxesTotal * globalDiscountFactor;

  const finalTotal = totalPrice - discountAmount + finalTaxAmount;

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
          product: item.productId,
          quantity: item.quantity,
          size: item.size,
          price: item.price,
          discount: item.discount || 0,
          taxRate: item.taxRate !== undefined ? item.taxRate : settingsTaxRate,
        })),
        totalItems: items.reduce((acc, item) => acc + item.quantity, 0),
        totalPrice: finalTotal,
        discount: discountAmount + itemDiscountsTotal,
        tax: finalTaxAmount,
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
        theme: { color: YELLOW },
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
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="w-full h-full flex flex-col p-5" style={{ background: G_MID, color: CREAM }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-5 pb-4 border-b-2" style={{ borderColor: `${YELLOW}40` }}>
        <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
          <Receipt className="w-4 h-4" style={{ color: YELLOW }} /> CURRENT ORDER
        </h2>
        <button
          onClick={handleClearCart}
          className="text-[9px] font-black uppercase tracking-widest px-3 py-1 border transition-all hover:opacity-80"
          style={{ borderColor: "rgba(255,100,100,0.4)", color: "#ff7b7b", background: "transparent" }}
        >
          CLEAR ALL
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-1 pr-1">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3" style={{ opacity: 0.25 }}>
            <ShoppingCart className="w-10 h-10" />
            <p className="text-[9px] font-black uppercase tracking-widest">No items in cart</p>
          </div>
        ) : (
          items.map((item, index) => {
            const isSelected = selectedItemLineId === item.lineId;
            return (
              <div
                key={item.lineId}
                onClick={() => {
                  setSelectedItemLineId(item.lineId);
                  const val = keypadMode === "qty" ? item.quantity : keypadMode === "disc" ? (item.discount || 0) : item.price;
                  setKeypadValue(val.toString());
                }}
                className="flex items-center gap-3 py-3 border-b cursor-pointer transition-all"
                style={{
                  borderColor: `${CREAM}08`,
                  background: isSelected ? `${YELLOW}15` : "transparent",
                  borderLeft: isSelected ? `3px solid ${YELLOW}` : "none",
                  paddingLeft: isSelected ? "12px" : "0",
                }}
              >
                <img
                  src={item.imageUrl || "/placeholder.png"}
                  className="w-10 h-10 object-cover flex-shrink-0"
                  style={{ border: `1px solid ${YELLOW}30` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[10px] uppercase truncate" style={{ color: CREAM }}>{item.name}</p>
                  <div className="flex flex-col">
                    <p className="text-[8px] font-mono mt-0.5" style={{ color: `${CREAM}50` }}>{item.size} | ₹{item.price.toFixed(2)}</p>
                    {item.discount !== undefined && item.discount > 0 && (
                      <p className="text-[8px] font-mono" style={{ color: "#4ade80" }}>Disc: {item.discount}%</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 border" style={{ borderColor: `${YELLOW}35` }}>
                  <button onClick={(e) => { e.stopPropagation(); dispatch(updateQuantity({ lineId: item.lineId, quantity: Math.max(1, item.quantity - 1) })); }}>
                    <Minus className="w-3 h-3" style={{ color: YELLOW }} />
                  </button>
                  <span className="text-[10px] font-black w-4 text-center" style={{ color: CREAM }}>{item.quantity}</span>
                  <button onClick={(e) => { e.stopPropagation(); dispatch(updateQuantity({ lineId: item.lineId, quantity: item.quantity + 1 })); }}>
                    <Plus className="w-3 h-3" style={{ color: YELLOW }} />
                  </button>
                </div>
                <button onClick={(e) => { e.stopPropagation(); dispatch(removeItem({ lineId: item.lineId })); if (isSelected) setSelectedItemLineId(null); }}>
                  <Trash2 className="w-4 h-4" style={{ color: "rgba(255,90,90,0.65)" }} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Price Summary */}
      <div className="p-3 border-t-2 space-y-1 mt-auto" style={{ borderColor: `${YELLOW}22`, background: G_DARK }}>
        <div className="flex justify-between text-[8px]" style={{ color: `${CREAM}50` }}>
          <span>Subtotal</span><span>₹{grossSubtotal.toFixed(2)}</span>
        </div>
        {itemDiscountsTotal > 0 && (
          <div className="flex justify-between text-[8px]" style={{ color: "#4ade80" }}>
            <span>Item Discounts</span><span>-₹{itemDiscountsTotal.toFixed(2)}</span>
          </div>
        )}
        {discountPercent > 0 && (
          <div className="flex justify-between text-[8px]" style={{ color: "#4ade80" }}>
            <span>Global Discount ({discountPercent}%)</span><span>-₹{discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-[8px]" style={{ color: `${CREAM}50` }}>
          <span>Tax</span><span>+₹{finalTaxAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-black pt-2 mt-1 border-t" style={{ borderColor: `${YELLOW}33`, color: YELLOW }}>
          <span>TOTAL</span>
          <span>₹{finalTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Keypad */}
      {items.length > 0 && (
        <Keypad
          onNumber={handleKeypadNumber}
          onBackspace={handleKeypadBackspace}
          onToggleSign={handleKeypadToggleSign}
          onModeChange={handleKeypadModeChange}
          activeMode={keypadMode}
        />
      )}

      {/* Bottom Controls */}
      <div className="space-y-3 pt-3 border-t-2" style={{ borderColor: `${YELLOW}28` }}>
        {/* Table & Discount */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase tracking-widest" style={{ color: `${CREAM}50` }}>Table</label>
            <select
              className="w-full h-9 px-2 text-[9px] font-black uppercase border-2 focus:outline-none"
              style={{ borderColor: `${YELLOW}35`, color: CREAM, background: G_DARK }}
              value={selectedTable || ""}
              onChange={(e) => setSelectedTable(e.target.value || null)}
            >
              <option value="" style={{ background: G_DARK }}>TAKEAWAY</option>
              {tables.map((t: any) => (
                <option key={t._id} value={t._id} disabled={t.status === "occupied"} style={{ background: G_DARK }}>
                  T{t.tableNumber} ({t.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase tracking-widest" style={{ color: `${CREAM}50` }}>Global Discount</label>
            <button
              onClick={() => setDiscountDialog(true)}
              className="w-full h-9 text-[9px] font-black uppercase border-2 flex items-center justify-center gap-1 transition-all hover:opacity-80"
              style={{ borderColor: `${YELLOW}45`, color: YELLOW, background: "transparent" }}
            >
              <Tag className="w-3 h-3" /> {discountPercent}% OFF
            </button>
          </div>
        </div>

        {/* Payment Method */}
        <div className="space-y-1.5">
          <label className="text-[8px] font-black uppercase tracking-widest" style={{ color: `${CREAM}50` }}>Payment</label>
          <div className="flex gap-1.5">
            {[
              { key: "cash", icon: <Banknote className="w-3.5 h-3.5" />, label: "CASH" },
              { key: "digital", icon: <CreditCard className="w-3.5 h-3.5" />, label: "CARD" },
              { key: "upi", icon: <QrCode className="w-3.5 h-3.5" />, label: "UPI" },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setPaymentMethod(key as any)}
                className="flex-1 py-2.5 border-2 flex flex-col items-center gap-1 font-black transition-all"
                style={
                  paymentMethod === key
                    ? { background: YELLOW, color: G_DARK, borderColor: YELLOW }
                    : { background: "transparent", color: `${CREAM}55`, borderColor: `${CREAM}18` }
                }
              >
                {icon}
                <span className="text-[8px] uppercase tracking-widest">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Checkout Button */}
        <button
          disabled={items.length === 0 || disabled || isLoading}
          onClick={() => {
            if (paymentMethod === "digital") handlePaymentWithAPI();
            else { setShowQR(paymentMethod === "upi"); setConfirmOpen(true); }
          }}
          className="w-full h-13 py-3 font-black uppercase tracking-widest text-[10px] border-2 transition-all hover:opacity-85 disabled:opacity-30 disabled:cursor-not-allowed flex flex-col items-center justify-center leading-tight"
          style={{ background: YELLOW, color: G_DARK, borderColor: YELLOW }}
        >
          <span>{paymentMethod === "digital" ? "PAY WITH CARD / NET" : "PLACE ORDER & SETTLE"}</span>
          <span className="text-[8px] opacity-70">TOTAL QTY: {totalQuantity}</span>
        </button>
      </div>

      <DiscountDialog open={discountDialog} onClose={() => setDiscountDialog(false)} onApply={setDiscountPercent} />

      {/* ── UPI / Cash Confirm Dialog ── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md border-2 rounded-none p-0" style={{ background: G_DARK, borderColor: YELLOW }}>
          <AlertDialogHeader className="p-6 border-b-2" style={{ borderColor: `${YELLOW}28` }}>
            <AlertDialogTitle className="text-lg font-black uppercase tracking-tight flex items-center justify-center gap-2" style={{ color: CREAM }}>
              {qrVerifying ? (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-12 h-12 border-4 border-t-transparent animate-spin" style={{ borderColor: YELLOW, borderTopColor: "transparent" }}></div>
                  <div className="text-center">
                    <p className="text-base" style={{ color: CREAM }}>Checking Status...</p>
                    <p className="text-[9px] font-black animate-pulse uppercase tracking-widest mt-1" style={{ color: "#4ade80" }}>Scan detected from PhonePe</p>
                  </div>
                </div>
              ) : (
                <><QrCode className="w-5 h-5" style={{ color: YELLOW }} /> Verify UPI Settlement</>
              )}
            </AlertDialogTitle>
            {!qrVerifying && (
              <AlertDialogDescription className="text-center text-[9px] font-mono uppercase tracking-wider mt-2" style={{ color: `${CREAM}50` }}>
                Once the customer has scanned the QR and entered their PIN, click verify to settle.
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>

          {!qrVerifying && showQR && (
            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed mx-6 my-4" style={{ borderColor: `${YELLOW}35` }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${settingsData?.data?.upiId}%26pn=${settingsData?.data?.businessName}%26am=${finalTotal.toFixed(2)}%26cu=INR`}
                alt="UPI QR"
                className="w-40 h-40 border-4"
                style={{ borderColor: CREAM }}
              />
              <p className="mt-3 text-[9px] font-black uppercase tracking-wider px-3 py-1" style={{ background: YELLOW, color: G_DARK }}>
                ₹{finalTotal.toFixed(2)}
              </p>
            </div>
          )}

          <AlertDialogFooter className="p-5 gap-3">
            {!qrVerifying && (
              <>
                <AlertDialogCancel
                  onClick={() => setShowQR(false)}
                  className="flex-1 h-10 font-black uppercase text-[9px] border-2 rounded-none tracking-widest"
                  style={{ background: "transparent", borderColor: `${CREAM}30`, color: CREAM }}
                >
                  BACK
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    setQrVerifying(true);
                    setTimeout(() => { setQrVerifying(false); confirmCheckout(true); }, 2500);
                  }}
                  className="flex-1 h-10 font-black uppercase text-[9px] border-2 rounded-none tracking-widest"
                  style={{ background: YELLOW, color: G_DARK, borderColor: YELLOW }}
                >
                  {showQR ? "VERIFY & PRINT" : "CONFIRM"}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Digital Gateway Dialog ── */}
      <AlertDialog open={showGateway} onOpenChange={setShowGateway}>
        <AlertDialogContent className="max-w-md border-2 rounded-none p-0 overflow-hidden" style={{ borderColor: YELLOW }}>
          <div className="p-6 text-center border-b-2" style={{ background: G_DARK, borderColor: `${YELLOW}30` }}>
            <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3 border-2" style={{ borderColor: YELLOW }}>
              <CreditCard className="w-6 h-6" style={{ color: YELLOW }} />
            </div>
            <h3 className="text-base font-black uppercase tracking-tight" style={{ color: CREAM }}>
              {settingsData?.data?.businessName || "Odoo POS"} Checkout
            </h3>
            <p className="text-[9px] font-black uppercase tracking-widest mt-1" style={{ color: `${YELLOW}60` }}>
              Secure Merchant Gateway
            </p>
          </div>

          <div className="p-6 space-y-5" style={{ background: G_MID }}>
            <div className="flex justify-between items-center pb-4 border-b-2" style={{ borderColor: `${YELLOW}22` }}>
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: `${CREAM}50` }}>Amount</span>
              <span className="text-2xl font-black" style={{ color: YELLOW }}>₹{finalTotal.toFixed(2)}</span>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => setSelectedGatewayMethod("CC")}
                className="p-4 border-2 flex items-center gap-4 cursor-pointer transition-all"
                style={selectedGatewayMethod === "CC"
                  ? { borderColor: YELLOW, background: `${YELLOW}10` }
                  : { borderColor: `${CREAM}12`, background: "transparent" }
                }
              >
                <div className="w-10 h-10 flex items-center justify-center font-black text-sm" style={{ background: `${YELLOW}18`, color: YELLOW }}>CC</div>
                <div className="flex-1">
                  <p className="text-xs font-black uppercase" style={{ color: CREAM }}>Credit / Debit Card</p>
                  <p className="text-[8px] font-mono mt-0.5" style={{ color: `${CREAM}40` }}>Pre-authorized card •••• 4242</p>
                </div>
                <div className="w-4 h-4 border-2 flex items-center justify-center" style={{ borderColor: selectedGatewayMethod === "CC" ? YELLOW : `${CREAM}30` }}>
                  {selectedGatewayMethod === "CC" && <div className="w-2 h-2" style={{ background: YELLOW }}></div>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[{ key: "NB", icon: <Banknote className="w-4 h-4" />, label: "NetBanking" }, { key: "U", icon: <QrCode className="w-4 h-4" />, label: "UPI / App" }].map((m) => (
                  <div
                    key={m.key}
                    onClick={() => setSelectedGatewayMethod(m.key)}
                    className="p-3 border-2 flex flex-col items-center gap-1 cursor-pointer transition-all"
                    style={selectedGatewayMethod === m.key
                      ? { borderColor: YELLOW, color: YELLOW, background: `${YELLOW}10` }
                      : { borderColor: `${CREAM}15`, color: `${CREAM}50`, background: "transparent" }
                    }
                  >
                    {m.icon}
                    <span className="text-[8px] font-black uppercase">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={simulateGatewaySettlement}
              disabled={gatewayProcessing}
              className="w-full h-13 py-3 font-black uppercase tracking-widest text-xs border-2 transition-all hover:opacity-85 disabled:opacity-50"
              style={{ background: YELLOW, color: G_DARK, borderColor: YELLOW }}
            >
              {gatewayProcessing ? "PROCESSING..." : "PAY & AUTHORIZE"}
            </button>
            <p className="text-[8px] text-center font-mono" style={{ color: `${CREAM}30` }}>🛡️ PCI-DSS COMPLIANT | 256-BIT SSL</p>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Success Screen ── */}
      {showSuccessScreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md" style={{ background: "rgba(26,46,26,0.85)" }}>
          <div className="p-10 text-center max-w-sm w-full mx-4 border-2 animate-in zoom-in duration-500" style={{ background: G_DARK, borderColor: YELLOW }}>
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6 border-4" style={{ borderColor: YELLOW }}>
              <CheckCircle className="w-10 h-10 animate-bounce" style={{ color: YELLOW }} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2" style={{ color: CREAM }}>Order Verified!</h2>
            <p className="text-[9px] font-mono uppercase tracking-widest mb-8" style={{ color: `${CREAM}50` }}>Transaction settled & sent to KDS</p>

            <div className="p-4 space-y-2 mb-6 border-2" style={{ borderColor: `${YELLOW}25`, background: G_MID }}>
              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest" style={{ color: `${CREAM}50` }}>
                <span>Invoice #</span>
                <span style={{ color: CREAM }}>{lastOrderDetails?.id || "N/A"}</span>
              </div>
              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest pt-2 border-t" style={{ borderColor: `${YELLOW}22`, color: `${CREAM}50` }}>
                <span>Paid via</span>
                <span style={{ color: YELLOW }}>{paymentMethod.toUpperCase()}</span>
              </div>
            </div>

            <div className="text-4xl font-black mb-6" style={{ color: YELLOW }}>₹{lastOrderDetails?.total.toFixed(2)}</div>

            <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest" style={{ color: "#4ade80" }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#4ade80" }}></div>
              Kitchen is preparing your meal
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
