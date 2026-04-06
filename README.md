# ☕ ODOOCAFE — Modern Organic Brutalism

![ODOOCAFE Logo](./logo.jpeg)

## 🌟 Overview
**ODOOCAFE** is a premium, full-stack **Point of Sale (POS) system** and **Immersive Landing Experience** designed for modern specialty coffee roasteries. It blends the raw, high-contrast aesthetic of **Brutalism** with **Organic** design elements—curated specifically for the Indian heritage coffee culture.

### ✨ Key Features
- **🌐 Dual-Project Architecture**: A stunning "Modern Organic Brutalism" landing page for customers and a high-performance "Brutalist Edition" POS terminal for staff.
- **⚡ Real-Time Sync**: Powered by **Socket.io** for instant order communication between the counter and the kitchen.
- **🛡️ Secure Access**: Role-based access control (RBAC) with JWT-encrypted sessions.
- **📊 Business Intelligence**: Real-time dashboard with analytics on orders, revenue, and inventory.
- **☕ Heritage Focused**: Designed to celebrate Indian specialty coffee from Chikmagalur to Coorg.

---

## 📽️ Experience the Craft
Check out our signature "Modern Organic Brutalism" landing page experience:

> [!TIP]
> View the hero experience in action: `odoofinal/assets/hero_video.mp4`

---

## 🏗️ Technology Stack
### Frontend
- **React 19** with **TypeScript**
- **Vite** for lightning-fast builds
- **Motion (Framer)** for seamless fluid animations
- **TailwindCSS 4** for styling architecture
- **Redux Toolkit** for sophisticated state management

### Backend
- **Node.js** & **Express 5**
- **MongoDB** with **Mongoose** for data persistence
- **Socket.io** for real-time bi-directional events
- **Winston** for enterprise-grade logging

### Hardware & Printing
- Integrated **HTML5 QR Code** scanning
- Thermal printer support (ESC/POS)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** connection URI

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd odoomorning
   ```

2. Install dependencies:
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

### Running the Project
The project uses a unified start command:
```bash
npm start
```
This will launch:
- **Server**: `http://localhost:5001`
- **POS Client**: `http://localhost:5173`

To view the **Marketing Landing Page**, serve the `odoofinal` directory:
```bash
npx serve odoofinal
```
Available at: `http://localhost:3000`

---

## 🎨 Design Philosophy
The **Modern Organic Brutalist** aesthetic is defined by:
- **Hard Hierarchy**: Strong, monospaced typography and thick borders.
- **Organic Radii**: Soft, fluid shapes that contrast against the rigid layout.
- **Dynamic Physics**: Interactive pill clouds and mass-based UI elements (Matter.js).
- **Heritage Palette**: Deep Forest Green, Rich Cream, and Electric Lime.

---

## 📜 License
Integrated System Overview - Proprietary Concept. © 2025 ODOOCAFE.
