import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import {
  TrendingUp, Clock, Star, Users, BarChart2,
  Flame, RefreshCcw, Calendar
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5001";
const token = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${token()}` });

type FilterType = "daily" | "weekly" | "monthly";

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white border-2 border-deep-black shadow-[4px_4px_0_0_#0A0A0A] p-6 flex items-start gap-4">
      <div className={`w-12 h-12 flex items-center justify-center ${color} border-2 border-deep-black`}>
        {(() => { const I = Icon as React.FC<{ className?: string }>; return <I className="w-6 h-6 text-white" />; })()}
      </div>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">{label}</p>
        <p className="text-3xl font-black text-deep-black">{value}</p>
        {sub && <p className="text-xs font-bold text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdvancedAnalytics() {
  const [filter, setFilter] = useState<FilterType>("weekly");
  const [loading, setLoading] = useState(false);

  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [bestItems, setBestItems] = useState<any[]>([]);
  const [waiterPerf, setWaiterPerf] = useState<any[]>([]);
  const [salesTrends, setSalesTrends] = useState<any[]>([]);
  const [orderTime, setOrderTime] = useState<{ avgPrepTime: number; fastestOrder: number; slowestOrder: number } | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = { filter };
      const [ph, bi, wp, st, ot] = await Promise.all([
        axios.get(`${API}/api/analytics/peak-hours`, { headers: headers(), params }),
        axios.get(`${API}/api/analytics/best-items`, { headers: headers(), params }),
        axios.get(`${API}/api/analytics/waiter-performance`, { headers: headers(), params }),
        axios.get(`${API}/api/analytics/sales-trends`, { headers: headers(), params }),
        axios.get(`${API}/api/analytics/order-time`, { headers: headers(), params }),
      ]);
      setPeakHours(ph.data.data || []);
      setBestItems(bi.data.data || []);
      setWaiterPerf(wp.data.data || []);
      setSalesTrends(st.data.data || []);
      setOrderTime(ot.data.data || null);
    } catch (e) {
      console.error("Analytics fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [filter]);

  // format hour labels: 0 -> 12AM, 13 -> 1PM
  const formatHour = (h: number) => {
    if (h === 0) return "12AM";
    if (h < 12) return `${h}AM`;
    if (h === 12) return "12PM";
    return `${h - 12}PM`;
  };

  const peakHoursFormatted = peakHours.map(h => ({
    ...h,
    label: formatHour(h.hour),
  }));

  // Find busiest hour
  const busiestHour = peakHoursFormatted.reduce(
    (max, h) => (h.totalOrders > (max?.totalOrders || 0) ? h : max),
    null as any
  );

  const totalRevenue = salesTrends.reduce((sum, d) => sum + d.totalRevenue, 0);

  return (
    <div className="p-6 space-y-8 bg-warm-white min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-deep-black pb-6">
        <div>
          <span className="bg-deep-black text-golden-yellow px-2 py-1 font-mono font-black text-xs">
            ANALYTICS_COMMAND_CENTER
          </span>
          <h1 className="text-5xl font-black italic tracking-tight mt-2 text-deep-black">
            BUSINESS <span className="text-golden-yellow">INSIGHTS</span>
          </h1>
          <p className="font-mono text-xs text-gray-500 mt-1 uppercase tracking-widest">
            Live data-driven performance dashboard — {filter} view
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Tabs */}
          <div className="flex border-2 border-deep-black overflow-hidden">
            {(["daily", "weekly", "monthly"] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 font-mono font-black text-xs uppercase tracking-widest transition-all ${
                  filter === f
                    ? "bg-deep-black text-golden-yellow"
                    : "bg-white text-deep-black hover:bg-gray-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="w-10 h-10 bg-golden-yellow border-2 border-deep-black flex items-center justify-center hover:bg-white transition-all"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
          sub={`${filter} period`}
          color="bg-golden-yellow"
        />
        <StatCard
          icon={Flame}
          label="Peak Hour"
          value={busiestHour ? busiestHour.label : "—"}
          sub={busiestHour ? `${busiestHour.totalOrders} orders` : "No data"}
          color="bg-red-500"
        />
        <StatCard
          icon={Clock}
          label="Avg Prep Time"
          value={orderTime ? `${orderTime.avgPrepTime.toFixed(1)} min` : "—"}
          sub={orderTime ? `Fastest: ${orderTime.fastestOrder.toFixed(1)}min` : "No data"}
          color="bg-blue-600"
        />
        <StatCard
          icon={Star}
          label="Top Item"
          value={bestItems[0]?.name || "—"}
          sub={bestItems[0] ? `${bestItems[0].totalQuantity} sold` : "No data"}
          color="bg-green-600"
        />
      </div>

      {/* Row 1: Peak Hours + Best Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Bar Chart */}
        <div className="bg-white border-2 border-deep-black shadow-[4px_4px_0_0_#0A0A0A] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-golden-yellow border-2 border-deep-black flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">METRIC_01</p>
              <h3 className="font-black text-xl text-deep-black">Peak Hours Analysis</h3>
            </div>
          </div>
          {peakHoursFormatted.length === 0 ? (
            <div className="h-48 flex items-center justify-center font-mono text-xs text-gray-400 border-2 border-dashed border-gray-200">
              [NO_DATA] — Place orders to see peak hour insights
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={peakHoursFormatted}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ border: "2px solid #0A0A0A", borderRadius: 0, fontFamily: "monospace", fontSize: 12 }}
                />
                <Bar dataKey="totalOrders" fill="#F5B400" name="Orders" strokeWidth={2} stroke="#0A0A0A" />
                <Bar dataKey="totalRevenue" fill="#0A0A0A" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Best Selling Items */}
        <div className="bg-white border-2 border-deep-black shadow-[4px_4px_0_0_#0A0A0A] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-green-500 border-2 border-deep-black flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">METRIC_02</p>
              <h3 className="font-black text-xl text-deep-black">Top 5 Best-Selling Items</h3>
            </div>
          </div>
          {bestItems.length === 0 ? (
            <div className="h-48 flex items-center justify-center font-mono text-xs text-gray-400 border-2 border-dashed border-gray-200">
              [NO_DATA] — Complete orders to see top items
            </div>
          ) : (
            <div className="space-y-3">
              {bestItems.map((item, idx) => {
                const maxQty = bestItems[0]?.totalQuantity || 1;
                const pct = Math.round((item.totalQuantity / maxQty) * 100);
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-deep-black text-golden-yellow font-black text-xs">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-black text-sm text-deep-black">{item.name}</span>
                        <span className="font-mono text-xs text-gray-500">{item.totalQuantity} sold · ₹{item.totalRevenue?.toFixed(0)}</span>
                      </div>
                      <div className="h-3 bg-gray-100 border border-gray-200">
                        <div
                          className="h-full bg-golden-yellow"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Sales Trends Line Chart */}
      <div className="bg-white border-2 border-deep-black shadow-[4px_4px_0_0_#0A0A0A] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-blue-600 border-2 border-deep-black flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">METRIC_03</p>
            <h3 className="font-black text-xl text-deep-black">Sales Trends ({filter})</h3>
          </div>
        </div>
        {salesTrends.length === 0 ? (
          <div className="h-48 flex items-center justify-center font-mono text-xs text-gray-400 border-2 border-dashed border-gray-200">
            [NO_DATA] — Complete orders across multiple days to see trends
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salesTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 700 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                contentStyle={{ border: "2px solid #0A0A0A", borderRadius: 0, fontFamily: "monospace", fontSize: 12 }}
                formatter={(v: any) => [`₹${Number(v).toFixed(2)}`, "Revenue"]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalRevenue"
                name="Revenue (₹)"
                stroke="#F5B400"
                strokeWidth={3}
                dot={{ r: 5, fill: "#0A0A0A", strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 3: Waiter Performance + Order Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiter Performance Table */}
        <div className="bg-white border-2 border-deep-black shadow-[4px_4px_0_0_#0A0A0A] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-purple-600 border-2 border-deep-black flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">METRIC_04</p>
              <h3 className="font-black text-xl text-deep-black">Waiter Performance</h3>
            </div>
          </div>
          {waiterPerf.length === 0 ? (
            <div className="h-48 flex items-center justify-center font-mono text-xs text-gray-400 border-2 border-dashed border-gray-200">
              [NO_DATA] — No waiter-linked orders found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-deep-black text-golden-yellow">
                    <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-widest">#</th>
                    <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-widest">Waiter</th>
                    <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-widest">Orders</th>
                    <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-widest">Tables</th>
                    <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-widest">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {waiterPerf.map((w, idx) => (
                    <tr key={idx} className={`border-b border-gray-100 ${idx === 0 ? "bg-golden-yellow/10" : ""}`}>
                      <td className="px-3 py-2 font-black text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-2 font-black text-deep-black">{w.name}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{w.orderCount}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{w.tableCount}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-green-600">₹{w.totalSales?.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Completion Time */}
        <div className="bg-white border-2 border-deep-black shadow-[4px_4px_0_0_#0A0A0A] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-red-500 border-2 border-deep-black flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">METRIC_05</p>
              <h3 className="font-black text-xl text-deep-black">Order Completion Time</h3>
            </div>
          </div>

          {!orderTime || orderTime.avgPrepTime === 0 ? (
            <div className="h-48 flex items-center justify-center font-mono text-xs text-gray-400 border-2 border-dashed border-gray-200">
              [NO_DATA] — Mark orders as ready/completed to track prep times
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Average Prep Time", value: `${orderTime.avgPrepTime.toFixed(1)} min`, color: "bg-blue-500", icon: "⊘" },
                { label: "Fastest Order", value: `${orderTime.fastestOrder.toFixed(1)} min`, color: "bg-green-500", icon: "⚡" },
                { label: "Slowest Order", value: `${orderTime.slowestOrder.toFixed(1)} min`, color: "bg-red-500", icon: "⏳" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-4 border-2 border-gray-100 p-4">
                  <div className={`w-10 h-10 ${stat.color} flex items-center justify-center text-white text-lg font-black`}>
                    {stat.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-black text-deep-black">{stat.value}</p>
                  </div>
                </div>
              ))}
              <div className="bg-deep-black text-golden-yellow p-4 font-mono text-xs">
                <p className="font-black uppercase tracking-widest mb-1">[INSIGHT]</p>
                <p>Target: Keep avg prep time under 15 min. Currently {orderTime.avgPrepTime > 15 ? "⚠️ above" : "✅ within"} target.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-deep-black/10 pt-4 flex items-center gap-2 font-mono text-[10px] text-gray-400 uppercase tracking-widest">
        <Calendar className="w-3 h-3" />
        Data refreshed on demand · Filter: {filter} · All amounts in INR ₹
      </div>
    </div>
  );
}
