import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from "@/services/SettingsApi";
import { useGetActiveSessionQuery, useGetSessionsQuery, useOpenSessionMutation } from "@/services/sessionApi";
import { useNavigate } from "react-router";
import { PlayCircle, Clock, Wallet, CheckCircle2, ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const weekdays = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];
const currencies = [
  "BDT",
  "USD",
  "EUR",
  "GBP",
  "INR",
  "AUD",
  "CAD",
  "JPY",
  "SGD",
  "CHF",
  "CNY",
  "HKD",
];

export const SettingManagement = () => {
  const { data: settings, isLoading } = useGetSettingsQuery({});
  const [updateSettings, { isLoading: isUpdating }] =
    useUpdateSettingsMutation();

  const [isEditMode, setIsEditMode] = useState(false);

  const [form, setForm] = useState({
    taxRate: 0,
    discountRate: 0,
    currency: "BDT",
    serviceCharge: 0,
    businessName: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    receiptFooter: "",
    enableDiscountInput: true,
    enableTaxOverride: false,
    allowNegativeStock: false,
    openingTime: "09:00",
    closingTime: "23:00",
    offDays: [] as string[],
    lowStockAlertLevel: 5,
    salesTarget: 10000,
    allowCash: true,
    allowDigital: true,
    allowUPI: true,
    upiId: "",
    razorpayKeyId: "",
  });

 

  useEffect(() => {
    if (settings?.data) {
      setForm({
        taxRate: settings.data.taxRate,
        discountRate: settings.data.discountRate,
        currency: settings.data.currency,
        serviceCharge: settings.data.serviceCharge || 0,
        businessName: settings.data.businessName,
        address: settings.data.address,
        phone: settings.data.phone,
        email: settings.data.email || "",
        website: settings.data.website || "",
        receiptFooter: settings.data.receiptFooter || "",
        enableDiscountInput: settings.data.enableDiscountInput,
        enableTaxOverride: settings.data.enableTaxOverride,
        allowNegativeStock: settings.data.allowNegativeStock,
        openingTime: settings.data.openingTime,
        closingTime: settings.data.closingTime,
        offDays: settings.data.offDays || weekdays, // select all by default
        lowStockAlertLevel: settings.data.lowStockAlertLevel || 5,
        salesTarget: settings.data.salesTarget || 10000,
        allowCash: settings.data.allowCash ?? true,
        allowDigital: settings.data.allowDigital ?? true,
        allowUPI: settings.data.allowUPI ?? true,
        upiId: settings.data.upiId || "",
        razorpayKeyId: settings.data.razorpayKeyId || "",
      });
    }
  }, [settings]);

  const handleChange = (key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleOffDay = (day: string) => {
    handleChange(
      "offDays",
      form.offDays.includes(day)
        ? form.offDays.filter((d) => d !== day)
        : [...form.offDays, day]
    );
  };

  const handleSave = async () => {
    try {
      await updateSettings({ ...form }).unwrap();
      toast.success("Settings updated successfully!");
      setIsEditMode(false);
    } catch (err) {
      toast.error("Failed to update settings!");
      console.error(err);
    }
  };

  if (isLoading) return <div>Loading settings...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <Card className="space-y-6">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Business Settings</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? "Cancel Edit" : "Edit"}
          </Button>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Financial Settings */}
          <Section title="Financial Settings">
            <InputField
              label="Tax Rate (%)"
              value={form.taxRate}
              onChange={(val) => handleChange("taxRate", Number(val))}
              type="number"
              disabled={!isEditMode}
            />
            <InputField
              label="Discount Rate (%)"
              value={form.discountRate}
              onChange={(val) => handleChange("discountRate", Number(val))}
              type="number"
              disabled={!isEditMode}
            />
            <SelectField
              label="Currency"
              value={form.currency}
              options={currencies}
              onChange={(val) => handleChange("currency", val)}
              disabled={!isEditMode}
            />
            <InputField
              label="Service Charge (%)"
              value={form.serviceCharge}
              onChange={(val) => handleChange("serviceCharge", Number(val))}
              type="number"
              disabled={!isEditMode}
            />
          </Section>

          {/* Business Info */}
          <Section title="Business Info">
            <InputField
              label="Business Name"
              value={form.businessName}
              onChange={(val) => handleChange("businessName", val)}
              disabled={!isEditMode}
            />
            <InputField
              label="Address"
              value={form.address}
              onChange={(val) => handleChange("address", val)}
              disabled={!isEditMode}
            />
            <InputField
              label="Phone"
              value={form.phone}
              onChange={(val) => handleChange("phone", val)}
              disabled={!isEditMode}
            />
            <InputField
              label="Email"
              value={form.email}
              onChange={(val) => handleChange("email", val)}
              disabled={!isEditMode}
            />
            <InputField
              label="Website"
              value={form.website}
              onChange={(val) => handleChange("website", val)}
              disabled={!isEditMode}
            />
            <InputField
              label="Receipt Footer"
              value={form.receiptFooter}
              onChange={(val) => handleChange("receiptFooter", val)}
              disabled={!isEditMode}
            />
          </Section>

          {/* POS Behavior */}
          <Section title="POS Behavior">
            EnableDiscountInput
            <CheckboxField
              label="Enable Discount Input"
              checked={form.enableDiscountInput}
              onChange={(val) => handleChange("enableDiscountInput", val)}
              disabled={!isEditMode}
            />
            enableTaxOverride
            <CheckboxField
              label="Enable Tax Override"
              checked={form.enableTaxOverride}
              onChange={(val) => handleChange("enableTaxOverride", val)}
              disabled={!isEditMode}
            />
            allowNegativeStock
            <CheckboxField
              label="Allow Negative Stock"
              checked={form.allowNegativeStock}
              onChange={(val) => handleChange("allowNegativeStock", val)}
              disabled={!isEditMode}
            />
          </Section>

          {/* Payment Methods */}
          <Section title="Payment Methods">
            <div className="flex flex-col gap-4">
              <CheckboxField
                label="Allow Cash Payment"
                checked={form.allowCash}
                onChange={(val) => handleChange("allowCash", val)}
                disabled={!isEditMode}
              />
              <CheckboxField
                label="Allow Digital (Card/Bank)"
                checked={form.allowDigital}
                onChange={(val) => handleChange("allowDigital", val)}
                disabled={!isEditMode}
              />
              <CheckboxField
                label="Allow QR Payment (UPI)"
                checked={form.allowUPI}
                onChange={(val) => handleChange("allowUPI", val)}
                disabled={!isEditMode}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">UPI ID (VPA)</Label>
                <Input
                  value={form.upiId}
                  onChange={(e) => handleChange("upiId", e.target.value)}
                  disabled={!isEditMode}
                  placeholder="e.g. 123@ybl"
                  className="rounded-xl border-gray-200 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Razorpay Test Key ID</Label>
                <div className="relative">
                  <Input
                    value={form.razorpayKeyId}
                    onChange={(e) => handleChange("razorpayKeyId", e.target.value)}
                    disabled={!isEditMode}
                    placeholder="rzp_test_..."
                    className="rounded-xl border-gray-200 pr-10 focus:ring-blue-500"
                  />
                  <div className={`absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${form.razorpayKeyId ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-300'}`}></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Get your key from razorpay.com dashboard</p>
              </div>
            </div>
          </Section>

          {/* Timing & Off Days */}
          <Section title="Business Hours & Off Days">
            <InputField
              label="Opening Time"
              value={form.openingTime}
              onChange={(val) => handleChange("openingTime", val)}
              type="time"
              disabled={!isEditMode}
            />
            <InputField
              label="Closing Time"
              value={form.closingTime}
              onChange={(val) => handleChange("closingTime", val)}
              type="time"
              disabled={!isEditMode}
            />
            <div className="md:col-span-2">
              <Label>Off Days</Label>
              <div className="flex flex-wrap gap-3 mt-1">
                {weekdays.map((day) => (
                  <div className="flex flex-row items-center gap-1 flex-wrap">
                    <Checkbox
                      key={day}
                      checked={form.offDays.includes(day)}
                      disabled={!isEditMode}
                      onCheckedChange={() => toggleOffDay(day)}
                    ></Checkbox>
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Reports */}
          <Section title="Reports">
            <InputField
              label="Low Stock Alert Level"
              value={form.lowStockAlertLevel}
              onChange={(val) =>
                handleChange("lowStockAlertLevel", Number(val))
              }
              type="number"
              disabled={!isEditMode}
            />
            <InputField
              label="Sales Target"
              value={form.salesTarget}
              onChange={(val) => handleChange("salesTarget", Number(val))}
              type="number"
              disabled={!isEditMode}
            />
          </Section>

          {/* POS Terminal Setup */}
          <POSTerminalSetup />
        </CardContent>

        {isEditMode && (
          <>
            <Separator />
            <div className="p-4 flex justify-end">
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSave}
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

// --- Reusable Components ---
interface InputFieldProps {
  label: string;
  value: any;
  onChange: (val: any) => void;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
}
const InputField = ({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  placeholder = "",
}: InputFieldProps) => (
  <div className="flex flex-col gap-1">
    <Label>{label}</Label>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
    />
  </div>
);

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}
const CheckboxField = ({
  label,
  checked,
  onChange,
  disabled = false,
}: CheckboxFieldProps) => (
  <Checkbox
    checked={checked}
    disabled={disabled}
    onCheckedChange={(val) => onChange(Boolean(val))}
  >
    {label}
  </Checkbox>
);

interface SelectFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  disabled?: boolean;
}
const SelectField = ({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: SelectFieldProps) => (
  <div className="flex flex-col gap-1">
    <Label>{label}</Label>
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Select a value" />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

interface SectionProps {
  title: string;
  children: React.ReactNode;
}
const Section = ({ title, children }: SectionProps) => (
  <div className="md:col-span-2 space-y-3">
    <h3 className="text-lg font-semibold">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  </div>
);

const POSTerminalSetup = () => {
  const navigate = useNavigate();
  const { data: activeData, isLoading: activeLoading } = useGetActiveSessionQuery();
  const { data: historyData, isLoading: historyLoading } = useGetSessionsQuery();
  const [openSession] = useOpenSessionMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [startingBalance, setStartingBalance] = useState(0);

  const activeSession = activeData?.session;
  const lastSession = historyData?.data?.[0]; // Get the last session from history

  const handleOpenTerminal = async () => {
    try {
      await openSession({ startingBalance }).unwrap();
      setIsDialogOpen(false);
      toast.success("POS Terminal Authorized");
      navigate("/dashboard/pos/terminal");
    } catch (err) {
      toast.error("Failed to open POS Terminal");
    }
  };

  if (activeLoading || historyLoading) return <div className="p-4 text-xs font-bold animate-pulse">Syncing Terminal State...</div>;

  return (
    <Section title="POS Terminal Setup">
       <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl border dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${activeSession ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                        {activeSession ? "Terminal Live Stage" : "Terminal Locked"}
                    </span>
                </div>

                <div className="flex gap-8">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Last Open Session</p>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                             <Clock size={12} className="text-blue-500" />
                             {lastSession ? new Date(lastSession.startTime).toLocaleString() : "No history"}
                        </div>
                     </div>
                     <div className="space-y-1 border-l pl-8 dark:border-gray-700">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Last Closing Sale</p>
                        <div className="flex items-center gap-1.5 text-xs font-black text-green-600">
                             <Wallet size={12} />
                             ₹{lastSession ? (lastSession.totalSales || 0).toFixed(2) : "0.00"}
                        </div>
                     </div>
                </div>
           </div>

           <div className="flex gap-3">
                {activeSession ? (
                    <Button 
                        onClick={() => navigate("/dashboard/pos/terminal")}
                        className="rounded-2xl bg-green-600 hover:bg-green-700 h-14 px-8 font-black shadow-lg shadow-green-500/10 flex gap-2"
                    >
                        <ShoppingCart size={18} /> Continue Sale
                    </Button>
                ) : (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-2xl bg-blue-600 hover:bg-blue-700 h-14 px-8 font-black shadow-lg shadow-blue-500/20 flex gap-2">
                                <PlayCircle size={20} /> Open Session
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[40px] border-none dark:bg-gray-900 shadow-2xl p-8">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black">Open POS Terminal</DialogTitle>
                                <DialogDescription className="font-bold text-gray-400">Initialize the daily cash drawer for this terminal.</DialogDescription>
                            </DialogHeader>
                            <div className="py-6 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase font-black text-gray-500">Starting Balance (INR ₹)</Label>
                                    <Input 
                                        type="number" 
                                        value={startingBalance} 
                                        onChange={(e) => setStartingBalance(parseFloat(e.target.value) || 0)}
                                        className="h-16 text-2xl font-black rounded-2xl bg-gray-50 dark:bg-gray-800 border-none px-6"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleOpenTerminal} className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-lg">
                                    Start Operational Session
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
           </div>
       </div>
    </Section>
  );
};
