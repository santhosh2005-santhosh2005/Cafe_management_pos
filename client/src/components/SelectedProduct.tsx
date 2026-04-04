import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { addItem } from "@/store/cartSlice";
import { ShoppingCart } from "lucide-react";
import { Badge } from "./ui/badge";
import { toast } from "react-hot-toast";

type Variant = {
  attribute: string;
  value: string;
  price: number;
};

type Product = {
  _id?: string;
  name?: string;
  imageUrl?: string;
  available?: boolean;
  basePrice?: number;
  variants?: Variant[];
};

type ProductCardProps = {
  product: Product;
  disabled?: boolean;
};

const ProductCard = ({ product, disabled = false }: ProductCardProps) => {
  const dispatch = useDispatch();
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null);
  const [useBaseOnly, setUseBaseOnly] = useState<boolean>(false);

  const handleAdd = () => {
    let finalPrice = product.basePrice || 0;
    let sizeLabel = "Regular";

    if (selectedVariantIdx !== null && product.variants && product.variants[selectedVariantIdx]) {
        const v = product.variants[selectedVariantIdx];
        finalPrice = v.price; // Odoo variants usually store the full price or markup; here we treat as full price/override
        sizeLabel = `${v.attribute}: ${v.value}`;
    }

    dispatch(
      addItem({
        productId: product._id!,
        name: product.name!,
        size: sizeLabel,
        price: Number(finalPrice),
        imageUrl: product.imageUrl,
        quantity: 1,
      })
    );
    toast.success(`${product.name} added!`);
  };

  const isAvailable = product.available ?? true;

  return (
    <div className="relative">
      <Card
        className={`w-full flex flex-col items-center p-3 rounded-xl shadow-md
          hover:shadow-xl transition transform hover:-translate-y-1
          bg-white dark:bg-gray-800 group relative
          ${!isAvailable ? "filter grayscale pointer-events-none" : ""}`}
      >
        {disabled && (
          <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center text-white font-bold text-center z-10">
            Closed
          </div>
        )}

        {/* Product image */}
        <div className="w-full h-32 sm:h-36 md:h-40 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4 overflow-hidden relative">
          <img
            loading="lazy"
            src={product?.imageUrl || "/placeholder-coffee.png"}
            alt={product?.name ?? "product"}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Name & Pricing */}
        <CardContent className="w-full flex flex-col px-0 py-2">
          <div className="flex justify-between items-start mb-1">
            <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 line-clamp-1">
                {product?.name || "Loading.."}
            </span>
            <span className="text-blue-600 font-bold text-sm">
                ${(product.basePrice || 0).toFixed(2)}
            </span>
          </div>

          {/* Variants / Sizes Selection */}
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {/* If there are no variants, or if we want to allow picking the base product */}
            <Badge
                variant={selectedVariantIdx === null ? "default" : "secondary"}
                className="p-1 px-2 h-auto text-[10px] cursor-pointer"
                onClick={() => setSelectedVariantIdx(null)}
            >
                Default - ${(product.basePrice || 0).toFixed(2)}
            </Badge>

            {product.variants && product.variants.map((v, idx) => (
                <Badge
                key={idx}
                variant={selectedVariantIdx === idx ? "default" : "secondary"}
                className={`p-1 px-2 h-auto text-[10px] cursor-pointer transition-all ${selectedVariantIdx === idx ? 'scale-105 shadow-sm' : ''}`}
                onClick={() => setSelectedVariantIdx(idx)}
                >
                {v.value} - ${Number(v.price).toFixed(2)}
                </Badge>
            ))}
          </div>

          {/* Add to cart */}
          <Button
            onClick={handleAdd}
            className="mt-4 w-full rounded-xl shadow-lg h-10 font-bold text-xs flex gap-2"
          >
            <ShoppingCart size={14} /> Add to Order
          </Button>
        </CardContent>

        {!isAvailable && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-sm font-semibold rounded-xl z-20">
            Not Available
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProductCard;
