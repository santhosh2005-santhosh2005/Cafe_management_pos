# Cafe Sync: 10-Minute Technical Presentation Script

## Introduction (0:00 - 1:30)
- **The Hook:** "In the busy world of cafes, speed is everything. Cafe Sync isn't just a POS; it's a high-performance system built with the MERN stack (MongoDB, Express, React, Node) and TypeScript to ensure zero-latency order management."
- **The Problem:** Traditional POS systems are slow and visually boring.
- **The Solution:** A 'Modern Organic Brutalist' interface—raw, bold, but incredibly smooth.

## The Design Philosophy (1:30 - 3:30)
- **Concept:** Explain **Organic Brutalism.**
    - **Brutalist:** Sharp edges, bold typography (Montserrat/Inter), and high contrast (Black/Lime/Gold).
    - **Organic:** Subtle grain textures, dotted backgrounds, and fluid SVG animations (the Background Lines).
- **UI Highlights:**
    - **Sharp Corners:** 0px border-radius for an industrial feel.
    - **Real-time Feedback:** Order status cards that update instantly using Socket.IO.
    - **Industrial Aesthetics:** A dotted grid system that makes the app feel like a digital blueprint.

## Technical Architecture (3:30 - 6:00)
- **Backend:** Node.js + Express.
    - **Database:** MongoDB for flexible menu items and order history.
- **Frontend:** React + Vite.
    - **Performance:** Vite ensures lightning-fast builds and Hot Module Replacement (HMR).
- **Real-time Engine:** Socket.IO.
    - "When a cashier hits 'Order,' the kitchen display updates instantly. No page refreshes."

## Hosting: Ngrok (6:00 - 8:30)
- **The Challenge:** "How do we show a local app (port 5173/5001) to someone remotely?"
- **The Solution:** **Ngrok Tunnels.**
- **The Implementation:**
    1. **Vite Proxy:** We configured the frontend to forward all `/api` requests locally, so we only need **one** ngrok URL.
    2. **CORS Dynamic Handling:** The server now trusts `.ngrok-free.dev` origins automatically.
    3. **Tunneling:** `ngrok http 5173` bridges your local environment to a secure public HTTPS link.

## Troubleshooting: Chrome "Blackout" (8:30 - 9:30)
- **The Reason:** Chrome's GPU Hardware Acceleration can sometimes glitch with heavy SVG/CSS animations (like our Background Lines).
- **The Fix:** 
    - Settings > System > Turn off "Use hardware acceleration when available."
    - This ensures stable rendering of our high-contrast brutalist UI.

## Conclusion (9:30 - 10:00)
- **Summary:** "Cafe Sync is now public, real-time, and looks like a high-end tech workspace."
- **Next Steps:** Start taking orders and scaling the business.
