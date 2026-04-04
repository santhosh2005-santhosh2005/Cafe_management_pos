import { IOrder } from "../models/Order";

/**
 * Calculates initial estimated wait time (in minutes) for an order.
 * Logic:
 * - Base prep time per item: 4 minutes
 * - Load factor per pending order: 2 minutes
 * - Higher weight for complex orders
 */
export const calculateWaitTime = (order: any, pendingOrdersCount: number): number => {
    const BASE_PREP_TIME = 4; // Avg mins per item
    const LOAD_FACTOR = 2;    // Avg mins added per pending order in queue
    
    // Sum total quantity of items
    const totalItems = order.items.reduce((acc: number, item: any) => acc + item.quantity, 0);
    
    // Initial estimation
    let estimatedTime = (totalItems * BASE_PREP_TIME) + (pendingOrdersCount * LOAD_FACTOR);
    
    // Enforce reasonable bounds for automated initial estimate
    // Minimum 10 mins, Maximum 60 mins
    estimatedTime = Math.max(10, Math.min(60, estimatedTime));
    
    return Math.round(estimatedTime);
};
