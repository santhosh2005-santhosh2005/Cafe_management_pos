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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";

export default function FloorManagement() {
  const { data: floorsData, isLoading: floorsLoading } = useGetFloorsQuery();
  const { data: tablesData, isLoading: tablesLoading } = useGetTablesQuery();
  
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
      toast.success("Floor created successfully!");
    } catch (err) {
      toast.error("Failed to create floor");
    }
  };

  const handleCreateTable = async () => {
    if (!tableForm.number || !tableForm.floor) {
        toast.error("Table Number and Floor are required");
        return;
    }
    try {
      await createTable(tableForm).unwrap();
      setTableForm({ number: "", seats: 2, floor: "", active: true, appointmentResourceId: "" });
      setIsTableDialogOpen(false);
      toast.success("Table added successfully!");
    } catch (err) {
      toast.error("Failed to add table");
    }
  };

  const handleDeleteFloor = async (id: string, name: string) => {
    const res = await Swal.fire({
      title: 'Delete Floor?',
      text: `Deleting the "${name}" floor will not delete the tables assigned to it (they will become unassigned).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete floor'
    });

    if (res.isConfirmed) {
      await deleteFloor(id);
      toast.success("Floor removed");
    }
  };

  const handleDeleteTable = async (id: string) => {
    await deleteTable(id);
    toast.success("Table removed");
  };

  const toggleTableActive = async (id: string, current: boolean) => {
    await updateTable({ id, body: { active: !current } }).unwrap();
    toast.success("Table status updated");
  };

  if (floorsLoading || tablesLoading) return <div className="p-10 text-center font-bold">Initializing Floor Plans...</div>;

  return (
    <div className="p-6 space-y-8 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-blue-600" />
            Floor Plan Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage cafe levels, table seating, and appointment resources</p>
        </div>
        
        <div className="flex gap-3">
          <Dialog open={isFloorDialogOpen} onOpenChange={setIsFloorDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl flex gap-2">
                <Plus size={18} /> Add Floor
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>Create New Floor</DialogTitle>
                <DialogDescription>Add a new level or section to your cafe layout.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Floor Name</Label>
                  <Input 
                    value={floorName} 
                    onChange={(e) => setFloorName(e.target.value)} 
                    placeholder="e.g. Ground Floor, Rooftop" 
                    className="rounded-xl"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateFloor} className="bg-blue-600 hover:bg-blue-700 rounded-xl">Create Floor</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl flex gap-2 shadow-lg shadow-blue-500/20">
                <Plus size={18} /> Add Table
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-md">
              <DialogHeader>
                <DialogTitle>Configure New Table</DialogTitle>
                <DialogDescription>Assign a new table to a floor and set its capacity.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Table ID / No.</Label>
                    <Input 
                      value={tableForm.number} 
                      onChange={(e) => setTableForm({...tableForm, number: e.target.value})} 
                      placeholder="e.g. T-01" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Seating Capacity</Label>
                    <Input 
                      type="number"
                      value={tableForm.seats} 
                      onChange={(e) => setTableForm({...tableForm, seats: parseInt(e.target.value)})} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Assign to Floor</Label>
                  <Select onValueChange={(val) => setTableForm({...tableForm, floor: val})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select Floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {floors.map((f: any) => (
                        <SelectItem key={f._id} value={f._id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Appointment Resource ID (Optional)</Label>
                  <Input 
                    value={tableForm.appointmentResourceId} 
                    onChange={(e) => setTableForm({...tableForm, appointmentResourceId: e.target.value})} 
                    placeholder="Link to external resource ID" 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateTable} className="w-full bg-blue-600 rounded-xl">Add Table to Layout</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {floors.length === 0 ? (
          <Card className="border-dashed py-20 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center">
             <Map className="w-16 h-16 text-gray-300 mb-4" />
             <p className="text-gray-500 font-bold">No Floors Created Yet</p>
             <p className="text-gray-400 text-sm">Create your first floor (e.g. Ground Floor) to start adding tables.</p>
          </Card>
        ) : (
          floors.map((floor: any) => {
            const floorTables = tables.filter((t: any) => t.floor?._id === floor._id || t.floor === floor._id);
            return (
              <Card key={floor._id} className="rounded-3xl border-none shadow-sm dark:bg-gray-800 overflow-hidden">
                <CardHeader className="bg-blue-50 dark:bg-blue-900/10 flex flex-row justify-between items-center px-8 py-6">
                  <div>
                    <CardTitle className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                         <Layers size={18} className="text-blue-600" />
                         {floor.name}
                    </CardTitle>
                    <CardDescription className="font-bold flex gap-4 mt-1">
                        <span className="flex items-center gap-1"><LayoutGrid size={12}/> {floorTables.length} Tables</span>
                        <span className="flex items-center gap-1"><Users size={12}/> {floorTables.reduce((acc: number, t: any) => acc + (t.seats || 0), 0)} Total Seats</span>
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteFloor(floor._id, floor.name)} className="text-red-500 hover:bg-red-50">
                    <Trash2 size={18} />
                  </Button>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {floorTables.length === 0 ? (
                        <p className="text-gray-400 text-xs italic col-span-full">No tables assigned to this floor yet.</p>
                    ) : (
                        floorTables.map((table: any) => (
                           <div key={table._id} className="border dark:border-gray-700 rounded-2xl p-5 hover:border-blue-500 transition-all group relative">
                               <div className="flex justify-between items-start mb-4">
                                   <div>
                                       <p className="text-xs uppercase tracking-widest text-gray-400 font-black">Table Number</p>
                                       <h4 className="text-2xl font-black text-gray-900 dark:text-white">{table.number}</h4>
                                   </div>
                                   <Badge variant={table.status === 'free' ? 'secondary' : 'default'} className={table.status === 'free' ? 'bg-green-50 text-green-700 p-1 px-2' : 'bg-red-50 text-red-700 p-1 px-2'}>
                                        {table.status.toUpperCase()}
                                   </Badge>
                               </div>

                               <div className="space-y-3">
                                   <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                       <Users size={14} />
                                       <span className="font-bold">{table.seats} Seater</span>
                                   </div>
                                   {table.appointmentResourceId && (
                                       <div className="flex items-center gap-2 text-[10px] text-blue-500 font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                                            Resource: {table.appointmentResourceId}
                                       </div>
                                   )}
                                   <div className="flex items-center justify-between pt-2 border-t dark:border-gray-700 mt-2">
                                       <label className="text-[10px] uppercase font-black text-gray-400">Active Stage</label>
                                       <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => toggleTableActive(table._id, table.active)}
                                            className="h-6 gap-1 p-0 px-2"
                                        >
                                           {table.active ? <CheckCircle2 size={14} className="text-green-500" /> : <XCircle size={14} className="text-gray-300" />}
                                           <span className={table.active ? 'text-green-600' : 'text-gray-400'}>{table.active ? 'Active' : 'Disabled'}</span>
                                       </Button>
                                   </div>
                               </div>

                               <div className="flex gap-2 mt-4 pt-4 border-t dark:border-gray-700">
                                   <Dialog>
                                       <DialogTrigger asChild>
                                           <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="w-full rounded-xl text-[10px] font-black uppercase tracking-tighter h-10 flex gap-2"
                                            >
                                               <QrCode size={14} className="text-blue-600" /> Digital Menu QR
                                           </Button>
                                       </DialogTrigger>
                                       <DialogContent className="rounded-[40px] max-w-sm text-center">
                                           <DialogHeader>
                                               <DialogTitle className="text-2xl font-black mb-2">Table {table.number} QR</DialogTitle>
                                               <DialogDescription className="font-bold text-blue-600 uppercase tracking-widest text-[10px]">Guest Self-Ordering Token</DialogDescription>
                                           </DialogHeader>
                                           <div className="flex flex-col items-center justify-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-[40px] border-2 border-dashed border-blue-100 dark:border-blue-900/30 mx-6">
                                               <img 
                                                   src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.origin}/self-order/${table._id}`} 
                                                   alt="Table QR" 
                                                   className="w-48 h-48 rounded-2xl shadow-xl border-4 border-white"
                                               />
                                               <p className="mt-6 text-[9px] font-black text-gray-400 max-w-[200px]">
                                                   Scan this code at the table to browse the digital menu and place orders directly to the kitchen.
                                               </p>
                                           </div>
                                           <DialogFooter className="sm:justify-center mt-4">
                                               <Button 
                                                   className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 w-full mx-6 h-12"
                                                   onClick={() => {
                                                       window.open(`${window.location.origin}/self-order/${table._id}`, '_blank');
                                                   }}
                                               >
                                                   Preview Digital Menu
                                               </Button>
                                           </DialogFooter>
                                       </DialogContent>
                                   </Dialog>
                               </div>

                               <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    onClick={() => handleDeleteTable(table._id)}
                                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 shadow-xl transition-opacity animate-in zoom-in"
                                >
                                    <Trash2 size={12} />
                               </Button>
                           </div>
                        ))
                    )
                    }
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
