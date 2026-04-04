import React, { useState } from "react";
import { Navigate } from "react-router";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileDown, 
  FileSpreadsheet, 
  Filter, 
  Calendar as CalendarIcon,
  Search,
  Users as UsersIcon,
  UtensilsCrossed
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  const products = productData || [];

  const handleExportPDF = () => {
    // Basic export with current defaults
    generatePDF("daily", "", "", "all", { totalOrders: 0, totalSales: 0 }, []);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 p-6 lg:p-10 space-y-10">
      {role === "admin" ? (
        <div className="max-w-[1600px] mx-auto space-y-10">
          
          {/* 1. Header & Actions Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Management Console</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Welcome back, Admin. Here's your restaurant's performance.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={handleExportPDF} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm hover:bg-gray-50 rounded-xl px-5 py-6 h-auto flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200 transition-all active:scale-95">
                <FileDown size={20} className="text-blue-500" />
                Download PDF
              </Button>
              <Button variant="outline" className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm hover:bg-gray-50 rounded-xl px-5 py-6 h-auto flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200 transition-all active:scale-95">
                <FileSpreadsheet size={20} className="text-emerald-500" />
                Export Excel
              </Button>
            </div>
          </div>

          {/* 2. Advanced Filters Section */}
          <Card className="border-none shadow-sm bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="flex items-center gap-3 text-gray-400 shrink-0">
                  <Filter size={20} />
                  <span className="text-sm font-bold uppercase tracking-wider">Quick Filters</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                  <div className="relative group">
                    <CalendarIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="pl-10 h-12 bg-gray-50/50 dark:bg-gray-800/50 border-transparent focus:ring-2 focus:ring-blue-500/20 rounded-xl font-semibold">
                        <SelectValue placeholder="Date Range" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800 shadow-xl">
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="week">Last 7 Days</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative group">
                    <UsersIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                      <SelectTrigger className="pl-10 h-12 bg-gray-50/50 dark:bg-gray-800/50 border-transparent focus:ring-2 focus:ring-purple-500/20 rounded-xl font-semibold">
                        <SelectValue placeholder="Filter by Staff" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800 shadow-xl">
                        <SelectItem value="all">All Staff</SelectItem>
                        {staffs.map((staff: any) => (
                          <SelectItem key={staff._id} value={staff._id}>{staff.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative group">
                    <UtensilsCrossed size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger className="pl-10 h-12 bg-gray-50/50 dark:bg-gray-800/50 border-transparent focus:ring-2 focus:ring-orange-500/20 rounded-xl font-semibold">
                        <SelectValue placeholder="Filter by Product" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800 shadow-xl">
                        <SelectItem value="all">All Products</SelectItem>
                        {products.map((product: any) => (
                          <SelectItem key={product._id} value={product._id}>{product.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Main KPI & Analytics Section */}
          <ModernInsightDashboard />

          {/* 4. Real-time Status Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-6 bg-blue-500 rounded-full" />
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Live Table Occupancy</h3>
              </div>
              <TableRealTimeUpdate />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-6 bg-emerald-500 rounded-full" />
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Daily Order Stream</h3>
              </div>
              <OrderSummary />
            </div>
          </div>

        </div>
      ) : (
        <Navigate to="/dashboard/pos" replace />

      )}
    </div>
  );
}
