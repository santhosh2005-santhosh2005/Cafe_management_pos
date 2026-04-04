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

const Categories = ({
  categories,
  activeCategory,
  setActiveCategory,
  catLoading,
}: CategoriesProps) => {
  return (
    <div className="w-full mb-8">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {/* ALL/COLLECTION button */}
          <button
            onClick={() => setActiveCategory(null)}
            className={`h-12 px-8 font-heading italic text-sm tracking-widest border-4 transition-all duration-75 uppercase flex-shrink-0 shadow-[4px_4px_0px_0px_#000] active:scale-[0.98] ${
              activeCategory === null
                ? "bg-golden-yellow text-deep-black border-deep-black"
                : "bg-white text-deep-black border-deep-black hover:bg-warm-white"
            }`}
          >
            THE_ALL
          </button>

          {catLoading
            ? Array(5)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="h-12 w-32 flex-shrink-0 animate-pulse bg-deep-black/10 border-4 border-deep-black"
                  />
                ))
            : categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategory(cat._id)}
                  className={`h-12 px-8 font-heading italic text-sm tracking-widest border-4 transition-all duration-75 uppercase flex-shrink-0 shadow-[4px_4px_0px_0px_#000] active:scale-[0.98] ${
                    activeCategory === cat._id
                      ? "bg-golden-yellow text-deep-black border-deep-black"
                      : "bg-white text-deep-black border-deep-black hover:bg-warm-white"
                  }`}
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
