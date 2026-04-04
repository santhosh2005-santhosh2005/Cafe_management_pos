import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, Users, TrendingUp, DollarSign } from "lucide-react";

const ItemAnalytics = ({ filter }: { filter: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
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
                {items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.totalQuantity}</TableCell>
                    <TableCell className="text-right">৳{item.totalRevenue.toLocaleString()}</TableCell>
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
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
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
                    <TableCell className="text-right">৳{waiter.totalSales.toLocaleString()}</TableCell>
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

const AdvancedAnalytics = ({ filter }: { filter: string }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <ItemAnalytics filter={filter} />
      <WaiterAnalytics filter={filter} />
    </div>
  );
};

export default AdvancedAnalytics;
