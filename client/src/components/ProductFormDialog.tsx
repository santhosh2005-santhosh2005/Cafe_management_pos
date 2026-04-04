import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetCategoriesQuery } from "@/services/categoryApi";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Plus, Trash2 } from "lucide-react";

interface ProductFormDialogProps {
  isFormDialogOpen: boolean;
  setIsFormDialogOpen: (open: boolean) => void;
  formData: any;
  setFormData: (data: any) => void;
  handleSubmit: () => void;
  editId: string | null;
  resetForm: () => void;
}

export function ProductFormDialog({
  isFormDialogOpen,
  setIsFormDialogOpen,
  formData,
  setFormData,
  handleSubmit,
  editId,
  resetForm,
}: ProductFormDialogProps) {
  const { data: categories } = useGetCategoriesQuery();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsFormDialogOpen(open);
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...(formData.variants || []), { attribute: "Size", value: "", price: 0 }]
    });
  };

  const removeVariant = (index: number) => {
    const newVariants = [...formData.variants];
    newVariants.splice(index, 1);
    setFormData({ ...formData, variants: newVariants });
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  return (
    <AlertDialog open={isFormDialogOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" onClick={resetForm} className="mb-4">
          Add Odoo Product
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-2xl dark:bg-gray-800 dark:text-white max-h-[90vh] overflow-y-auto">
        <Button
          variant="ghost"
          onClick={() => setIsFormDialogOpen(false)}
          className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white p-1 rounded-full"
        >
          ✕
        </Button>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {editId ? "Edit Odoo Product" : "Add Odoo Product"}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(val) =>
                  setFormData({ ...formData, category: val })
                }
              >
                <SelectTrigger
                  id="category"
                  className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                  {categories?.map((cat: any) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="basePrice">Base Price</Label>
              <Input
                id="basePrice"
                type="number"
                value={formData.basePrice}
                onChange={(e) =>
                  setFormData({ ...formData, basePrice: e.target.value })
                }
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit of Measure</Label>
              <Select
                value={formData.unit}
                onValueChange={(val) =>
                  setFormData({ ...formData, unit: val })
                }
              >
                <SelectTrigger className="dark:bg-gray-700">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">Pcs</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="taxRate">Tax (%)</Label>
              <Input
                id="taxRate"
                type="number"
                value={formData.taxRate}
                onChange={(e) =>
                  setFormData({ ...formData, taxRate: e.target.value })
                }
                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Product Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <div className="border-t pt-4 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
                <Label className="text-blue-600 dark:text-blue-400 font-bold">Product Variants & Attributes</Label>
                <Button variant="outline" size="sm" onClick={addVariant} type="button" className="flex gap-1 h-8">
                    <Plus className="w-4 h-4" /> Add Variant
                </Button>
            </div>
            {formData.variants?.map((v: any, index: number) => (
                <div key={index} className="flex gap-2 mb-2 items-end bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border dark:border-gray-700">
                    <div className="flex-1">
                        <Label className="text-[10px]">Attribute</Label>
                        <Input 
                            placeholder="e.g. Size/Pack" 
                            value={v.attribute} 
                            onChange={(e) => updateVariant(index, 'attribute', e.target.value)}
                            className="h-9 text-sm"
                        />
                    </div>
                    <div className="flex-1">
                        <Label className="text-[10px]">Value</Label>
                        <Input 
                            placeholder="e.g. Small / 6 Items" 
                            value={v.value} 
                            onChange={(e) => updateVariant(index, 'value', e.target.value)}
                            className="h-9 text-sm"
                        />
                    </div>
                    <div className="w-24">
                        <Label className="text-[10px]">Extra Price</Label>
                        <Input 
                            type="number" 
                            placeholder="+0" 
                            value={v.price} 
                            onChange={(e) => updateVariant(index, 'price', e.target.value)}
                            className="h-9 text-sm"
                        />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeVariant(index)} className="text-red-500 h-9 w-9">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            ))}
          </div>

          <div>
              <Label htmlFor="image">Product Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setFormData({
                    ...formData,
                    imageFile: file,
                    imageUrl: URL.createObjectURL(file),
                  });
                }}
              />
          </div>

          <Button
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSubmit}
          >
            {editId ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
