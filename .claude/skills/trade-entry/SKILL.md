---
name: trade-entry
description: วิเคราะห์กราฟเหรียญเพื่อหาจุดเข้าซื้อ (Entry) และจุดขาย (Exit) ทั้งระยะสั้นและยาว
argument-hint: [SYMBOL]
allowed-tools: ["bitkub-api-mcp:*"]
---

ทำการวิเคราะห์เหรียญ $ARGUMENTS โดยใช้ขั้นตอนดังนี้:

### 1. การดึงข้อมูล
- ดึงข้อมูล K-Line (Candlestick) ย้อนหลัง:
  - ระยะสั้น: ใช้ Timeframe 15m และ 1h
  - ระยะยาว: ใช้ Timeframe 4h และ 1d
- ดึงข้อมูล Market Depth เพื่อดูแรงซื้อ/แรงขาย (Order Book)

### 2. การวิเคราะห์ Technical
- **Trend:** ระบุว่าเป็นขาขึ้นหรือขาลง โดยใช้ EMA 50 และ 200
- **Momentum:** เช็ก RSI ว่าอยู่ในเขต Overbought หรือ Oversold หรือมี Divergence หรือไม่
- **S/R Levels:** ระบุแนวรับ (Support) ที่แข็งแกร่ง และแนวต้าน (Resistance) ที่ต้องระวัง

### 3. กลยุทธ์การเทรด
- **ระยะสั้น (Scalping/Day Trade):** ระบุจุด Entry, Take Profit และ Stop Loss (R:R Ratio อย่างน้อย 1:2)
- **ระยะยาว (Investment):** ระบุโซนสะสม (Accumulation Zone) โดยอิงจากแนวรับสำคัญรายวัน

**Output:** แสดงผลเป็นตารางสรุปจุดเข้าซื้อ และวาดแผนภาพกราฟแบบ ASCII เพื่อจำลองแนวโน้ม