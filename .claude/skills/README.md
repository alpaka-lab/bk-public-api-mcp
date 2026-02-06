---
name: orderflow-monitor
description: วิเคราะห์ Order Book และรายการซื้อขายล่าสุด เพื่อหาแนวต้านทางจิตวิทยาและแรงซื้อขายจริง
argument-hint: [SYMBOL]
allowed-tools: ["bk-public-api-mcp:*"]
---

วิเคราะห์พฤติกรรมราคาปัจจุบันของ $ARGUMENTS:
1. **Bid/Ask Spread:** เช็กความกว้างของ Spread ว่ามีสภาพคล่องพอไหม
2. **Buy/Sell Walls:** ค้นหา "กำแพงภาษี" (Large Orders) ใน Order Book ว่าฝั่งไหนหนากว่ากัน
3. **Trade History Analysis:** ดึงรายการซื้อขายล่าสุด 50 รายการ เพื่อดูว่าเป็นการ Match ในฝั่ง Buy หรือ Sell มากกว่า (ดู Market Sentiment ระยะสั้นสุดๆ)
4. **Conclusion:** ระบุว่าราคาปัจจุบันมี "แรงค้ำ" (Supportive) หรือ "แรงกด" (Pressured) จาก Order Flow อย่างไร
Skill 5: /arb-check (เช็กพรีเมียม Bitkub vs Global)
บ่อยครั้งที่ราคาใน Bitkub จะแพงกว่า (Premium) หรือถูกกว่า (Discount) ตลาดโลก (Binance) ซึ่งส่งผลต่อการตัดสินใจเข้าซื้อ Skill นี้จะช่วยให้คุณไม่ "ติดดอย" เพราะซื้อแพงเกินความจำเป็น

Path: ~/.claude/skills/arb-check/SKILL.md

Markdown
---
name: arb-check
description: เปรียบเทียบราคาสกุลเงินดิจิทัลระหว่าง Bitkub และราคาตลาดโลก (อิงข้อมูลปัจจุบัน)
argument-hint: [SYMBOL]
---

ทำการคำนวณส่วนต่างราคา (Arbitrage/Premium Check):
1. ดึงราคาปัจจุบันของ $ARGUMENTS จาก Bitkub (หน่วย THB)
2. สอบถามราคาตลาดโลก (หน่วย USD) และดึงอัตราแลกเปลี่ยน USD/THB ปัจจุบัน
3. **Calculate Premium:** คำนวณว่าราคาใน Bitkub ต่างจากราคาตลาดโลกกี่เปอร์เซ็นต์
   - หาก Premium > 2% : เตือนให้ระวังการไล่ราคา (Overbought in Local Market)
   - หาก Premium < -1% : เป็นโอกาสซื้อที่ได้เปรียบ (Discount)
4. **Recommendation:** สรุปว่าจังหวะนี้ควร "รอ" ให้ส่วนต่างลดลง หรือ "ซื้อ" ได้เลย
Skill 6: /strategy-backtest (จำลองกลยุทธ์ย้อนหลัง)
ก่อนจะเชื่อสิ่งที่กราฟบอก Skill นี้จะสั่งให้ Claude ลองมองย้อนกลับไปในข้อมูล K-Line ที่ดึงมาได้ แล้วประเมินว่าถ้าเข้าซื้อด้วยสัญญาณแบบนี้ใน 10 แท่งเทียนที่แล้ว ผลลัพธ์จะเป็นอย่างไร

Path: ~/.claude/skills/strategy-backtest/SKILL.md

Markdown
---
name: strategy-backtest
description: ทำการทดสอบกลยุทธ์ (Backtest) เบื้องต้นจากข้อมูลประวัติราคาที่ดึงมาได้
argument-hint: [SYMBOL] [STRATEGY_NAME]
allowed-tools: ["bk-public-api-mcp:*"]
---

วิเคราะห์ข้อมูลย้อนหลัง (Backtest) ของ $0 โดยอิงกลยุทธ์ $1:
1. ดึงข้อมูล K-Line ย้อนหลัง 100 แท่งล่าสุด
2. จำลองจุดเข้าซื้อ (Buy Signal) และจุดขาย (Sell Signal) ตามกฎของกลยุทธ์ที่ระบุ (เช่น EMA Cross หรือ RSI Divergence)
3. **Performance Metric:** - Win Rate โดยประมาณ
   - Drawdown ที่เกิดขึ้นในรอบ 100 แท่ง
   - กำไร/ขาดทุนสุทธิ (Hypothetical ROI)
4. **Summary:** ให้คะแนนความน่าเชื่อถือของกลยุทธ์นี้ในสภาวะตลาดปัจจุบัน (0-10)
💡 วิธีใช้งานแบบเป็นระบบ (Workflow)
คุณสามารถสั่ง Claude ให้ทำงานเป็น Pipeline ได้เลยครับ เช่น:

สแกน: /market-scanner -> "เจอ SOL น่าสนใจ"

เช็กส่วนต่าง: /arb-check SOL_THB -> "ราคา Bitkub เท่าตลาดโลก ไม่แพงไป"

หาจุดเข้า: /trade-entry SOL_THB -> "แนวรับอยู่ที่ 5,200 THB"

ส่องเจ้ามือ: /orderflow-monitor SOL_THB -> "มีกำแพงซื้อที่ 5,200 หนามาก"

ตัดสินใจ: /crypto-insight SOL_THB -> "คำนวณเงินลงทุนที่ควรเข้าซื้อ"

ข้อควรระวัง: เนื่องจาก Claude มีข้อจำกัดเรื่องการคำนวณที่ซับซ้อนในใจ (Mental Math) การใช้ Skill ที่มีการคำนวณ % เยอะๆ อย่าง /arb-check หรือ /strategy-backtest แนะนำให้คุณมั่นใจว่าใน SKILL.md มีขั้นตอนให้ Claude "เขียน Code Python เล็กๆ เพื่อคำนวณ" จะแม่นยำที่สุดครับ

คุณต้องการให้ผมเขียน ตัวอย่าง Code Python ที่ Claude จะต้องรันเพื่อเสริมใน Skill เหล่านี้ไหมครับ? (เช่น Script คำนวณ RSI หรือ EMA จากค่าที่ดึงมาจาก MCP)