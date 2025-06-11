# ProTrade - Binance-Inspired Crypto Trading Interface

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-blue?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

ProTrade คือแอปพลิเคชันเว็บเทรดคริปโตแบบเรียลไทม์ที่จำลอง UI และฟังก์ชันการทำงานหลักมาจาก Binance Spot Trading พัฒนาด้วย Next.js และเชื่อมต่อกับข้อมูลจริงจาก Binance ผ่าน WebSocket และ REST API

![ProTrade Screenshot]<img width="1680" alt="Screenshot 2025-06-11 at 3 10 38" src="https://github.com/user-attachments/assets/1ed5522d-3248-4fca-aae1-1d42635dfe35" />


**Live Demo:** (https://pro-trade-a8v1wknwb-chumangkorns-projects.vercel.app/) ## ✨ คุณสมบัติหลัก (Key Features)

โปรเจกต์นี้ไม่ได้เป็นแค่หน้าเว็บธรรมดา แต่เต็มไปด้วยฟังก์ชันการทำงานที่ซับซ้อนและทันสมัย:

* **ข้อมูลเรียลไทม์ (Real-time Data):**
    * เชื่อมต่อกับ Binance WebSocket streams หลายตัวพร้อมกัน (`ticker`, `depth`, `trade`, `kline`) เพื่ออัปเดตข้อมูลราคา, Order Book, และรายการซื้อขายล่าสุดแบบสดๆ
    * ไตเติ้ลของหน้าเว็บจะแสดงราคาล่าสุดของเหรียญแบบเรียลไทม์

* **กราฟราคาขั้นสูง (Advanced Price Chart):**
    * ใช้ไลบรารี **Lightweight Charts™** เพื่อแสดงผลกราฟแท่งเทียน (Candlestick) และกราฟเส้น (Line) ที่มีประสิทธิภาพสูง
    * สามารถเปลี่ยน Timeframe ได้ (1m, 15m, 1H, 4H, 1D, 1W)
    * มีเส้นอินดิเคเตอร์ Simple Moving Average (SMA) ที่ผู้ใช้สามารถปรับค่า period ได้ และจะคำนวณใหม่พร้อมกับข้อมูลที่เข้ามา

* **Order Book แบบอินเตอร์แอคทีฟ:**
    * แสดงรายการ Bid/Ask แบบเรียลไทม์ 20 ระดับ
    * มี Visual Depth Chart (กราฟความลึก) ที่วาดด้วย HTML Canvas เพื่อให้เห็นภาพรวมของตลาด
    * สามารถปรับความละเอียด (Precision) ของราคาใน Order Book ได้

* **รายการตลาด (Market List) ที่มีประสิทธิภาพ:**
    * ดึงรายชื่อคู่เทรดทั้งหมดจาก Binance API พร้อมแคชข้อมูลเพื่อลดการเรียกซ้ำ
    * มีระบบค้นหา (Search) และกรอง (Filter) ตาม Quote Asset (USDT, BTC, ETH, BNB)
    * **ระบบ Favorites:** ผู้ใช้สามารถติดดาวคู่เทรดที่สนใจได้ และข้อมูลจะถูกบันทึกไว้ใน `localStorage`
    * ใช้ `react-window` เพื่อแสดงผลรายการที่ยาวมากๆ ได้อย่างลื่นไหล (Virtualization)

* **การจำลองการเทรด (Simulated Trading):**
    * มีฟอร์มสำหรับส่งคำสั่งซื้อ/ขาย ทั้งแบบ Limit, Market, และ Stop-limit
    * ใช้ React Context (`OrderContext`) ในการจัดการสถานะของคำสั่ง
    * มี **Activity Panel** แสดงรายการ `Open Orders` และ `Trade History` พร้อมระบบยกเลิกออเดอร์ (จำลอง)

* **UI/UX ที่ทันสมัย:**
    * ดีไซน์ได้รับแรงบันดาลใจจาก Binance โดยตรง
    * รองรับ **Dark Mode**
    * ใช้ Tailwind CSS v4 และมีตัวแปรสีที่กำหนดเองใน `globals.css`
    * มี Animation "flash" เมื่อราคาหรือข้อมูลมีการเปลี่ยนแปลง

## 🚀 เทคโนโลยีที่ใช้ (Tech Stack)

* **Framework:** [Next.js](https://nextjs.org/) 15 (App Router, Turbopack)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **State Management:** [React Context](https://react.dev/learn/passing-data-deeply-with-context), [Jotai](https://jotai.org/) (สำหรับ `marketAtoms`)
* **Charting:** [Lightweight Charts™](https://www.tradingview.com/lightweight-charts/)
* **Data Fetching:** Native `fetch`, SWR-like custom hooks
* **Real-time Communication:** Native WebSocket API
* **Testing:** [Jest](https://jestjs.io/), [ts-jest](https://kulshekhar.github.io/ts-jest/)
* **Code Quality:** [ESLint](https://eslint.org/), [Prettier](https://prettier.io/)

## 🛠️ เริ่มต้นใช้งาน (Getting Started)

### สิ่งที่ต้องมี (Prerequisites)

* [Node.js](https://nodejs.org/) (แนะนำเวอร์ชัน 18.18.0 ขึ้นไป)
* [Yarn](https://yarnpkg.com/), [pnpm](https://pnpm.io/), หรือ npm

### การติดตั้งและเริ่มใช้งาน (Installation & Running)

1.  Clone a copy of the repository:
    ```bash
    git clone [https://github.com/your-username/pro-trade-app.git](https://github.com/your-username/pro-trade-app.git)
    ```
2.  Navigate to the project directory:
    ```bash
    cd pro-trade-app
    ```
3.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```
4.  Run the development server (with Turbopack):
    ```bash
    npm run dev
    ```
5.  เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000) เพื่อดูผลลัพธ์

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

โปรเจกต์นี้ใช้ App Router ของ Next.js โดยมีโครงสร้างที่จัดระเบียบอย่างดีเพื่อง่ายต่อการพัฒนาและดูแลรักษา:
