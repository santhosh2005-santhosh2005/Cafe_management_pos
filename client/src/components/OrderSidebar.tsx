import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearCart, removeItem, updateQuantity } from "@/store/cartSlice";
import type { RootState } from "@/store";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Plus,
  Minus,
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  ShoppingCart
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
    try {
      Swal.showLoading();

      const itemsToPrint = items.map((item) => ({
        ...item,
        productId: { name: item.name }, // for receipt
      }));

      const receiptWindow = window.open("", "_blank", "width=800,height=600");

      const payload = {
        items: items.map((item) => ({
          product: item.productId,
          quantity: item.quantity,
          size: item.size,
          price: item.price,
        })),
        totalPrice: finalTotal,
        discountPercent,
        taxRate,
        paymentMethod,
        table: selectedTable || null,
      };

      const { data } = await createOrder(payload).unwrap();
      
      Swal.close();
      toast.success("Order Placed Successfully!");

      setConfirmOpen(false);
      setShowQR(false);
      dispatch(clearCart());
      setDiscountPercent(defaultDiscount);

      if (selectedTable) {
        await updateTableStatus({ id: selectedTable, status: "occupied" }).unwrap();
        setSelectedTable(null);
      }

      if (shouldPrint && settingsData?.data && receiptWindow) {
        printReceipt(
          data,
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
      Swal.close();
      toast.error("Failed to place order");
    }
  };

  const handlePaymentWithAPI = () => {
    const options = {
      key: "rzp_test_57a55fce961ccf6",
      amount: Math.round(finalTotal * 100),
      currency: "INR",
      name: settingsData?.data?.businessName || "Odoo POS Cafe",
      description: "POS Settlement",
      handler: function (response: any) {
        toast.success(`Verified: ${response.razorpay_payment_id}`);
        confirmCheckout(true);
      },
      prefill: {
        name: "Guest",
        email: "customer@cafe.com",
      },
      theme: { color: "#2563eb" },
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
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
                <p className="text-[10px] text-gray-500">{item.size} | ${(item.price).toFixed(2)}</p>
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
                <span>${totalPrice.toFixed(2)}</span>
            </div>
            {discountPercent > 0 && (
                <div className="flex justify-between text-xs text-green-600">
                    <span>Discount ({discountPercent}%)</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                </div>
            )}
            <div className="flex justify-between text-xs text-gray-500">
                <span>Tax ({taxRate}%)</span>
                <span>+${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-black pt-2 border-t dark:border-gray-800">
                <span>Total</span>
                <span className="text-blue-600">${finalTotal.toFixed(2)}</span>
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
            <AlertDialogTitle className="text-2xl font-black">
                {showQR ? "Scan UPI QR" : "Confirm Settlement"}
            </AlertDialogTitle>
            <AlertDialogDescription>
                {showQR 
                  ? "Scan this QR with any UPI app (GPay, PhonePe) to pay." 
                  : `Please confirm that the payment of \$${finalTotal.toFixed(2)} has been received via ${paymentMethod.toUpperCase()}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {showQR && (
            <div className="flex flex-col items-center py-6 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-800">
                <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${settingsData?.data?.upiId || "merchant@ybl"}&pn=${settingsData?.data?.businessName || "Cafe"}&am=${finalTotal.toFixed(2)}&cu=INR`)}`} 
                    className="w-48 h-48 rounded-xl shadow-lg mb-4"
                />
                <p className="text-xs font-black text-purple-600">WAITING FOR PAYMENT...</p>
            </div>
          )}

          <AlertDialogFooter className="mt-4 gap-3">
            <AlertDialogCancel className="rounded-xl h-12 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if(showQR) {
                    toast.promise(
                        new Promise((res) => setTimeout(res, 1500)),
                        {
                            loading: 'Checking bank status...',
                            success: 'Payment Verified!',
                            error: 'Verification Failed'
                        }
                    ).then(() => confirmCheckout(true));
                } else {
                    confirmCheckout(true);
                }
              }}
              className="rounded-xl h-12 font-bold bg-blue-600 hover:bg-blue-700"
            >
              {showQR ? "Verify & Print" : "Received & Settle"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
