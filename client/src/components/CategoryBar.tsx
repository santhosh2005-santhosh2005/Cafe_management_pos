import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type Category = {
  _id: string;
  name: string;
  items?: any[];
};

type CategoriesProps = {
  categories: Category[];
  activeCategory: string | null;
  setActiveCategory: (id: string | null) => void;
  catLoading: boolean;
};

const GREEN = "#1A2E1A";
const CREAM = "#F5F0E8";
const YELLOW = "#F5B400";
const GREEN_MID = "#2C4A2C";

const Categories = ({
  categories,
  activeCategory,
  setActiveCategory,
  catLoading,
}: CategoriesProps) => {
  return (
    <div className="w-full mb-5">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-3 flex-wrap sm:flex-nowrap">
          {/* ALL button */}
          <button
            onClick={() => setActiveCategory(null)}
            className="h-9 px-5 font-black uppercase text-xs tracking-widest border-2 transition-all flex-shrink-0"
            style={
              activeCategory === null
                ? { background: YELLOW, color: GREEN, borderColor: YELLOW }
                : { background: "transparent", color: CREAM, borderColor: `${CREAM}30` }
            }
          >
            ALL
          </button>

          {catLoading
            ? Array(5)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-24 flex-shrink-0 animate-pulse"
                  style={{ background: `${GREEN_MID}`, border: `2px solid ${YELLOW}20` }}
                />
              ))
            : categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setActiveCategory(cat._id)}
                className="h-9 px-5 font-black uppercase text-xs tracking-widest border-2 transition-all flex-shrink-0"
                style={
                  activeCategory === cat._id
                    ? { background: YELLOW, color: GREEN, borderColor: YELLOW }
                    : { background: "transparent", color: CREAM, borderColor: `${CREAM}30` }
                }
              >
                {cat?.name || "N/A"}
              </button>
            ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden md:flex" />
      </ScrollArea>
    </div>
  );
};

export default Categories;
