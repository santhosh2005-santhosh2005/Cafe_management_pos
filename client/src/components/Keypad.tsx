import React from "react";
import { Delete, Minus, Plus } from "lucide-react";

const G_DARK = "#1A2E1A";
const G_MID = "#2C4A2C";
const CREAM = "#F5F0E8";
const YELLOW = "#F5B400";

interface KeypadProps {
  onNumber: (n: string) => void;
  onBackspace: () => void;
  onToggleSign: () => void;
  onModeChange: (mode: "qty" | "disc" | "price") => void;
  activeMode: "qty" | "disc" | "price";
}

const Keypad: React.FC<KeypadProps> = ({
  onNumber,
  onBackspace,
  onToggleSign,
  onModeChange,
  activeMode,
}) => {
  const buttons = [
    { label: "1", type: "number" },
    { label: "2", type: "number" },
    { label: "3", type: "number" },
    { label: "4", type: "number" },
    { label: "Prices", type: "mode", id: "price" },
    { label: "5", type: "number" },
    { label: "6", type: "number" },
    { label: "7", type: "number" },
    { label: "8", type: "number" },
    { label: "Disc.", type: "mode", id: "disc" },
    { label: "9", type: "number" },
    { label: "0", type: "number" },
    { label: ".", type: "number" },
    { label: "+/-", type: "toggle" },
    { label: "Qty", type: "mode", id: "qty" },
    { label: "X", type: "backspace" },
  ];

  const buttonStyle = {
    background: `${CREAM}15`,
    color: CREAM,
    borderColor: `${YELLOW}25`,
  };

  const activeButtonStyle = {
    background: YELLOW,
    color: G_DARK,
    borderColor: YELLOW,
  };

  const specialButtonStyle = (type: string) => {
    if (type === "toggle") return { background: "#60a5fa", borderColor: "#60a5fa", color: "white" }; // Blue
    if (type === "backspace") return { background: "#ef4444", borderColor: "#ef4444", color: "white" }; // Red
    return {};
  };

  return (
    <div className="flex flex-col gap-2 p-3 border-t-2" style={{ borderColor: `${YELLOW}28` }}>
      {/* Top Buttons */}
      <div className="flex gap-2 mb-1">
        <button
          className="flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all"
          style={{ ...buttonStyle, background: `${CREAM}10` }}
        >
          Customer
        </button>
        <button
          className="flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all"
          style={{ ...buttonStyle, background: `${YELLOW}20`, borderColor: YELLOW, color: YELLOW }}
        >
          Notes
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-5 gap-1.5">
        {buttons.map((btn, idx) => {
          const isActive = btn.type === "mode" && activeMode === btn.id;
          const isSpecial = btn.type === "toggle" || btn.type === "backspace";

          return (
            <button
              key={idx}
              onClick={() => {
                if (btn.type === "number") onNumber(btn.label);
                if (btn.type === "mode") onModeChange(btn.id as any);
                if (btn.type === "toggle") onToggleSign();
                if (btn.type === "backspace") onBackspace();
              }}
              className="h-10 flex items-center justify-center font-black text-xs border transition-all hover:opacity-80 active:scale-95"
              style={{
                ...buttonStyle,
                ...(isActive ? activeButtonStyle : {}),
                ...(isSpecial ? specialButtonStyle(btn.type) : {}),
                gridColumn: btn.type === "mode" ? "5" : "auto",
                gridRow: btn.type === "backspace" ? "4" : "auto",
                gridColumnStart: btn.type === "backspace" ? "1" : "auto",
                gridColumnEnd: btn.type === "backspace" ? "5" : "auto",
              }}
            >
              {btn.type === "backspace" ? <Delete className="w-4 h-4" /> : btn.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Keypad;
