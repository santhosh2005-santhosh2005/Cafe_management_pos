/**
 * ============================================================
 * SMART ORDER PRIORITY ENGINE
 * ============================================================
 *
 * SCORE FORMULA  (max ≈ 100 points)
 * ─────────────────────────────────
 *  Waiting Time : +2 pts per minute elapsed since order created (capped at 60)
 *  Complexity   : +3 pts per active (non-unavailable) item       (capped at 30)
 *  Status Boost : "pending" orders get +10 extra pts vs "preparing"
 *                 (pending = kitchen hasn't touched it yet → more urgent)
 *
 * PRIORITY LEVELS
 * ─────────────────────────────────
 *  score >= 60 → "high"   🔴
 *  score >= 30 → "medium" 🟡
 *  score <  30 → "low"    🟢
 *
 * HOW TO MODIFY PRIORITY RULES
 * ─────────────────────────────────
 *  • Change waiting time weight → adjust WEIGHT_TIME_PER_MINUTE
 *  • Change complexity weight   → adjust WEIGHT_PER_ITEM
 *  • Change level thresholds    → adjust HIGH_THRESHOLD / MEDIUM_THRESHOLD
 *  • Add a new factor           → add its calculation below and sum it in
 *    the final score before capping.
 * ============================================================
 */

// ── Tunable constants ──────────────────────────────────────────────────────
const WEIGHT_TIME_PER_MINUTE = 2;   // Points per minute waiting
const WEIGHT_PER_ITEM        = 3;   // Points per active item (complexity)
const STATUS_PENDING_BOOST   = 10;  // Extra points if status is still "pending"
const MAX_TIME_SCORE         = 60;  // Cap on time component
const MAX_ITEM_SCORE         = 30;  // Cap on complexity component

const HIGH_THRESHOLD   = 60;
const MEDIUM_THRESHOLD = 30;
// ──────────────────────────────────────────────────────────────────────────

export interface PriorityResult {
  priorityScore: number;
  priorityLevel: "high" | "medium" | "low";
}

/**
 * Compute priority score & level for a single order.
 *
 * @param order - Mongoose order document (or plain object with same shape)
 */
export function computePriority(order: {
  createdAt: Date;
  status: string;
  items: { itemStatus?: string }[];
}): PriorityResult {
  const now = new Date();

  // 1. Waiting time in minutes
  const waitMinutes = (now.getTime() - new Date(order.createdAt).getTime()) / 60_000;
  const timeScore = Math.min(waitMinutes * WEIGHT_TIME_PER_MINUTE, MAX_TIME_SCORE);

  // 2. Complexity — count only active (non-unavailable) items
  const activeItems = order.items.filter(
    (i) => (i.itemStatus || "pending") !== "unavailable"
  );
  const itemScore = Math.min(activeItems.length * WEIGHT_PER_ITEM, MAX_ITEM_SCORE);

  // 3. Status boost — "pending" is more urgent (kitchen hasn't started)
  const statusBoost = order.status === "pending" ? STATUS_PENDING_BOOST : 0;

  // 4. Final score (rounded, max 100)
  const rawScore = timeScore + itemScore + statusBoost;
  const priorityScore = Math.min(Math.round(rawScore), 100);

  // 5. Map score → level
  let priorityLevel: "high" | "medium" | "low" = "low";
  if (priorityScore >= HIGH_THRESHOLD)   priorityLevel = "high";
  else if (priorityScore >= MEDIUM_THRESHOLD) priorityLevel = "medium";

  return { priorityScore, priorityLevel };
}

/**
 * Apply priority to a Mongoose order doc in-place.
 * Call this before order.save() to keep DB in sync.
 */
export function applyPriority(order: any): void {
  const { priorityScore, priorityLevel } = computePriority(order);
  order.priorityScore = priorityScore;
  order.priorityLevel = priorityLevel;
}
