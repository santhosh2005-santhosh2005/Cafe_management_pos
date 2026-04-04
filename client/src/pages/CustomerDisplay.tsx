import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, CheckCircle2 } from "lucide-react";
import { io } from "socket.io-client";

// Setup socket connection
const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5001");

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  imageUrl?: string;
}

interface CustomerDisplayState {
  cart: CartItem[];
  totalPrice: number;
  paymentStatus: "unpaid" | "paid";
}

export default function CustomerDisplay() {
  const [displayState, setDisplayState] = useState<CustomerDisplayState>({
    cart: [],
    totalPrice: 0,
    paymentStatus: "unpaid",
  });

  useEffect(() => {
    socket.on("customerDisplayUpdate", (data: CustomerDisplayState) => {
      setDisplayState(data);
    });

    return () => {
      socket.off("customerDisplayUpdate");
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 flex gap-8">
      {/* Left side: branding / promotional */}
      <div className="flex-1 bg-blue-600 rounded-[40px] text-white p-12 flex flex-col justify-between shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-20 opacity-10">
            <ShoppingCart size={400} />
         </div>
         <div>
            <h1 className="text-6xl font-black mb-4">Odoo POS Cafe</h1>
            <p className="text-2xl font-medium opacity-80">Please review your order on the screen.</p>
         </div>
         <div className="space-y-4">
             <h3 className="text-3xl font-black">Scan to Pay via UPI</h3>
             <div className="bg-white p-4 w-48 h-48 rounded-3xl flex items-center justify-center shadow-xl">
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=merchant@upi&pn=Odoo%20Cafe&am=${displayState.totalPrice}`} className="w-full h-full" alt="UPI QR" />
             </div>
         </div>
      </div>

      {/* Right side: Real-time Cart */}
      <div className="w-[500px] flex flex-col gap-6">
        <Card className="rounded-[40px] border-none shadow-xl dark:bg-gray-800 flex-1 flex flex-col overflow-hidden">
          <CardHeader className="bg-white dark:bg-gray-800 p-8 pb-4 border-b dark:border-gray-700">
            <CardTitle className="text-3xl font-black flex items-center gap-4">
              Order Summary
              {displayState.paymentStatus === "paid" && (
                 <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1 font-bold">
                    <CheckCircle2 size={16} /> PAID
                 </span>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-8 flex-1 overflow-y-auto space-y-6">
             {displayState.cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <ShoppingCart size={64} className="mb-4 opacity-20" />
                    <p className="text-xl font-bold">Waiting for items...</p>
                </div>
             ) : (
                displayState.cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center font-black text-blue-600 shadow-sm">
                           x{item.quantity}
                        </div>
                        <div>
                           <h4 className="font-black text-lg">{item.name}</h4>
                           <p className="text-xs text-gray-500 uppercase font-bold">{item.size || "Regular"}</p>
                        </div>
                    </div>
                    <p className="font-black text-xl">INR {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))
             )}
          </CardContent>

          <div className="bg-blue-50 dark:bg-blue-900/10 p-8 border-t-2 border-dashed border-blue-200 dark:border-blue-900/50">
              <div className="flex justify-between items-center">
                  <p className="text-xl font-black text-gray-500 uppercase tracking-widest">Total Amount</p>
                  <p className="text-5xl font-black text-blue-600">INR {displayState.totalPrice.toFixed(2)}</p>
              </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
