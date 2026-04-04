import { useState } from "react";
import { useDispatch } from "react-redux";
import { addItem } from "@/store/cartSlice";
import { ShoppingCart } from "lucide-react";
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

const GREEN = "#1A2E1A";
const GREEN_MID = "#2C4A2C";
const GREEN_CARD = "#243524";
const CREAM = "#F5F0E8";
const YELLOW = "#F5B400";

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
    toast.success(`${product.name} added!`);
  };

  const isAvailable = product.available ?? true;

  return (
    <div
      className="relative flex flex-col border-2 group transition-all duration-200 hover:-translate-y-1"
      style={{
        background: GREEN_CARD,
        borderColor: `${YELLOW}25`,
        boxShadow: `4px 4px 0px 0px ${GREEN}`,
        opacity: !isAvailable ? 0.5 : 1,
        pointerEvents: !isAvailable ? "none" : "auto",
      }}
    >
      {/* Closed overlay */}
      {disabled && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center font-black uppercase tracking-widest text-xs"
          style={{ background: "rgba(0,0,0,0.65)", color: YELLOW }}
        >
          CLOSED
        </div>
      )}

      {/* Status strip */}
      <div
        className="h-1 w-full"
        style={{ background: isAvailable ? YELLOW : "#c0392b" }}
      />

      {/* Image */}
      <div className="w-full h-36 overflow-hidden relative" style={{ background: GREEN_MID }}>
        {product.imageUrl ? (
          <img
            loading="lazy"
            src={product.imageUrl}
            alt={product?.name ?? "product"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-black text-3xl uppercase tracking-tightest" style={{ color: `${CREAM}15` }}>
              {(product.name || "??").slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        {/* Not available badge */}
        {!isAvailable && (
          <div
            className="absolute inset-0 flex items-center justify-center font-black uppercase text-xs tracking-widest"
            style={{ background: "rgba(0,0,0,0.6)", color: CREAM }}
          >
            NOT AVAILABLE
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-3 flex-1">
        <div className="flex justify-between items-start">
          <span className="font-black text-sm uppercase tracking-tight line-clamp-1" style={{ color: CREAM }}>
            {product?.name || "Loading.."}
          </span>
          <span className="font-black text-sm ml-2 shrink-0" style={{ color: YELLOW }}>
            ₹{(product.basePrice || 0).toFixed(0)}
          </span>
        </div>

        {/* Variant Selector */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedVariantIdx(null)}
            className="text-[9px] font-black uppercase px-2 py-1 border transition-all"
            style={
              selectedVariantIdx === null
                ? { background: YELLOW, color: GREEN, borderColor: YELLOW }
                : { background: "transparent", color: `${CREAM}80`, borderColor: `${CREAM}20` }
            }
          >
            Default — ₹{(product.basePrice || 0).toFixed(0)}
          </button>
          {product.variants?.map((v, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedVariantIdx(idx)}
              className="text-[9px] font-black uppercase px-2 py-1 border transition-all"
              style={
                selectedVariantIdx === idx
                  ? { background: YELLOW, color: GREEN, borderColor: YELLOW }
                  : { background: "transparent", color: `${CREAM}80`, borderColor: `${CREAM}20` }
              }
            >
              {v.value} — ₹{Number(v.price).toFixed(0)}
            </button>
          ))}
        </div>

        {/* Add to Order */}
        <button
          onClick={handleAdd}
          className="w-full h-10 font-black uppercase text-xs tracking-widest border-2 flex items-center justify-center gap-2 transition-all hover:opacity-85 mt-auto"
          style={{ background: YELLOW, color: GREEN, borderColor: YELLOW }}
        >
          <ShoppingCart size={14} /> Add to Order
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
