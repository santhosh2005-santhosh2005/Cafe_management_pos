import { useState } from "react";
import { useDispatch } from "react-redux";
import { addItem } from "@/store/cartSlice";
import { ShoppingCart, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import BrutalistButton from "./BrutalistButton";

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

  const handleAdd = () => {
    let finalPrice = product.basePrice || 0;
    let sizeLabel = "Regular";

    if (selectedVariantIdx !== null && product.variants && product.variants[selectedVariantIdx]) {
      const v = product.variants[selectedVariantIdx];
      finalPrice = v.price;
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
    toast.success(`${product.name.toUpperCase()} ADDED_TO_MANIFEST`, {
       style: {
         borderRadius: '0px',
         background: '#0A0A0A',
         color: '#C6FF00',
         border: '2px solid #C6FF00',
         fontFamily: 'JetBrains Mono'
       }
    });
  };

  const isAvailable = product.available ?? true;
  const currentPrice = selectedVariantIdx !== null && product.variants 
    ? product.variants[selectedVariantIdx].price 
    : (product.basePrice || 0);

  return (
    <div
      className={`relative flex flex-col brutalist-card bg-white p-0 group overflow-hidden transition-all duration-200 ${
        !isAvailable ? "opacity-40 grayscale pointer-events-none" : "hover:-translate-y-2"
      }`}
    >
      {/* Availability Overlay */}
      {!isAvailable && (
        <div className="absolute inset-0 z-20 bg-deep-black/60 flex items-center justify-center rotate-12">
           <span className="bg-white text-deep-black font-heading px-8 py-2 text-2xl border-4 border-deep-black shadow-[8px_8px_0_0_#F5B400]">
              OUT_OF_SYNC
           </span>
        </div>
      )}

      {/* Image Container */}
      <div className="relative w-full aspect-square bg-warm-white border-b-4 border-deep-black overflow-hidden bg-dot-grid">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-deep-black text-white">
            <span className="font-heading text-6xl opacity-20 italic">{(product.name || "??").slice(0, 2)}</span>
          </div>
        )}
        
        {/* Price Badge */}
        <div className="absolute top-4 right-4 bg-golden-yellow border-2 border-deep-black px-4 py-1 font-heading italic text-xl shadow-[4px_4px_0px_0px_#000]">
           ₹{currentPrice}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col gap-6 flex-1">
        <div className="space-y-1">
           <p className="system-status opacity-40">[ ID_{product._id?.slice(-4).toUpperCase()} ]</p>
           <h3 className="text-3xl font-heading leading-tight italic uppercase">{product.name}</h3>
        </div>

        {/* Variant Selector */}
        {(product.variants && product.variants.length > 0) && (
           <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedVariantIdx(null)}
                className={`px-3 py-1 font-mono text-[10px] border-2 transition-all ${
                  selectedVariantIdx === null 
                  ? 'bg-deep-black text-white border-deep-black' 
                  : 'bg-white text-deep-black border-deep-black hover:bg-warm-white'
                }`}
              >
                STD_UNIT
              </button>
              {product.variants.map((v, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedVariantIdx(idx)}
                  className={`px-3 py-1 font-mono text-[10px] border-2 transition-all ${
                    selectedVariantIdx === idx 
                    ? 'bg-deep-black text-white border-deep-black' 
                    : 'bg-white text-deep-black border-deep-black hover:bg-warm-white'
                  }`}
                >
                  {v.value.toUpperCase()}
                </button>
              ))}
           </div>
        )}

        {/* Action Button */}
        <BrutalistButton 
          onClick={handleAdd}
          variant="primary"
          className="w-full mt-auto"
        >
          <div className="flex items-center justify-center gap-3">
             <Plus size={20} strokeWidth={3} />
             <span>ADD_TO_MANIFEST</span>
          </div>
        </BrutalistButton>
      </div>
    </div>
  );
};

export default ProductCard;
