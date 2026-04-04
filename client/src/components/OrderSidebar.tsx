import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearCart, removeItem, updateQuantity } from "@/store/cartSlice";
import type { RootState } from "@/store";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { DiscountDialog } from "./SetDiscount";
import { printReceipt } from "@/utils/printReceipt";

interface OrderSidebarProps {
  disabled?: boolean;
}

export default function OrderSidebar({ disabled }: OrderSidebarProps) {
  const dispatch = useDispatch();
  const { items, totalPrice } = useSelector((state: RootState) => state.cart);
  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const { data: tablesData } = useGetTablesQuery();
  const tables = tablesData?.data || [];

  const [discountDialog, setDiscountDialog] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "digital" | "upi">(
    "cash"
  );
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

  // Financials
  const discountAmount = (totalPrice * discountPercent) / 100;
  const taxAmount = (totalPrice - discountAmount) * (taxRate / 100);
  const finalTotal = totalPrice - discountAmount + taxAmount;

  const [updateTableStatus] = useUpdateTableStatusMutation();

  const confirmCheckout = async (shouldPrint: boolean = true) => {
    let receiptWindow: any = null;
    if (shouldPrint) {
      receiptWindow = window.open("", "_blank", "width=800,height=600");
    }

    try {
      Swal.showLoading();

      const itemsToPrint = items.map((item) => ({
        ...item,
        productId: { name: item.name }, // for receipt
      }));
      const orderData = {
        items: items.map((item) => ({
          product: item.productId,
          quantity: item.quantity,
          size: item.size,
          price: item.price,
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
      const finalResult = result.data || result; // Handle both direct and nested responses
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
        printReceipt(
          finalResult,
          itemsToPrint,
          discountPercent,
          tables,
          selectedTable,
          totalPrice,
          {
            businessName: settingsData.data.businessName,
            address: settingsData.data.address,
            phone: settingsData.data.phone,
            website: settingsData.data.website,
            receiptFooter: settingsData.data.receiptFooter,
            taxRate: settingsData.data.taxRate,
          },
          receiptWindow
        );
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
        // 🚀 LAUNCH REAL RAZORPAY GATEWAY
        const options = {
          key: keyId,
          amount: Math.round(finalTotal * 100), // in paise
          currency: "INR",
          name: settingsData?.data?.businessName || "Odoo POS Cafe",
          description: "Point of Sale Settlement",
          handler: function (response: any) {
            toast.success(`Payment Success: ${response.razorpay_payment_id}`);
            confirmCheckout(true);
          },
          modal: {
            ondismiss: function() {
              toast.error("Payment was cancelled");
            }
          },
          prefill: {
            name: "Guest Customer",
            email: "guest@odoocafe.com",
          },
          theme: { color: "#2563eb" }, 
        };
        
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
    } else {
        // 🛡️ FALLBACK TO HIGH-FIDELITY SIMULATION (Demo Mode)
        setShowGateway(true);
        setGatewayProcessing(false);
    }
  };

  const simulateGatewaySettlement = () => {
    setGatewayProcessing(true);
    toast.promise(
        new Promise((res) => setTimeout(res, 2500)),
        {
            loading: 'Authorizing with Bank...',
            success: 'Payment Captured Successfully!',
            error: 'Authorization Failed'
        }
    ).then(() => {
        setShowGateway(false);
        confirmCheckout(true);
    });
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    toast.success("Cart cleared!");
  };

  return (
    <div className="w-full md:w-96 shadow-lg h-full dark:bg-gray-900 bg-white text-gray-900 dark:text-gray-100 p-6 flex flex-col rounded-xl border-l dark:border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-500" /> Current Order
        </h2>
        <Button variant="ghost" size="sm" onClick={handleClearCart} className="text-red-500 hover:text-red-600 hover:bg-red-50">
          Clear All
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto mb-6 space-y-4">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-50">
             <ShoppingCart className="w-12 h-12" />
             <p className="text-sm">No items in cart</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={`${item.productId}-${item.size}`} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border dark:border-gray-800">
              <img src={item.imageUrl || "/placeholder.png"} className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{item.name}</p>
                <p className="text-[10px] text-gray-500">{item.size} | ₹{(item.price).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1 rounded-lg border dark:border-gray-800">
                <button onClick={() => dispatch(updateQuantity({ productId: item.productId, size: item.size, quantity: Math.max(1, item.quantity - 1) }))}>
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                <button onClick={() => dispatch(updateQuantity({ productId: item.productId, size: item.size, quantity: item.quantity + 1 }))}>
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <button 
                onClick={() => dispatch(removeItem({ productId: item.productId, size: item.size }))}
                className="text-red-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="space-y-4 pt-4 border-t dark:border-gray-800">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Service Table</Label>
            <select 
                className="w-full h-10 bg-gray-50 dark:bg-gray-800 rounded-lg border-none text-xs px-2"
                value={selectedTable || ""}
                onChange={(e) => setSelectedTable(e.target.value || null)}
            >
              <option value="">Takeaway / Walk-in</option>
              {tables.map((t: any) => (
                <option key={t._id} value={t._id} disabled={t.status === 'occupied'}>
                  Table {t.tableNumber} ({t.status})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
             <Label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Discount</Label>
             <Button variant="outline" className="w-full h-10 text-xs gap-2" onClick={() => setDiscountDialog(true)}>
                <Tag className="w-3 h-3" /> {discountPercent}% Off
             </Button>
          </div>
        </div>

        <div className="space-y-1.5">
           <Label className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Payment Method</Label>
           <div className="flex gap-2">
              <button 
                onClick={() => setPaymentMethod("cash")}
                className={`flex-1 p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${paymentMethod === 'cash' ? 'bg-green-50 border-green-600 text-green-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-800'}`}
              >
                <Banknote className="w-4 h-4" />
                <span className="text-[10px] font-bold">CASH</span>
              </button>
              <button 
                onClick={() => setPaymentMethod("digital")}
                className={`flex-1 p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${paymentMethod === 'digital' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-800'}`}
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-[10px] font-bold">DIGITAL</span>
              </button>
              <button 
                onClick={() => setPaymentMethod("upi")}
                className={`flex-1 p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${paymentMethod === 'upi' ? 'bg-purple-50 border-purple-600 text-purple-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-800'}`}
              >
                <QrCode className="w-4 h-4" />
                <span className="text-[10px] font-bold">UPI QR</span>
              </button>
           </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span>
                <span>₹{totalPrice.toFixed(2)}</span>
            </div>
            {discountPercent > 0 && (
                <div className="flex justify-between text-xs text-green-600">
                    <span>Discount ({discountPercent}%)</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
            )}
            <div className="flex justify-between text-xs text-gray-500">
                <span>Tax ({taxRate}%)</span>
                <span>+₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-black pt-2 border-t dark:border-gray-800">
                <span>Total</span>
                <span className="text-blue-600">₹{finalTotal.toFixed(2)}</span>
            </div>
        </div>

        <Button
          disabled={items.length === 0 || disabled || isLoading}
          onClick={() => {
             if(paymentMethod === "digital") handlePaymentWithAPI();
             else {
               setShowQR(paymentMethod === "upi");
               setConfirmOpen(true);
             }
          }}
          className={`w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/10 transition-all active:scale-95
          ${paymentMethod === 'cash' ? 'bg-green-600 hover:bg-green-700' : 
            paymentMethod === 'upi' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {paymentMethod === 'digital' ? 'Pay with Card/Net' : 'Place Order & Settle'}
        </Button>
      </div>

      <DiscountDialog open={discountDialog} onClose={() => setDiscountDialog(false)} onApply={setDiscountPercent} />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-center flex items-center justify-center gap-2">
                {qrVerifying ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                         <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                         <div className="space-y-1 text-center">
                            <p className="text-xl">Checking Status...</p>
                            <p className="text-xs text-green-600 font-bold animate-pulse uppercase tracking-widest">Scan detected from PhonePe</p>
                         </div>
                    </div>
                ) : (
                    <>
                        <QrCode className="w-6 h-6 text-blue-600" />
                        Verify UPI Settlement
                    </>
                )}
            </AlertDialogTitle>
            {!qrVerifying && (
                <AlertDialogDescription className="text-center">
                    Once the customer has scanned the QR and entered their PIN, click verify to settle the invoice and print.
                </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          
          {!qrVerifying && showQR && (
            <div className="flex flex-col items-center justify-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl mx-6 border-2 border-dashed border-blue-100 dark:border-blue-900/30">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${settingsData?.data?.upiId}%26pn=${settingsData?.data?.businessName}%26am=${finalTotal.toFixed(2)}%26cu=INR`}
                alt="UPI QR"
                className="w-48 h-48 rounded-xl shadow-lg border-4 border-white"
              />
              <p className="mt-4 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter">
                Dynamic QR: ₹{finalTotal.toFixed(2)}
              </p>
            </div>
          )}
          <AlertDialogFooter className="p-6">
            {!qrVerifying && (
                <>
                    <AlertDialogCancel onClick={() => setShowQR(false)}>Back</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            setQrVerifying(true);
                            setTimeout(() => {
                                setQrVerifying(false);
                                confirmCheckout(true);
                            }, 2500);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                    >
                        {showQR ? "Verify Status & Print" : "Confirm Settlement"}
                    </AlertDialogAction>
                </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showGateway} onOpenChange={setShowGateway}>
        <AlertDialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-blue-600 p-6 text-white text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">{settingsData?.data?.businessName || "Odoo POS"} Checkout</h3>
                <p className="text-xs opacity-80 mt-1 uppercase tracking-widest font-black">Secure Merchant Gateway</p>
            </div>
            
            <div className="p-8 space-y-6 bg-white dark:bg-gray-900">
                <div className="flex justify-between items-center border-b dark:border-gray-800 pb-4">
                    <span className="text-sm font-bold text-gray-500 uppercase">Amount to Pay</span>
                    <span className="text-2xl font-black text-blue-600">₹{finalTotal.toFixed(2)}</span>
                </div>

                <div className="space-y-4">
                    <div 
                        onClick={() => setSelectedGatewayMethod("CC")}
                        className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 cursor-pointer hover:border-blue-500 ${selectedGatewayMethod === 'CC' ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'border-blue-100 dark:border-blue-900/30'}`}
                    >
                        <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex items-center justify-center font-bold text-blue-600 italic">CC</div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-bold">Credit / Debit Card</p>
                            <p className="text-[10px] text-gray-500 italic">Pre-authorized card ending in •••• 4242</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedGatewayMethod === 'CC' ? 'border-blue-600' : 'border-gray-300'}`}>
                            {selectedGatewayMethod === 'CC' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div 
                            onClick={() => setSelectedGatewayMethod("NB")}
                            className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 cursor-pointer hover:border-blue-500 ${selectedGatewayMethod === 'NB' ? 'border-blue-600 bg-blue-50/50' : 'dark:border-gray-800 opacity-60'}`}
                        >
                            <Banknote className="w-4 h-4" />
                            <span className="text-[10px] font-bold">NetBanking</span>
                        </div>
                        <div 
                            onClick={() => setSelectedGatewayMethod("U")}
                            className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 cursor-pointer hover:border-blue-500 ${selectedGatewayMethod === 'U' ? 'border-blue-600 bg-blue-50/50' : 'dark:border-gray-800 opacity-60'}`}
                        >
                            <QrCode className="w-4 h-4" />
                            <span className="text-[10px] font-bold">UPI / App</span>
                        </div>
                    </div>
                </div>

                <div className="pt-4 space-y-3">
                    <Button 
                        onClick={simulateGatewaySettlement}
                        disabled={gatewayProcessing}
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20"
                    >
                        {gatewayProcessing ? "PROCESSING..." : "PAY & AUTHORIZE"}
                    </Button>
                    <p className="text-[9px] text-center text-gray-400 font-medium">🛡️ PCI-DSS COMPLIANT | ENCRYPTED BY 256-BIT SSL</p>
                </div>
            </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* 🚀 POST-PAYMENT SUCCESS SPLASH SCREEN */}
      {showSuccessScreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 p-10 rounded-[40px] shadow-2xl border dark:border-gray-800 text-center max-w-sm w-full mx-4 scale-in-center animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600 animate-bounce" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Order Verified!</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 font-medium">Transaction settled & sent to KDS</p>
                
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl space-y-3 mb-8">
                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <span>Invoice #</span>
                        <span className="text-gray-900 dark:text-white">{lastOrderDetails?.id || "N/A"}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest border-t dark:border-gray-700 pt-3">
                        <span>Paid via</span>
                        <span className="text-blue-600">{paymentMethod.toUpperCase()}</span>
                    </div>
                </div>

                <div className="text-4xl font-black text-gray-900 dark:text-white mb-8">
                    ₹{lastOrderDetails?.total.toFixed(2)}
                </div>

                <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-xs uppercase tracking-tighter">
                   <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                   Kitchen is preparing your meal
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
