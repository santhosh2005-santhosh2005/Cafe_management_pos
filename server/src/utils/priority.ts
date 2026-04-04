import { IOrder } from "../models/Order";

/**
 * Calculates the priority score and level for an order.
 * Higher score = Higher priority.
 * 
 * Logic:
 * 1. Waiting Time: 2 points per minute passed since creation.
 * 2. Complexity: 5 points per unique item in the order.
 * 3. Table Urgency: Reserved for manual override or specific table types (if added).
 */
export const calculateOrderPriority = (order: IOrder): { score: number; level: "high" | "medium" | "low" } => {
  const now = new Date();
  const createdAt = new Date(order.createdAt || now);
  const waitingMinutes = Math.floor((now.getTime() - createdAt.getTime()) / 60000);

  // Complexity score based on number of items (more items = more complex)
  const complexityScore = (order.items?.length || 0) * 5;

  // Waiting time score (increases linearly over time)
  const waitingScore = waitingMinutes * 2;

  const totalScore = complexityScore + waitingScore + (order.isPriorityBoosted ? 100 : 0);

  let level: "high" | "medium" | "low" = "low";
  if (totalScore >= 50 || order.isPriorityBoosted) {
    level = "high";
  } else if (totalScore >= 20) {
    level = "medium";
  }

  return { score: totalScore, level };
};
