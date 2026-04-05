import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB, disconnectDB } from "./src/config/db";
import { Category } from "./src/models/Category";
import { Product } from "./src/models/Product";
import { Floor } from "./src/models/Floor";
import { Table } from "./src/models/Table";

dotenv.config();

const coffeeImages = [
  "https://images.unsplash.com/photo-1541167760496-1628856ab772",
  "https://images.unsplash.com/photo-1461023058943-07fcbe16d735",
  "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8",
  "https://images.unsplash.com/photo-1571115177098-24ec4209b5ca",
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
  "https://images.unsplash.com/photo-1442512595331-e89e73853f31",
  "https://images.unsplash.com/photo-1511920170033-f8396924c348",
  "https://images.unsplash.com/photo-1507133750040-4a8f57021571",
  "https://images.unsplash.com/photo-1497935586351-b67a49e012bf",
  "https://images.unsplash.com/photo-1498804103079-a6351b050096",
  "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd",
  "https://images.unsplash.com/photo-1512568400610-62da28bc8a13",
  "https://images.unsplash.com/photo-1515442261904-6c50bb2f870a",
  "https://images.unsplash.com/photo-1497515114629-f71d768fd07c"
];

const foodImages = [
  "https://images.unsplash.com/photo-1601050633647-81a35d37766a",
  "https://images.unsplash.com/photo-1525351484163-7529414344d8",
  "https://images.unsplash.com/photo-1513442542250-854d436a73f2",
  "https://images.unsplash.com/photo-1550507992-eb63ffee0847",
  "https://images.unsplash.com/photo-1482049016688-2d3e1b311543",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
  "https://images.unsplash.com/photo-1484723088339-0b2833a25950",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445",
  "https://images.unsplash.com/photo-1467003909585-2f8a72700288",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
  "https://images.unsplash.com/photo-1473093226795-af9932fe5856",
  "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
  "https://images.unsplash.com/photo-1543353071-873f17a7a088"
];

const seedData = async () => {
  try {
    await connectDB();
    console.log("🌱 Seeding 100+ unique items and 100 tables...");

    // Clear existing data
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Floor.deleteMany({});
    await Table.deleteMany({});

    // 1. Create Main Floor
    const mainHall = await Floor.create({ name: "Main Hall", active: true });
    console.log("✅ Main Hall created");

    // 2. Create 100 Tables for Main Hall
    const tables = [];
    for (let i = 1; i <= 100; i++) {
      tables.push({
        number: `M-${i.toString().padStart(3, '0')}`,
        seats: Math.random() > 0.5 ? 4 : 2,
        status: "free",
        floor: mainHall._id,
        active: true,
      });
    }
    await Table.insertMany(tables);
    console.log("✅ 100 Tables created in Main Hall");

    // 3. Create Categories
    const categories = [
      await Category.create({ name: "Specialty Coffee" }),
      await Category.create({ name: "Happy Iced Series" }),
      await Category.create({ name: "Heritage Chai" }),
      await Category.create({ name: "Artisan Snacks" }),
      await Category.create({ name: "Dessert Bar" }),
      await Category.create({ name: "Refreshers" }),
    ];
    console.log("✅ 6 Categories created");

    // 4. Generate 100 Products
    const products = [];
    const productNames = [
      "Espresso", "Latte", "Cappuccino", "Mocha", "Flat White", "Macchiato", "Americano", "Cold Brew", "Nitro Coffee", "Cortado",
      "Masala Chai", "Ginger Tea", "Cardamom Tea", "Green Tea", "Oolong Tea", "Chamomile Tea", "Peppermint Tea", "Earl Grey", "Assam Gold", "Darjeeling Special",
      "Samosa", "Paneer Tikka", "Chicken Wrap", "Veggie Sandwich", "Avocado Toast", "Club Sandwich", "Garlic Bread", "French Fries", "Nachos", "Spring Rolls",
      "Brownie", "Cheesecake", "Apple Pie", "Chocolate Cake", "Tiramisu", "Macarons", "Cupcake", "Eclair", "Croissant", "Muffin",
      "Lemonade", "Iced Tea", "Fruit Punch", "Mango Shake", "Strawberry Smoothie", "Cold Coffee", "Virgin Mojito", "Blue Lagoon", "Watermelon Cooler", "Peach Slush",
      "Signature Blend", "Dark Roast", "Medium Roast", "Light Roast", "Single Origin", "Arabica Special", "Robusta Gold", "Vanilla Kaapi", "Caramel Latte", "Hazelnut Brew"
    ];

    for (let i = 1; i <= 100; i++) {
      const catIndex = Math.floor(Math.random() * categories.length);
      const isFood = categories[catIndex].name.includes("Snacks") || categories[catIndex].name.includes("Dessert");
      const imageList = isFood ? foodImages : coffeeImages;
      const baseName = productNames[i % productNames.length];
      
      // Use a unique signature for each image to ensure variety
      const imageUrl = `${imageList[i % imageList.length]}?auto=format&fit=crop&w=500&q=60&sig=${i}`;
      
      products.push({
        name: `${baseName} #${i}`,
        category: categories[catIndex]._id,
        description: `Premium quality ${baseName.toLowerCase()} served fresh from our kitchen. This signature item is a customer favorite.`,
        imageUrl,
        basePrice: parseFloat((Math.random() * 15 + 3).toFixed(2)),
        unit: isFood ? "plate" : "cup",
        taxRate: 5,
        available: true,
      });
    }

    const createdProducts = await Product.insertMany(products);
    console.log("✅ 100 Products created");

    // 5. Link products back to categories
    for (const cat of categories) {
      const catProducts = createdProducts.filter(p => p.category.toString() === cat._id.toString());
      cat.items = catProducts.map(p => p._id as any);
      await cat.save();
    }
    console.log("✅ Categories updated with product references");

    console.log("🌱 Seeding completed successfully!");
    
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedData();
