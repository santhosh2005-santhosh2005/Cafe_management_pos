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
    <div className="min-h-screen bg-warm-white p-6 lg:p-10 space-y-12">
      {role === "admin" ? (
        <div className="max-w-[1600px] mx-auto space-y-12">
          
          {/* 1. Header & Actions Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
            <div className="space-y-4">
              <div>
                <span className="brutalist-label rotated-label mb-2">SYSTEM_CLEARANCE_ADMIN</span>
                <h1 className="text-6xl font-black italic leading-none tracking-tighter uppercase">Management<br/><span className="text-golden-yellow">Console</span></h1>
                <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase mt-4">[ENCRYPTION_SESSION_ACTIVE] ACCESS GRANTED</p>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <button onClick={handleExportPDF} className="brutalist-button h-14 px-6 flex items-center gap-3">
                  <FileDown size={20} />
                  GENERATE_PDF
                </button>
                <button className="brutalist-button h-14 px-6 flex items-center gap-3 bg-white hover:bg-golden-yellow">
                  <FileSpreadsheet size={20} />
                  EXTRACT_EXCEL
                </button>
              </div>
            </div>

            <div className="w-full lg:w-96 shrink-0 border-2 border-deep-black p-1">
              <OrderSummary />
            </div>
          </div>

          {/* 2. Advanced Filters Section */}
          <div className="brutalist-card border-none bg-deep-black text-white p-8">
             <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex items-center gap-3 text-golden-yellow shrink-0 font-mono font-black italic">
                   <Filter size={24} />
                   <span className="text-sm tracking-[0.2em]">FILTER_PROTOCOL</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                   <div className="space-y-1">
                      <label className="font-mono text-[8px] tracking-widest text-gray-500 uppercase">Temporal Range</label>
                      <Select value={dateRange} onValueChange={setDateRange}>
                         <SelectTrigger className="h-12 bg-white text-deep-black border-2 border-deep-black font-black uppercase text-xs">
                            <SelectValue placeholder="DATE_RANGE" />
                         </SelectTrigger>
                         <SelectContent className="border-2 border-deep-black p-0 shadow-none">
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="yesterday">Yesterday</SelectItem>
                            <SelectItem value="week">Last 7 Days</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>

                   <div className="space-y-1">
                      <label className="font-mono text-[8px] tracking-widest text-gray-500 uppercase">Personnel filter</label>
                      <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                         <SelectTrigger className="h-12 bg-white text-deep-black border-2 border-deep-black font-black uppercase text-xs">
                            <SelectValue placeholder="STAFF_ID" />
                         </SelectTrigger>
                         <SelectContent className="border-2 border-deep-black p-0 shadow-none">
                            <SelectItem value="all">All Personnel</SelectItem>
                            {staffs.map((staff: any) => (
                               <SelectItem key={staff._id} value={staff._id}>{staff.name}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                   </div>

                   <div className="space-y-1">
                      <label className="font-mono text-[8px] tracking-widest text-gray-500 uppercase">Product mapping</label>
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                         <SelectTrigger className="h-12 bg-white text-deep-black border-2 border-deep-black font-black uppercase text-xs">
                            <SelectValue placeholder="ASSET_TYPE" />
                         </SelectTrigger>
                         <SelectContent className="border-2 border-deep-black p-0 shadow-none">
                            <SelectItem value="all">All Assets</SelectItem>
                            {products.map((product: any) => (
                               <SelectItem key={product._id} value={product._id}>{product.name}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                   </div>
                </div>
             </div>
          </div>

          <ModernInsightDashboard />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-golden-yellow flex items-center justify-center font-mono font-black text-xs text-deep-black">01</div>
                <h3 className="text-3xl font-black italic tracking-tighter uppercase">Live Occupancy</h3>
              </div>
              <div className="border-4 border-deep-black bg-white">
                <TableRealTimeUpdate />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-golden-yellow flex items-center justify-center font-mono font-black text-xs text-deep-black">02</div>
                <h3 className="text-3xl font-black italic tracking-tighter uppercase">Order Stream</h3>
              </div>
              <div className="border-4 border-deep-black bg-white">
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
