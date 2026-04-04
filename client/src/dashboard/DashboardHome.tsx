import { useState } from "react";
import { Navigate } from "react-router";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { 
  FileDown, 
  FileSpreadsheet, 
  Filter
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  useGetAllStaffQuery 
} from "@/services/staffService";
import { 
  useGetProductsQuery 
} from "@/services/productApi";
import OrderSummary from "@/components/RealTimeOrderStatus";
import TableRealTimeUpdate from "@/components/TableStats";
import ModernInsightDashboard from "@/components/InsightDashboard";
import { generatePDF } from "@/components/GeneratePdf";

export default function DashboardHome() {
  const { role } = useSelector((state: RootState) => state.user);
  const [dateRange, setDateRange] = useState("today");
  const [selectedStaff, setSelectedStaff] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");

  const { data: staffData } = useGetAllStaffQuery(undefined);
  const { data: productData } = useGetProductsQuery();

  const staffs = staffData?.staffs || [];
  const products = productData?.data || [];

  const handleExportPDF = () => {
    generatePDF("daily", "", "", "all", { totalOrders: 0, totalSales: 0 }, []);
  };

  return (
    <div className="bg-warm-white space-y-16 animate-in fade-in duration-1000">
      {role === "admin" ? (
        <div className="max-w-full mx-auto space-y-20">
          
          {/* 1. Hero / Header Section */}
          <div className="flex flex-col xl:flex-row justify-between items-start gap-12 border-b-8 border-deep-black pb-16">
            <div className="max-w-4xl space-y-8">
              <div className="heading-split">
                <span className="font-mono text-[10px] tracking-[0.4em] text-golden-yellow font-black uppercase mb-4 block underline underline-offset-8">Terminal_Authorized / 01</span>
                <h1 className="text-[10rem] font-sans font-black leading-[0.75] tracking-tighter text-deep-black uppercase m-0">
                  SYSTEM<br />
                  <span className="text-golden-yellow">DASHBOARD.</span>
                </h1>
                <div className="mt-10 max-w-xl font-mono text-xs uppercase tracking-widest text-deep-black/60 leading-relaxed italic border-l-4 border-golden-yellow pl-8">
                  Critical infrastructure monitoring system active. Overseeing floor metrics, personnel allocation, and transaction streams in real-time.
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 pt-6">
                <button onClick={handleExportPDF} className="brutalist-button h-16 px-10 flex items-center justify-center gap-4 text-lg">
                  <FileDown size={24} />
                  EXECUTE_EXPORT_PDF
                </button>
                <button className="brutalist-button h-16 px-10 flex items-center justify-center gap-4 bg-white hover:bg-golden-yellow text-lg">
                  <FileSpreadsheet size={24} />
                  SYNC_EXCEL_ASSETS
                </button>
              </div>
            </div>

            <div className="w-full xl:w-[450px] shrink-0 border-4 border-deep-black bg-white shadow-[16px_16px_0px_0px_#F5B400] relative">
               <div className="absolute top-0 left-0 bg-deep-black text-warm-white font-mono text-[8px] px-2 py-1 uppercase font-black z-20 font-bold">Real_Time_Status</div>
               <OrderSummary />
            </div>
          </div>

          {/* 2. Control Protocol Filters */}
          <div className="brutalist-panel-dark border-r-8 border-b-8 border-golden-yellow shadow-none relative">
             <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="flex flex-col items-center justify-center border-r-2 border-warm-white/10 pr-12 text-golden-yellow shrink-0 font-mono font-black animate-pulse">
                   <Filter size={40} className="mb-2" />
                   <span className="text-[10px] tracking-[0.3em] uppercase">SYNC_FILTER</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full">
                   <div className="space-y-3">
                      <label className="font-mono text-[10px] tracking-widest text-warm-white/40 uppercase font-black">TEMPORAL_RANGE</label>
                      <Select value={dateRange} onValueChange={setDateRange}>
                         <SelectTrigger className="h-14 bg-warm-white text-deep-black rounded-none border-2 border-golden-yellow font-black uppercase text-xs focus:ring-0">
                            <SelectValue placeholder="AUTO_RANGE" />
                         </SelectTrigger>
                         <SelectContent className="rounded-none border-2 border-deep-black bg-white p-0 shadow-none">
                            <SelectItem value="today" className="font-black hover:bg-golden-yellow transition-colors cursor-pointer">TODAY</SelectItem>
                            <SelectItem value="yesterday">YESTERDAY</SelectItem>
                            <SelectItem value="week">LAST 7 DAYS</SelectItem>
                            <SelectItem value="month">THIS MONTH</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>

                   <div className="space-y-3">
                      <label className="font-mono text-[10px] tracking-widest text-warm-white/40 uppercase font-black">PERSONNEL_ID</label>
                      <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                         <SelectTrigger className="h-14 bg-warm-white text-deep-black rounded-none border-2 border-golden-yellow font-black uppercase text-xs focus:ring-0">
                            <SelectValue placeholder="STAFF_ID" />
                         </SelectTrigger>
                         <SelectContent className="rounded-none border-2 border-deep-black bg-white p-0 shadow-none">
                            <SelectItem value="all">ALL PERSONNEL</SelectItem>
                            {staffs.map((staff: any) => (
                               <SelectItem key={staff._id} value={staff._id}>{staff.name.toUpperCase()}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                   </div>

                   <div className="space-y-3">
                      <label className="font-mono text-[10px] tracking-widest text-warm-white/40 uppercase font-black">PRODUCT_MAPPING</label>
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                         <SelectTrigger className="h-14 bg-warm-white text-deep-black rounded-none border-2 border-golden-yellow font-black uppercase text-xs focus:ring-0">
                            <SelectValue placeholder="ASSET_TYPE" />
                         </SelectTrigger>
                         <SelectContent className="rounded-none border-2 border-deep-black bg-white p-0 shadow-none">
                            <SelectItem value="all">ALL ASSETS</SelectItem>
                            {products.map((product: any) => (
                               <SelectItem key={product._id} value={product._id}>{product.name.toUpperCase()}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                   </div>
                </div>
             </div>
          </div>

          {/* 3. Metrics visualization (using 20% black overlay rule for background depth) */}
          <div className="relative p-10 black-overlay-20 border-2 border-deep-black border-dashed">
            <ModernInsightDashboard />
          </div>

          {/* 4. Infrastructure Mapping */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="space-y-10 group">
              <div className="flex items-end gap-6 border-b-2 border-deep-black/10 pb-6 group-hover:border-golden-yellow transition-colors">
                <div className="w-12 h-12 bg-deep-black flex items-center justify-center font-mono font-black text-xl text-golden-yellow">01</div>
                <h3 className="text-5xl font-black tracking-tighter uppercase text-deep-black">LIVE_OCCUPANCY</h3>
              </div>
              <div className="border-4 border-deep-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all overflow-hidden bg-white/80 backdrop-blur-md">
                <TableRealTimeUpdate />
              </div>
            </div>

            <div className="space-y-10 group">
              <div className="flex items-end gap-6 border-b-2 border-deep-black/10 pb-6 group-hover:border-golden-yellow transition-colors">
                <div className="w-12 h-12 bg-deep-black flex items-center justify-center font-mono font-black text-xl text-golden-yellow">02</div>
                <h3 className="text-5xl font-black tracking-tighter uppercase text-deep-black">ORDER_FLOW</h3>
              </div>
              <div className="border-4 border-deep-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all overflow-hidden bg-white/80 backdrop-blur-md">
                <OrderSummary />
              </div>
            </div>
          </div>

        </div>
      ) : (
        <Navigate to="/dashboard/pos" replace />
      )}
    </div>
  );
}
