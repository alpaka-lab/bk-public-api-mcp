---
name: market-scanner
description: สแกนตลาด Bitkub เพื่อหาเหรียญที่มีความเคลื่อนไหวน่าสนใจ (Volume/Price Action)
allowed-tools: ["bitkub-api-mcp:*"]
---

ใช้เครื่องมือจาก Bitkub MCP เพื่อดึงข้อมูล Market Ticker ล่าสุด:
1. ดึงข้อมูล Ticker ทั้งหมดมาดูเหรียญที่มี %Change สูงสุด 5 อันดับแรก
2. วิเคราะห์ Volume 24 ชม. เพื่อหาเหรียญที่มีสภาพคล่องเพียงพอ
3. สรุปภาวะตลาด Bitkub ตอนนี้ว่าเป็น Bullish, Bearish หรือ Sideways
4. แนะนำ 3 เหรียญที่ "กราฟกำลังเลือกทาง" เพื่อส่งต่อให้ skill /trade-entry วิเคราะห์ต่อ