---
name: crypto-insight
description: คำนวณความเสี่ยงและวิเคราะห์ปัจจัยเสริมสำหรับเหรียญที่ต้องการลงทุน
disable-model-invocation: true
---

ให้คำแนะนำการบริหารเงินทุน (Money Management) สำหรับเหรียญ $ARGUMENTS:
1. **Position Sizing:** คำนวณว่าควรลงเงินกี่ % ของพอร์ต ตามจุด Stop Loss ที่ได้จาก /trade-entry
2. **Correlation:** เปรียบเทียบราคาเหรียญนี้ใน Bitkub กับราคาตลาดโลก (อิงจากความรู้ที่มี) ว่ามี Premium หรือ Discount ผิดปกติหรือไม่
3. **Sentiment Check:** วิเคราะห์ว่าข่าวช่วงนี้ส่งผลกระทบอย่างไรต่อเหรียญนี้

สรุปคำแนะนำในรูปแบบ "Buy/Wait/Sell" พร้อมเหตุผลประกอบ 3 ข้อ