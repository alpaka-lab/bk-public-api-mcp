---
name: strategy-backtest
description: ทำการทดสอบกลยุทธ์ (Backtest) เบื้องต้นจากข้อมูลประวัติราคาที่ดึงมาได้
allowed-tools: ["bitkub-api-mcp:*"]
---

วิเคราะห์ข้อมูลย้อนหลัง (Backtest) ของ $0 โดยอิงกลยุทธ์ $1:
1. ดึงข้อมูล K-Line ย้อนหลัง 100 แท่งล่าสุด
2. จำลองจุดเข้าซื้อ (Buy Signal) และจุดขาย (Sell Signal) ตามกฎของกลยุทธ์ที่ระบุ (เช่น EMA Cross หรือ RSI Divergence)
3. **Performance Metric:** - Win Rate โดยประมาณ
   - Drawdown ที่เกิดขึ้นในรอบ 100 แท่ง
   - กำไร/ขาดทุนสุทธิ (Hypothetical ROI)
4. **Summary:** ให้คะแนนความน่าเชื่อถือของกลยุทธ์นี้ในสภาวะตลาดปัจจุบัน (0-10)