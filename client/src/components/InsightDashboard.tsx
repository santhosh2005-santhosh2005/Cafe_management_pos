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
  Clock
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
  Cell
} from "recharts";

const ModernInsightDashboard = () => {
  const [filter, setFilter] = useState("daily");
  const [data, setData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lastSession, setLastSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Dashboard Summary
        const dashboardRes = await axios.get(`${apiUrl}/api/analytics/dashboard?filter=${filter}`, { headers });
        
        // Fetch Item Analytics for Bar Chart
        const itemsRes = await axios.get(`${apiUrl}/api/analytics/items?filter=${filter}`, { headers });

        // Fetch Sales Trend (last 7 days for visual)
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 6);
        const trendRes = await axios.get(`${apiUrl}/api/orders/sales/last-7-days?startDate=${weekAgo.toISOString()}&endDate=${today.toISOString()}`, { headers });

        // Fetch Last Session Info
        const sessionRes = await axios.get(`${apiUrl}/api/sessions/active`, { headers });

        if (dashboardRes.data.success) setData(dashboardRes.data.data);
        if (itemsRes.data.success) setTopProducts(itemsRes.data.data.slice(0, 5));
        if (trendRes.data.success) setChartData(trendRes.data.data);
        if (sessionRes.data.success) setLastSession(sessionRes.data.lastSession);

      } catch (error) {
        console.error("Failed to fetch dashboard insights", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchAllData();
  }, [filter, token]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800"></div>
        ))}
      </div>
    );
  }

  // Provide fallback data if API fails but loading finished
  const safeData = data || { revenue: 0, orders: 0, topItem: null, topWaiter: null };

  const kpis = [
    {
      title: "Total Revenue",
      value: `৳${safeData.revenue.toLocaleString()}`,
      label: "Gross income",
      icon: DollarSign,
      color: "blue",
      trend: "+12.5%",
      isUp: true
    },
    {
      title: "Total Orders",
      value: safeData.orders,
      label: "Completed sales",
      icon: Package,
      color: "orange",
      trend: "+8.2%",
      isUp: true
    },
    {
      title: "Avg Order Value",
      value: `৳${(safeData.revenue / (safeData.orders || 1)).toFixed(0)}`,
      label: "Per transaction",
      icon: TrendingUp,
      color: "green",
      trend: "-2.4%",
      isUp: false
    },
    {
      title: "Top Waiter",
      value: safeData.topWaiter?.name || "N/A",
      label: "Most sales",
      icon: Users,
      color: "purple",
      trend: "Top Performer",
      isUp: true
    },
    {
      title: "Last Session",
      value: lastSession ? `৳${lastSession.totalSales.toLocaleString()}` : "N/A",
      label: lastSession ? `Ended: ${new Date(lastSession.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "No prior session",
      icon: Clock,
      color: "gray",
      trend: lastSession ? "Summary" : "N/A",
      isUp: true
    }
  ];

  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100 dark:border-blue-500/20",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 border-orange-100 dark:border-orange-500/20",
    green: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 border-green-100 dark:border-green-500/20",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 border-purple-100 dark:border-purple-500/20",
    gray: "bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 border-slate-100 dark:border-slate-500/20",
  };

  return (
    <div className="space-y-8">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Dashboard Overview</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time performance metrics for your restaurant.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px] border-none shadow-none focus:ring-0 font-medium">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Today</SelectItem>
              <SelectItem value="weekly">This Week</SelectItem>
              <SelectItem value="monthly">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {kpis.map((kpi, idx) => (
          <Card key={idx} className="relative overflow-hidden border-none shadow-md bg-white dark:bg-gray-800 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-1 group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colors[kpi.color as keyof typeof colors]}`}>
                  <kpi.icon size={22} strokeWidth={2.5} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${kpi.isUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                  {kpi.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {kpi.trend}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{kpi.title}</p>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{kpi.value}</h3>
                <p className="text-xs text-gray-400 font-medium">{kpi.label}</p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 w-full opacity-20 bg-${kpi.color}-500`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Line Chart */}
        <Card className="lg:col-span-2 border-none shadow-md bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between px-6 py-5 border-b border-gray-50 dark:border-gray-700/50">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-500" />
                Sales Trend
              </CardTitle>
              <p className="text-xs text-gray-400 mt-1">Revenue performance over the last 7 days</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs font-semibold text-gray-500 uppercase">Sales</span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 500}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 500}}
                    tickFormatter={(val) => `৳${val/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                    cursor={{stroke: '#3b82f6', strokeWidth: 2}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="totalSales" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorSales)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Bar Chart */}
        <Card className="border-none shadow-md bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
          <CardHeader className="px-6 py-5 border-b border-gray-50 dark:border-gray-700/50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <LayoutGrid size={20} className="text-orange-500" />
              Top Selling Items
            </CardTitle>
            <p className="text-xs text-gray-400 mt-1">Most popular products in {filter} period</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={topProducts} margin={{left: -20}}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    width={100}
                    tick={{fontSize: 12, fill: '#475569', fontWeight: 600}}
                  />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="totalQuantity" radius={[0, 10, 10, 0]} barSize={18}>
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#f97316' : '#fdba74'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">Bestseller:</span>
                <span className="font-bold text-orange-600">{topProducts[0]?.name || "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModernInsightDashboard;
