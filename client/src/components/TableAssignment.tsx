import { useGetTablesQuery, useUpdateTableMutation } from "@/services/tableApi";
import { useGetAllStaffQuery } from "@/services/staffService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, User, ArrowRight, Table as TableIcon } from "lucide-react";
import { toast } from "react-hot-toast";

export const TableAssignment = () => {
  const { data: tablesData, refetch: refetchTables } = useGetTablesQuery();
  const { data: staffData } = useGetAllStaffQuery({});
  const [updateTable, { isLoading: isUpdating }] = useUpdateTableMutation();

  const tables = tablesData?.data || [];
  const staff = staffData?.staffs?.filter((s: any) => ["staff", "waiter", "barista", "cashier"].includes(s.role.toLowerCase())) || [];

  const handleAssign = async (tableId: string, waiterId: string) => {
    try {
      const res = await updateTable({ 
        id: tableId, 
        body: { assignedWaiter: waiterId === "none" ? null : waiterId } 
      }).unwrap();
      
      if (res.data) {
        toast.success("Waiter assigned to table!");
        refetchTables();
      }
    } catch (err) {
      toast.error("Assignment failed");
    }
  };

  const getWaiterId = (assignedWaiter: any) => {
    if (!assignedWaiter) return "none";
    return typeof assignedWaiter === "object" ? assignedWaiter._id : assignedWaiter;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tables.map((table: any) => {
        const currentWaiterId = getWaiterId(table.assignedWaiter);
        
        return (
          <div key={table._id} className="p-6 bg-white dark:bg-gray-800 rounded-[32px] shadow-sm border dark:border-gray-700 space-y-4">
            <div className="flex justify-between items-start">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                     <TableIcon size={20} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Table</p>
                     <p className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">#{table.number}</p>
                  </div>
               </div>
               <Badge variant={table.status === "free" ? "outline" : "default"} className={`font-black uppercase text-[10px] ${table.status === 'free' ? 'text-green-600 border-green-200 bg-green-50' : 'bg-amber-100 text-amber-700 border-none'}`}>
                  {table.status}
               </Badge>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                <Users size={12} /> Assigned Staff
              </label>
              <Select 
                key={`${table._id}-${currentWaiterId}`}
                value={currentWaiterId} 
                onValueChange={(val) => handleAssign(table._id, val)}
                disabled={isUpdating}
              >
                <SelectTrigger className="rounded-2xl border-2 dark:border-gray-700 h-14 font-bold bg-gray-50/50 dark:bg-gray-900/30">
                  <SelectValue placeholder="Select Staff" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl dark:bg-gray-900">
                  <SelectItem value="none" className="font-bold">Unassigned</SelectItem>
                  {staff.map((s: any) => (
                    <SelectItem key={s._id} value={s._id} className="font-bold">
                      <span className="flex items-center gap-2">
                         <User size={14} className="text-blue-500" /> {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentWaiterId !== "none" && (
              <div className="pt-2">
                 <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-2xl flex items-center justify-center gap-2 border border-blue-100 dark:border-blue-900/30">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Active Watch</span>
                    <ArrowRight size={12} className="text-blue-600" />
                    <span className="text-xs font-black text-blue-800 dark:text-blue-200">
                       {staff.find((s: any) => s._id === currentWaiterId)?.name || "Ready"}
                    </span>
                 </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
