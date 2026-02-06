---
name: orderflow-monitor
description: วิเคราะห์ Order Book และรายการซื้อขายล่าสุด เพื่อหาแนวต้านทางจิตวิทยาและแรงซื้อขายจริง
allowed-tools: ["bitkub-api-mcp:*"]
---

วิเคราะห์พฤติกรรมราคาปัจจุบันของ $ARGUMENTS:
1. **Bid/Ask Spread:** เช็กความกว้างของ Spread ว่ามีสภาพคล่องพอไหม
2. **Buy/Sell Walls:** ค้นหา "กำแพงภาษี" (Large Orders) ใน Order Book ว่าฝั่งไหนหนากว่ากัน
3. **Trade History Analysis:** ดึงรายการซื้อขายล่าสุด 50 รายการ เพื่อดูว่าเป็นการ Match ในฝั่ง Buy หรือ Sell มากกว่า (ดู Market Sentiment ระยะสั้นสุดๆ)
4. **Conclusion:** ระบุว่าราคาปัจจุบันมี "แรงค้ำ" (Supportive) หรือ "แรงกด" (Pressured) จาก Order Flow อย่างไร