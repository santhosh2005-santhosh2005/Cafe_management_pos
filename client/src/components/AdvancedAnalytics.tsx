import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  LayoutGrid, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Download,
  Filter,
  BarChart3,
  Calendar,
  Zap,
  Coffee
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from "recharts";
import { generatePDF } from "./GeneratePdf";
import Swal from "sweetalert2";

const AdvancedInsightDashboard = () => {
  const [filter, setFilter] = useState("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [overview, setOverview] = useState<any>(null);
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [staffData, setStaffData] = useState<any[]>([]);
  const [itemData, setItemData] = useState<any[]>([]);
  const [timeData, setTimeData] = useState<any[]>([]);
  const [timeBasedItems, setTimeBasedItems] = useState<any[]>([]);
  const [cashierData, setCashierData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const { token } = useSelector((state: RootState) => state.user);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const headers = { Authorization: `Bearer ${token}` };
      const query = `?filter=${filter}${startDate ? `&startDate=${startDate}` : ""}${endDate ? `&endDate=${endDate}` : ""}`;

      const [
        overviewRes,
        trendsRes,
        staffRes,
        itemsRes,
        timeRes,
        timeItemsRes,
        cashierRes
      ] = await Promise.all([
        axios.get(`${apiUrl}/api/analytics/overview${query}`, { headers }),
        axios.get(`${apiUrl}/api/analytics/sales-trends${query}`, { headers }),
        axios.get(`${apiUrl}/api/analytics/staff${query}`, { headers }),
        axios.get(`${apiUrl}/api/analytics/items${query}`, { headers }),
        axios.get(`${apiUrl}/api/analytics/time${query}`, { headers }),
        axios.get(`${apiUrl}/api/analytics/time-based-items${query}`, { headers }),
        axios.get(`${apiUrl}/api/analytics/cashiers${query}`, { headers })
      ]);

      if (overviewRes.data.success) setOverview(overviewRes.data.data);
      if (trendsRes.data.success) setSalesTrends(trendsRes.data.data);
      if (staffRes.data.success) setStaffData(staffRes.data.data);
      if (itemsRes.data.success) setItemData(itemsRes.data.data);
      if (timeRes.data.success) setTimeData(timeRes.data.data);
      if (timeItemsRes.data.success) setTimeBasedItems(timeItemsRes.data.data);
      if (cashierRes.data.success) setCashierData(cashierRes.data.data);

    } catch (error) {
      console.error("Failed to fetch advanced insights", error);
      Swal.fire("Error", "Failed to load analytics data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAnalytics();
  }, [filter, startDate, endDate, token]);

  const handleExportPDF = () => {
    if (!overview) return;
    generatePDF(
      filter,
      startDate,
      endDate,
      "all",
      { totalOrders: overview.totalOrders, totalSales: overview.totalRevenue },
      [] // In a real app, you'd fetch the orders list for the PDF
    );
  };

  const handleExportCSV = () => {
    // Basic CSV export logic
    const headers = ["Metric", "Value"];
    const rows = [
      ["Total Revenue", overview?.totalRevenue],
      ["Total Orders", overview?.totalOrders],
      ["Avg Order Value", overview?.avgOrderValue],
    ];
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_${filter}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  if (loading && !overview) {
    return (
      <div className="space-y-8 animate-pulse p-8">
        <div className="h-20 bg-gray-200 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>)}
        </div>
        <div className="h-96 bg-gray-50 rounded-2xl"></div>
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Revenue",
      value: `INR ${overview?.totalRevenue?.toLocaleString("en-IN") || 0}`,
      icon: DollarSign,
      color: "bg-blue-500",
      textColor: "text-blue-600"
    },
    {
      title: "Total Orders",
      value: overview?.totalOrders || 0,
      icon: Package,
      color: "bg-orange-500",
      textColor: "text-orange-600"
    },
    {
      title: "Avg Order Value",
      value: `INR ${Math.round(overview?.avgOrderValue || 0).toLocaleString("en-IN")}`,
      icon: TrendingUp,
      color: "bg-green-500",
      textColor: "text-green-600"
    }
  ];

  const topPerformer = staffData.length > 0 ? staffData.reduce((prev, current) => (prev.orderCount > current.orderCount) ? prev : current) : null;

  return (
    <div className="space-y-10 pb-20">
      {/* 1. Header & Global Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white p-8 border-4 border-deep-black shadow-[8px_8px_0px_0px_#000]">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-3 h-10 bg-golden-yellow"></div>
             <h2 className="text-5xl font-black tracking-tighter uppercase italic">Advanced Insights</h2>
          </div>
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest pl-6">Infrastructure performance & asset utilization report</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 p-2 border-2 border-deep-black">
            <Calendar size={18} className="text-gray-500" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[160px] border-none bg-transparent font-black uppercase text-xs">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent className="border-2 border-deep-black rounded-none">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filter === "custom" && (
            <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border-2 border-deep-black p-2 font-mono text-xs" />
              <span className="font-black">→</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border-2 border-deep-black p-2 font-mono text-xs" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <button onClick={handleExportPDF} className="p-3 bg-deep-black text-white hover:bg-golden-yellow hover:text-deep-black transition-all border-2 border-deep-black shadow-[4px_4px_0px_0px_#F5B400] active:shadow-none active:translate-x-1 active:translate-y-1">
              <Download size={20} />
            </button>
            <button onClick={handleExportCSV} className="p-3 bg-white text-deep-black hover:bg-golden-yellow transition-all border-2 border-deep-black shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1">
              <BarChart3 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white border-4 border-deep-black p-8 shadow-[8px_8px_0px_0px_#000] group hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 ${kpi.color} text-white border-2 border-deep-black shadow-[4px_4px_0px_0px_#000]`}>
                <kpi.icon size={28} />
              </div>
              <span className="font-mono text-[10px] font-black text-gray-400">METRIC_ID: 0{i+1}</span>
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-gray-500 mb-1">{kpi.title}</p>
            <h3 className="text-4xl font-black tracking-tighter text-deep-black">{kpi.value}</h3>
          </div>
        ))}
      </div>

      {/* 3. Sales Trends Chart */}
      <div className="bg-white border-4 border-deep-black p-8 shadow-[12px_12px_0px_0px_#F5B400]">
        <div className="flex items-center justify-between mb-10 border-b-4 border-deep-black pb-6">
          <h3 className="text-3xl font-black italic uppercase tracking-tight">Revenue Stream Analysis</h3>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 border border-deep-black"></div>
            <span className="font-mono text-[10px] font-black uppercase">Total_Sales_INR</span>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesTrends}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="date" axisLine={{strokeWidth: 2}} tickLine={false} tick={{fontFamily: 'monospace', fontSize: 10, fontWeight: 700}} />
              <YAxis axisLine={{strokeWidth: 2}} tickLine={false} tick={{fontFamily: 'monospace', fontSize: 10, fontWeight: 700}} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip contentStyle={{border: '4px solid #000', borderRadius: '0px', fontFamily: 'monospace', fontWeight: 'bold'}} />
              <Area type="stepAfter" dataKey="totalRevenue" stroke="#000" strokeWidth={4} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Staff & Cashier Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border-4 border-deep-black p-8 shadow-[8px_8px_0px_0px_#000]">
           <div className="flex items-center gap-3 mb-8">
              <Users size={24} />
              <h3 className="text-2xl font-black uppercase italic">Personnel Efficiency</h3>
           </div>
           
           {topPerformer && (
             <div className="mb-8 p-6 bg-golden-yellow border-2 border-deep-black flex items-center gap-6">
                <div className="p-3 bg-white border-2 border-deep-black">
                   <Zap size={24} className="text-deep-black" />
                </div>
                <div>
                   <p className="font-mono text-[10px] font-black uppercase text-deep-black/60">Top Performer Identified</p>
                   <h4 className="text-xl font-black uppercase">{topPerformer.name} — {topPerformer.orderCount} Orders</h4>
                </div>
             </div>
           )}

           <div className="space-y-6">
              {staffData.map((staff, i) => (
                <div key={i} className="flex items-center justify-between border-b-2 border-gray-100 pb-4 last:border-0">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-deep-black text-white flex items-center justify-center font-black text-sm">{staff.name[0].toUpperCase()}</div>
                      <div>
                         <p className="font-black uppercase text-sm">{staff.name}</p>
                         <p className="font-mono text-[10px] text-gray-400">{staff.tableCount} Tables Served</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="font-black text-lg">INR {staff.totalSales.toLocaleString()}</p>
                      <p className="font-mono text-[10px] text-golden-yellow font-black uppercase">{staff.orderCount} OPS</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-deep-black text-white border-4 border-deep-black p-8 shadow-[8px_8px_0px_0px_#F5B400]">
           <div className="flex items-center gap-3 mb-8">
              <DollarSign size={24} className="text-golden-yellow" />
              <h3 className="text-2xl font-black uppercase italic text-golden-yellow">Cashier Revenue Aggregation</h3>
           </div>
           
           <div className="space-y-6">
              {cashierData.map((cashier, i) => (
                <div key={i} className="flex items-center justify-between border-b-2 border-white/10 pb-4 last:border-0">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-golden-yellow text-deep-black flex items-center justify-center font-black text-sm">{cashier.name[0].toUpperCase()}</div>
                      <div>
                         <p className="font-black uppercase text-sm">{cashier.name}</p>
                         <p className="font-mono text-[10px] text-gray-500">{cashier.totalSessions} Active Sessions</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="font-black text-lg text-golden-yellow">INR {cashier.totalSales.toLocaleString()}</p>
                      <p className="font-mono text-[10px] text-gray-500 uppercase">Avg: ₹{Math.round(cashier.averageSalesPerSession).toLocaleString()}</p>
                   </div>
                </div>
              ))}
              {cashierData.length === 0 && <p className="font-mono text-xs text-gray-500 italic">NO_ACTIVE_SESSIONS_FOUND</p>}
           </div>
        </div>
      </div>

      {/* 5. Item Performance & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border-4 border-deep-black p-8 shadow-[8px_8px_0px_0px_#000]">
           <div className="flex items-center justify-between mb-10 border-b-4 border-deep-black pb-6">
              <div className="flex items-center gap-3">
                 <Package size={24} />
                 <h3 className="text-2xl font-black uppercase italic">Item Utilization Matrix</h3>
              </div>
              <div className="flex gap-4">
                 <div className="flex items-center gap-1 font-mono text-[10px] font-black uppercase"><div className="w-2 h-2 bg-deep-black"></div> Most Sold</div>
                 <div className="flex items-center gap-1 font-mono text-[10px] font-black uppercase"><div className="w-2 h-2 bg-golden-yellow"></div> Least Sold</div>
              </div>
           </div>
           
           <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={itemData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 700}} interval={0} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{fontSize: 10, fontWeight: 700}} />
                  <Tooltip cursor={{fill: 'rgba(245, 180, 0, 0.1)'}} contentStyle={{border: '4px solid #000', borderRadius: '0px'}} />
                  <Bar dataKey="totalQuantity" fill="#000">
                    {itemData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index < 3 ? '#000' : (index > itemData.length - 4 ? '#F5B400' : '#888')} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white border-4 border-deep-black p-8 shadow-[8px_8px_0px_0px_#F5B400]">
           <div className="flex items-center gap-3 mb-8 border-b-2 border-gray-100 pb-4">
              <Clock size={24} />
              <h3 className="text-xl font-black uppercase italic">Temporal Demand</h3>
           </div>
           
           <div className="space-y-4">
              {timeBasedItems.map((time, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-2 border-deep-black hover:bg-gray-50 transition-colors">
                   <div className="w-12 h-12 flex flex-col items-center justify-center bg-deep-black text-white shrink-0">
                      <span className="text-lg font-black leading-none">{time.hour}</span>
                      <span className="text-[8px] font-mono font-black uppercase">HRS</span>
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <p className="font-mono text-[10px] font-black text-gray-400 uppercase">Demand Spike Identified</p>
                      <h4 className="font-black uppercase truncate text-sm">{time.itemName}</h4>
                      <div className="flex items-center justify-between mt-1">
                         <div className="h-1 bg-gray-100 flex-1 mr-4">
                            <div className="h-full bg-golden-yellow" style={{width: `${(time.count / Math.max(...timeBasedItems.map(t => t.count))) * 100}%`}}></div>
                         </div>
                         <span className="font-mono text-[10px] font-black">{time.count} U</span>
                      </div>
                   </div>
                </div>
              ))}
              {timeBasedItems.length === 0 && <p className="font-mono text-xs text-gray-500 italic">CALCULATING_TEMPORAL_PEAKS...</p>}
           </div>
        </div>
      </div>

    </div>
  );
};

export default AdvancedInsightDashboard;
