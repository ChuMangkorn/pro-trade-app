ProTrade - Binance-Inspired Crypto Trading Interface




ProTrade คือแอปพลิเคชันเว็บเทรดคริปโตแบบเรียลไทม์ที่จำลอง UI และฟังก์ชันการทำงานหลักมาจาก Binance Spot Trading พัฒนาด้วย Next.js และเชื่อมต่อกับข้อมูลจริงจาก Binance ผ่าน WebSocket และ REST API

Live Demo: https://pro-trade-a8v1wknwb-chumangkorns-projects.vercel.app ## ✨ คุณสมบัติหลัก (Key Features)

โปรเจกต์นี้ไม่ได้เป็นแค่หน้าเว็บธรรมดา แต่เต็มไปด้วยฟังก์ชันการทำงานที่ซับซ้อนและทันสมัย:

ข้อมูลเรียลไทม์ (Real-time Data):

เชื่อมต่อกับ Binance WebSocket streams หลายตัวพร้อมกัน (ticker, depth, trade, kline) เพื่ออัปเดตข้อมูลราคา, Order Book, และรายการซื้อขายล่าสุดแบบสดๆ
ไตเติ้ลของหน้าเว็บจะแสดงราคาล่าสุดของเหรียญแบบเรียลไทม์
กราฟราคาขั้นสูง (Advanced Price Chart):

ใช้ไลบรารี Lightweight Charts™ เพื่อแสดงผลกราฟแท่งเทียน (Candlestick) และกราฟเส้น (Line) ที่มีประสิทธิภาพสูง
สามารถเปลี่ยน Timeframe ได้ (1m, 15m, 1H, 4H, 1D, 1W)
มีเส้นอินดิเคเตอร์ Simple Moving Average (SMA) ที่ผู้ใช้สามารถปรับค่า period ได้ และจะคำนวณใหม่พร้อมกับข้อมูลที่เข้ามา
Order Book แบบอินเตอร์แอคทีฟ:

แสดงรายการ Bid/Ask แบบเรียลไทม์ 20 ระดับ
มี Visual Depth Chart (กราฟความลึก) ที่วาดด้วย HTML Canvas เพื่อให้เห็นภาพรวมของตลาด
สามารถปรับความละเอียด (Precision) ของราคาใน Order Book ได้
รายการตลาด (Market List) ที่มีประสิทธิภาพ:

ดึงรายชื่อคู่เทรดทั้งหมดจาก Binance API พร้อมแคชข้อมูลเพื่อลดการเรียกซ้ำ
มีระบบค้นหา (Search) และกรอง (Filter) ตาม Quote Asset (USDT, BTC, ETH, BNB)
ระบบ Favorites: ผู้ใช้สามารถติดดาวคู่เทรดที่สนใจได้ และข้อมูลจะถูกบันทึกไว้ใน localStorage
ใช้ react-window เพื่อแสดงผลรายการที่ยาวมากๆ ได้อย่างลื่นไหล (Virtualization)
การจำลองการเทรด (Simulated Trading):

มีฟอร์มสำหรับส่งคำสั่งซื้อ/ขาย ทั้งแบบ Limit, Market, และ Stop-limit
ใช้ React Context (OrderContext) ในการจัดการสถานะของคำสั่ง
มี Activity Panel แสดงรายการ Open Orders และ Trade History พร้อมระบบยกเลิกออเดอร์ (จำลอง)
UI/UX ที่ทันสมัย:

ดีไซน์ได้รับแรงบันดาลใจจาก Binance โดยตรง
รองรับ Dark Mode
ใช้ Tailwind CSS v4 และมีตัวแปรสีที่กำหนดเองใน globals.css
มี Animation "flash" เมื่อราคาหรือข้อมูลมีการเปลี่ยนแปลง
🚀 เทคโนโลยีที่ใช้ (Tech Stack)
Framework: Next.js 15 (App Router, Turbopack)
Language: TypeScript
Styling: Tailwind CSS v4
State Management: React Context, Jotai (สำหรับ marketAtoms)
Charting: Lightweight Charts™
Data Fetching: Native fetch, SWR-like custom hooks
Real-time Communication: Native WebSocket API
Testing: Jest, ts-jest
Code Quality: ESLint, Prettier
🛠️ เริ่มต้นใช้งาน (Getting Started)
สิ่งที่ต้องมี (Prerequisites)
Node.js (แนะนำเวอร์ชัน 18.18.0 ขึ้นไป)
Yarn, pnpm, หรือ npm
การติดตั้งและเริ่มใช้งาน (Installation & Running)
Clone a copy of the repository:
Bash

git clone https://github.com/your-username/pro-trade-app.git
Navigate to the project directory:
Bash

cd pro-trade-app
Install dependencies:
Bash

npm install
# or
yarn install
# or
pnpm install
Run the development server (with Turbopack):
Bash

npm run dev
เปิดเบราว์เซอร์ไปที่ http://localhost:3000 เพื่อดูผลลัพธ์
📂 โครงสร้างโปรเจกต์ (Project Structure)
โปรเจกต์นี้ใช้ App Router ของ Next.js โดยมีโครงสร้างที่จัดระเบียบอย่างดีเพื่อง่ายต่อการพัฒนาและดูแลรักษา:

/src
├── app/
│   ├── (main)/
│   │   ├── trade/[symbol]/page.tsx  # หน้าหลักสำหรับแสดง Trading UI
│   │   └── page.tsx                 # หน้าแรกที่ redirect ไปยัง /trade/BTCUSDT
│   ├── api/
│   │   ├── klines/route.ts          # API Route สำหรับดึงข้อมูลกราฟ
│   │   └── symbols/route.ts         # API Route สำหรับดึงรายการคู่เทรดทั้งหมด
│   └── layout.tsx                   # Layout หลัก
├── atoms/                          # Jotai atoms สำหรับ state ที่แชร์ข้าม component
├── components/
│   ├── layout/                      # Components โครงสร้างหลักของหน้า (e.g., TradingLayout)
│   └── ui/                          # Reusable UI components (e.g., Button, Modal)
├── context/                        # React Context providers (e.g., WebSocket, Order)
├── features/
│   ├── trading/                     # Components ที่เกี่ยวกับฟีเจอร์เทรดโดยเฉพาะ
│   └── market/                      # Components ที่เกี่ยวกับข้อมูลตลาด
├── hooks/                          # Custom React Hooks (e.g., useBinanceWebSocket)
└── utils/                          # Utility functions (e.g., chart calculations)
📜 Scripts
npm run dev: เริ่ม development server ด้วย Turbopack
npm run build: สร้าง production build
npm run start: เริ่ม production server
npm run lint: รัน ESLint เพื่อตรวจสอบคุณภาพโค้ด
npm run test: รัน Jest test suite
📄 ใบอนุญาต (License)
โปรเจกต์นี้อยู่ภายใต้ใบอนุญาต MIT ดูรายละเอียดเพิ่มเติมได้ที่ไฟล์ LICENSE
