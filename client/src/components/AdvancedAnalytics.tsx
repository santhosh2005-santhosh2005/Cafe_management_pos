import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, Users, BarChart as BarChartIcon, LineChart as LineChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const ItemAnalytics = ({ filter }: { filter: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
        const res = await axios.get(`${apiUrl}/api/analytics/items?filter=${filter}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) setItems(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchItems();
  }, [filter, token]);

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-500" />
          Item Sales Analytics
        </CardTitle>
        <Badge variant="outline" className="capitalize">{filter}</Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded"></div>)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No sales data found for this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-right">Qty Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item._id} className={index === 0 ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}>
                    <TableCell className="font-medium flex items-center gap-2">
                      {item.name}
                      {index === 0 && <Badge className="bg-golden-yellow text-deep-black hover:bg-golden-yellow text-[8px] px-1 py-0">BEST SELLER</Badge>}
                    </TableCell>
                    <TableCell className="text-right">{item.totalQuantity}</TableCell>
                    <TableCell className="text-right">INR {item.totalRevenue.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const WaiterAnalytics = ({ filter }: { filter: string }) => {
  const [waiters, setWaiters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    const fetchWaiters = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
        const res = await axios.get(`${apiUrl}/api/analytics/waiters?filter=${filter}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) setWaiters(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchWaiters();
  }, [filter, token]);

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-green-500" />
          Waiter Performance
        </CardTitle>
        <Badge variant="outline" className="capitalize">{filter}</Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded"></div>)}
          </div>
        ) : waiters.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No waiter data found for this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waiter Name</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Tables</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waiters.map((waiter) => (
                  <TableRow key={waiter._id}>
                    <TableCell className="font-medium">{waiter.name}</TableCell>
                    <TableCell className="text-right">{waiter.orderCount}</TableCell>
                    <TableCell className="text-right">{waiter.tableCount}</TableCell>
                    <TableCell className="text-right">INR {waiter.totalSales.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CashierAnalytics = ({ filter }: { filter: string }) => {
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    const fetchCashiers = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
        const res = await axios.get(`${apiUrl}/api/analytics/cashiers?filter=${filter}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) setCashiers(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchCashiers();
  }, [filter, token]);

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          Cashier Performance
        </CardTitle>
        <Badge variant="outline" className="capitalize">{filter}</Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 animate-pulse rounded"></div>)}
          </div>
        ) : cashiers.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No cashier data found for this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cashier Name</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Avg Sales</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashiers.map((cashier) => (
                  <TableRow key={cashier._id}>
                    <TableCell className="font-medium">{cashier.name}</TableCell>
                    <TableCell className="text-right">{cashier.totalSessions}</TableCell>
                    <TableCell className="text-right">INR {Math.round(cashier.averageSalesPerSession).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-right">INR {cashier.totalSales.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SalesCharts = ({ filter }: { filter: string }) => {
   const [data, setData] = useState<any>(null);
   const { token } = useSelector((state: RootState) => state.user);

   useEffect(() => {
     const fetchCharts = async () => {
       try {
         const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
         const res = await axios.get(`${apiUrl}/api/analytics/dashboard?filter=${filter}`, {
           headers: { Authorization: `Bearer ${token}` }
         });
         if (res.data.success) setData(res.data.data);
       } catch (err) { console.error(err); }
     };
     if (token) fetchCharts();
   }, [filter, token]);

   if (!data) return null;

   return (
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="rounded-[32px] border-none shadow-sm dark:bg-gray-800">
           <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                 <BarChartIcon className="w-5 h-5 text-blue-600" /> Peak Time Analysis (Hourly)
              </CardTitle>
           </CardHeader>
           <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data.hourlySales}>
                    <XAxis dataKey="hour" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </CardContent>
        </Card>

        <Card className="rounded-[32px] border-none shadow-sm dark:bg-gray-800">
           <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                 <LineChartIcon className="w-5 h-5 text-green-600" /> Revenue Trends
              </CardTitle>
           </CardHeader>
           <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={data.hourlySales}>
                    <XAxis dataKey="hour" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} dot={false} />
                 </LineChart>
              </ResponsiveContainer>
           </CardContent>
        </Card>
     </div>
   );
};

const AdvancedAnalytics = ({ filter }: { filter: string }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ItemAnalytics filter={filter} />
        <div className="space-y-6">
          <WaiterAnalytics filter={filter} />
          <CashierAnalytics filter={filter} />
        </div>
      </div>
      <SalesCharts filter={filter} />
    </div>
  );
};

export default AdvancedAnalytics;
