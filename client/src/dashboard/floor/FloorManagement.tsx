import { useState } from "react";
import { useGetFloorsQuery, useCreateFloorMutation, useDeleteFloorMutation } from "@/services/floorApi";
import { useGetTablesQuery, useCreateTableMutation, useUpdateTableMutation, useDeleteTableMutation } from "@/services/tableApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, Map, Users, CheckCircle2, XCircle, LayoutGrid, Layers, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetAllStaffQuery } from "@/services/staffService";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";

export default function FloorManagement() {
  const { data: floorsData, isLoading: floorsLoading } = useGetFloorsQuery();
  const { data: tablesData, isLoading: tablesLoading } = useGetTablesQuery();
  const { data: staffData } = useGetAllStaffQuery(undefined);
  
  const [createFloor] = useCreateFloorMutation();
  const [deleteFloor] = useDeleteFloorMutation();
  const [createTable] = useCreateTableMutation();
  const [updateTable] = useUpdateTableMutation();
  const [deleteTable] = useDeleteTableMutation();

  const [isFloorDialogOpen, setIsFloorDialogOpen] = useState(false);
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  
  const [floorName, setFloorName] = useState("");
  const [tableForm, setTableForm] = useState({
    number: "",
    seats: 2,
    floor: "",
    active: true,
    appointmentResourceId: ""
  });

  const floors = floorsData?.data || [];
  const tables = tablesData?.data || [];

  const handleCreateFloor = async () => {
    if (!floorName) return;
    try {
      await createFloor({ name: floorName }).unwrap();
      setFloorName("");
      setIsFloorDialogOpen(false);
      toast.success("Floor system initialized");
    } catch (err) {
      toast.error("Process failed");
    }
  };

  const handleCreateTable = async () => {
    if (!tableForm.number || !tableForm.floor) {
        toast.error("Identifier and Floor allocation required");
        return;
    }
    try {
      await createTable(tableForm).unwrap();
      setTableForm({ number: "", seats: 2, floor: "", active: true, appointmentResourceId: "" });
      setIsTableDialogOpen(false);
      toast.success("Unit allocated successfully");
    } catch (err) {
      toast.error("Allocation failed");
    }
  };

  const handleDeleteFloor = async (id: string, name: string) => {
    const res = await Swal.fire({
      title: 'TERMINATE_FLOOR?',
      text: `Unit "${name}" and its sub-components will be detached.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#000',
      confirmButtonText: 'CONFIRM_DELETION',
      cancelButtonText: 'ABORT'
    });

    if (res.isConfirmed) {
      await deleteFloor(id);
      toast.success("Unit detached");
    }
  };

  const handleDeleteTable = async (id: string) => {
    await deleteTable(id);
    toast.success("Unit removed from grid");
  };

  const toggleTableActive = async (id: string, current: boolean) => {
    await updateTable({ id, body: { active: !current } }).unwrap();
    toast.success("Status state toggled");
  };

  if (floorsLoading || tablesLoading) return (
    <div className="flex items-center justify-center min-h-[60vh] bg-warm-white">
        <div className="text-center font-black uppercase text-2xl tracking-tighter animate-pulse">
            [ INITIALIZING_GRID_SYSTEM_V.2 ]
        </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b-4 border-deep-black pb-10">
        <div className="max-w-2xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-golden-yellow mb-2 font-black">
            System_Directory / 04
          </div>
          <h1 className="text-7xl font-sans font-black text-deep-black leading-[0.8] mb-4">
            FLOOR_PLAN<br />
            MANAGEMENT.
          </h1>
          <p className="font-mono text-xs uppercase tracking-widest text-deep-black/60 max-w-lg">
            Strategic resource allocation, layout architecture, and unit status synchronization for real-time operations.
          </p>
        </div>
        
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <Dialog open={isFloorDialogOpen} onOpenChange={setIsFloorDialogOpen}>
            <DialogTrigger asChild>
              <button className="brutalist-button flex items-center justify-center gap-2 h-14 bg-deep-black text-warm-white hover:bg-golden-yellow hover:text-deep-black transition-all">
                <Plus size={20} /> ADD_SUB_LEVEL
              </button>
            </DialogTrigger>
            <DialogContent className="rounded-none border-4 border-deep-black shadow-[16px_16px_0px_0px_#F5B400] max-w-md p-10">
              <DialogHeader>
                <DialogTitle className="text-4xl font-black uppercase tracking-tighter border-b-2 border-deep-black pb-4 mb-6">NEW_LEVEL</DialogTitle>
                <DialogDescription className="font-mono uppercase text-[10px] tracking-widest mb-4">Define a new operational sector.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label className="font-mono text-[10px] uppercase tracking-widest">Sector_Identifier</Label>
                  <Input 
                    value={floorName} 
                    onChange={(e) => setFloorName(e.target.value)} 
                    placeholder="E.G. GROUND_ZERO" 
                    className="rounded-none border-2 border-deep-black focus-visible:ring-0 h-14 bg-warm-white font-sans font-black uppercase text-xl"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <button onClick={handleCreateFloor} className="w-full h-14 bg-deep-black text-warm-white font-black uppercase hover:bg-golden-yellow hover:text-deep-black transition-all">INITIALIZE_SECTOR</button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
            <DialogTrigger asChild>
              <button className="brutalist-button h-14 bg-golden-yellow text-deep-black font-black uppercase flex items-center justify-center gap-2">
                <Plus size={20} /> ALLOCATE_UNIT
              </button>
            </DialogTrigger>
            <DialogContent className="rounded-none border-4 border-deep-black shadow-[16px_16px_0px_0px_#0A0A0A] max-w-md p-10 bg-warm-white">
              <DialogHeader>
                <DialogTitle className="text-4xl font-black uppercase tracking-tighter border-b-2 border-deep-black pb-4 mb-6">UNIT_CONFIG</DialogTitle>
                <DialogDescription className="font-mono uppercase text-[10px] tracking-widest mb-4">Strategic unit placement and capacity mapping.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase tracking-widest">Unit_ID</Label>
                    <Input 
                      value={tableForm.number} 
                      onChange={(e) => setTableForm({...tableForm, number: e.target.value})} 
                      placeholder="T-00" 
                      className="rounded-none border-2 border-deep-black h-12 font-black text-xl bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] uppercase tracking-widest">Capacity</Label>
                    <Input 
                      type="number"
                      value={tableForm.seats} 
                      onChange={(e) => setTableForm({...tableForm, seats: parseInt(e.target.value)})} 
                      className="rounded-none border-2 border-deep-black h-12 font-black text-xl bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-mono text-[10px] uppercase tracking-widest">Sector_Allocation</Label>
                  <Select onValueChange={(val) => setTableForm({...tableForm, floor: val})}>
                    <SelectTrigger className="rounded-none border-2 border-deep-black h-12 font-black uppercase text-xs bg-white">
                      <SelectValue placeholder="SELECT_SECTOR" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-2 border-deep-black bg-white">
                      {floors.map((f: any) => (
                        <SelectItem key={f._id} value={f._id} className="font-black uppercase text-xs focus:bg-golden-yellow transition-colors">{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-8">
                <button onClick={handleCreateTable} className="w-full h-14 bg-deep-black text-warm-white font-black uppercase hover:bg-golden-yellow hover:text-deep-black transition-all">COMMIT_ALLOCATION</button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 gap-16">
        {floors.length === 0 ? (
          <div className="border-4 border-deep-black border-dashed h-[400px] flex flex-col items-center justify-center bg-white/40 p-10 text-center">
             <div className="w-20 h-20 border-2 border-deep-black flex items-center justify-center mb-6">
                 <Map className="w-10 h-10 text-deep-black" />
             </div>
             <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">VOID_DETECTED</h3>
             <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Initializing procedures required. No sectors defined.</p>
          </div>
        ) : (
          floors.map((floor: any) => {
            const floorTables = tables.filter((t: any) => t.floor?._id === floor._id || t.floor === floor._id);
            return (
              <div key={floor._id} className="relative group">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 px-2">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                        <span className="bg-deep-black text-warm-white font-mono text-[10px] px-2 py-1 uppercase tracking-tighter">Sector_Active</span>
                        <h2 className="text-5xl font-sans font-black text-deep-black uppercase tracking-tighter leading-none">{floor.name}</h2>
                    </div>
                    <div className="flex gap-6 font-mono text-[10px] uppercase tracking-widest text-deep-black/50 font-black">
                        <span className="flex items-center gap-2 border-r border-deep-black/20 pr-6">Units: {floorTables.length}</span>
                        <span>Capacity: {floorTables.reduce((acc: number, t: any) => acc + (t.seats || 0), 0)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteFloor(floor._id, floor.name)}
                    className="p-3 border-2 border-deep-black hover:bg-red-600 hover:text-white transition-all active:translate-y-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-l-2 border-t-2 border-deep-black">
                  {floorTables.length === 0 ? (
                      <div className="col-span-full border-r-2 border-b-2 border-deep-black p-10 bg-white/30 italic font-mono text-[10px] uppercase text-center text-muted-foreground">
                        --- NO_UNITS_ALLOCATED_IN_THIS_SECTOR ---
                      </div>
                  ) : (
                      floorTables.map((table: any) => (
                         <div key={table._id} className="border-r-2 border-b-2 border-deep-black p-8 bg-white hover:bg-warm-white transition-all group relative overflow-hidden h-full flex flex-col justify-between">
                             {/* Background Accent */}
                             <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden pointer-events-none opacity-10 group-hover:opacity-100 group-hover:text-golden-yellow transition-all">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-deep-black translate-x-16 -translate-y-16 rotate-45 group-hover:bg-golden-yellow"></div>
                             </div>

                             <div className="relative z-10">
                                 <div className="flex justify-between items-start mb-10">
                                     <div>
                                         <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground font-black mb-2">Unit_ID</p>
                                         <h4 className="text-5xl font-sans font-black text-deep-black leading-none tracking-tighter">{table.number}</h4>
                                     </div>
                                     <div className={`px-2 py-1 font-mono text-[10px] font-black uppercase text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${table.status === 'free' ? 'bg-green-600' : 'bg-red-600'}`}>
                                          {table.status}
                                     </div>
                                 </div>

                                 <div className="space-y-6 border-t-2 border-deep-black/10 pt-6">
                                     <div className="flex items-center justify-between">
                                         <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-deep-black flex items-center justify-center font-mono text-xs font-black bg-warm-white">
                                                {table.seats}
                                            </div>
                                            <span className="font-mono text-[9px] uppercase tracking-widest font-black">Capacity</span>
                                         </div>
                                         <select 
                                           className="border-2 border-deep-black bg-white rounded-none text-[10px] font-black px-4 h-10 uppercase transition-all focus:bg-golden-yellow outline-none"
                                           value={table.assignedWaiter?._id || table.assignedWaiter || ""}
                                           onChange={async (e) => {
                                              try {
                                                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/staff/assign-table`, {
                                                  method: 'PUT',
                                                  headers: { 
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${localStorage.getItem('token')}` 
                                                  },
                                                  body: JSON.stringify({ tableId: table._id, waiterId: e.target.value || null })
                                                });
                                                if (res.ok) toast.success("Waiter assigned!");
                                              } catch (err) { toast.error("Assignment failed"); }
                                           }}
                                         >
                                            <option value="">--ASSIGN--</option>
                                            {staffData?.staffs?.filter((s: any) => s.role === 'waiter' || s.role === 'staff').map((s: any) => (
                                              <option key={s._id} value={s._id}>{s.name.toUpperCase()}</option>
                                            ))}
                                         </select>
                                     </div>

                                     <div className="flex items-center justify-between border-t-2 border-dotted border-deep-black/10 pt-4">
                                         <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground font-black">Active_Stage</span>
                                         <button 
                                              onClick={() => toggleTableActive(table._id, table.active)}
                                              className={`flex items-center gap-2 h-8 px-4 font-mono font-black text-[9px] uppercase border-2 border-deep-black transition-all ${table.active ? 'bg-deep-black text-warm-white' : 'bg-transparent text-deep-black opacity-30 hover:opacity-100'}`}
                                          >
                                             {table.active ? 'ENABLE_OK' : 'DISABLED'}
                                         </button>
                                     </div>
                                 </div>
                             </div>

                             <div className="flex gap-4 mt-8 relative z-10">
                                 <Dialog>
                                     <DialogTrigger asChild>
                                         <button className="flex-1 bg-deep-black text-warm-white hover:bg-golden-yellow hover:text-deep-black font-black uppercase text-[10px] tracking-tighter h-14 border-2 border-deep-black flex items-center justify-center gap-3 transition-colors active:translate-y-1 active:translate-x-1 active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                            <QrCode size={20} /> VIEW_QR
                                         </button>
                                     </DialogTrigger>
                                     <DialogContent className="rounded-none border-4 border-deep-black shadow-[24px_24px_0px_0px_#F5B400] max-w-sm text-center bg-white p-10">
                                         <DialogHeader>
                                             <DialogTitle className="text-4xl font-black uppercase mb-2 border-b-2 border-deep-black pb-4">UNIT_{table.number}</DialogTitle>
                                             <DialogDescription className="font-mono uppercase text-[10px] tracking-[0.3em] font-black text-golden-yellow">ACCESS_TOKEN_QR</DialogDescription>
                                         </DialogHeader>
                                         <div className="flex flex-col items-center justify-center py-10 bg-warm-white border-2 border-deep-black my-8 relative">
                                             <div className="absolute -top-3 -left-3 w-6 h-6 border-2 border-deep-black bg-golden-yellow"></div>
                                             <div className="absolute -bottom-3 -right-3 w-6 h-6 border-2 border-deep-black bg-golden-yellow"></div>
                                             
                                             <img 
                                                 src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.origin}/self-order/${table._id}`} 
                                                 alt="Table QR" 
                                                 className="w-44 h-44 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-deep-black"
                                             />
                                         </div>
                                         <DialogFooter className="mt-4">
                                             <button 
                                                 className="w-full h-14 bg-deep-black text-warm-white font-black uppercase hover:bg-golden-yellow hover:text-deep-black border-2 border-deep-black transition-all"
                                                 onClick={() => {
                                                     window.open(`${window.location.origin}/self-order/${table._id}`, '_blank');
                                                 }}
                                             >
                                                 OPEN_PORTAL
                                             </button>
                                         </DialogFooter>
                                     </DialogContent>
                                 </Dialog>
                                 
                                 <button 
                                      onClick={() => handleDeleteTable(table._id)}
                                      className="w-14 h-14 border-2 border-deep-black flex items-center justify-center hover:bg-red-600 hover:text-white transition-all group"
                                  >
                                      <Trash2 size={18} />
                                 </button>
                             </div>
                         </div>
                      ))
                  )
                  }
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
