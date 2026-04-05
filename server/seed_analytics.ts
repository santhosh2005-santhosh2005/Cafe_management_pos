import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB, disconnectDB } from "./src/config/db";
import { Order } from "./src/models/Order";
import { Session } from "./src/models/Session";
import { User } from "./src/models/User";
import { Product } from "./src/models/Product";
import { Table } from "./src/models/Table";
import bcrypt from "bcrypt";

dotenv.config();

const seedAnalytics = async () => {
  try {
    await connectDB();
    console.log("🌱 Generating analytics data...");

    // 1. Clear existing analytics data
    await Order.deleteMany({});
    await Session.deleteMany({});
    console.log("🗑️ Cleared existing orders and sessions");

    // 2. Ensure we have staff/cashiers
    let users = await User.find({ role: { $in: ["admin", "staff", "waiter"] } });
    if (users.length < 3) {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const newUsers = await User.insertMany([
        { name: "John Cashier", email: "john@cafe.com", password: hashedPassword, role: "admin", isActive: true },
        { name: "Sarah Waiter", email: "sarah@cafe.com", password: hashedPassword, role: "staff", isActive: true },
        { name: "Mike Waiter", email: "mike@cafe.com", password: hashedPassword, role: "staff", isActive: true },
      ]);
      users = [...users, ...newUsers];
      console.log("👤 Created fake staff users");
    }

    const products = await Product.find();
    const tables = await Table.find();

    if (products.length === 0 || tables.length === 0) {
      console.error("❌ No products or tables found. Run seed.ts first!");
      process.exit(1);
    }

    const now = new Date();
    const orders = [];
    const sessions = [];

    // Generate data for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      
      // Each user has one session per day
      for (const user of users) {
        const startTime = new Date(date);
        startTime.setHours(8 + Math.floor(Math.random() * 2), 0, 0);
        
        const endTime = new Date(date);
        endTime.setHours(20 + Math.floor(Math.random() * 4), 0, 0);

        const session = new Session({
          user: user._id,
          startTime,
          endTime,
          startingBalance: 1000,
          endingBalance: 0,
          totalSales: 0,
          status: "closed",
        });

        // Generate 5-15 orders per session
        const numOrders = 5 + Math.floor(Math.random() * 10);
        let sessionTotal = 0;

        for (let j = 0; j < numOrders; j++) {
          const orderTime = new Date(startTime);
          // Distribute orders throughout the session
          orderTime.setMinutes(Math.floor(Math.random() * (endTime.getTime() - startTime.getTime()) / 60000));

          const numItems = 1 + Math.floor(Math.random() * 4);
          const orderItems = [];
          let orderTotal = 0;

          for (let k = 0; k < numItems; k++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const qty = 1 + Math.floor(Math.random() * 2);
            const price = product.basePrice;
            
            orderItems.push({
              product: product._id,
              quantity: qty,
              size: "Regular",
              price: price,
              itemStatus: "completed"
            });
            orderTotal += price * qty;
          }

          const order = new Order({
            customOrderID: `ORD-${orderTime.getTime()}-${Math.floor(Math.random() * 10000)}`,
            items: orderItems,
            totalPrice: orderTotal,
            discountPercent: 0,
            taxRate: 5,
            status: "completed",
            paymentMethod: ["cash", "card", "upi"][Math.floor(Math.random() * 3)],
            table: tables[Math.floor(Math.random() * tables.length)]._id,
            sessionId: session._id,
            responsibleStaff: users[Math.floor(Math.random() * users.length)]._id,
            cashierId: user._id,
            createdAt: orderTime,
            updatedAt: new Date(orderTime.getTime() + 15 * 60000), // 15 mins later
          });

          orders.push(order);
          sessionTotal += orderTotal;
        }

        session.totalSales = sessionTotal;
        session.endingBalance = 1000 + sessionTotal;
        sessions.push(session);
      }
    }

    console.log(`📦 Inserting ${sessions.length} sessions and ${orders.length} orders...`);
    await Session.insertMany(sessions);
    await Order.insertMany(orders);

    console.log("🌱 Analytics data seeded successfully!");
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedAnalytics();
