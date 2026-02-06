const fs = require('fs');

// อ่านข้อมูลจากไฟล์
const dataPath = process.argv[2];
const rawData = fs.readFileSync(dataPath, 'utf8');
const parsed = JSON.parse(rawData);
const data = JSON.parse(parsed[0].text);

const { t: timestamps, o: opens, h: highs, l: lows, c: closes, v: volumes } = data;

console.log(`\n📊 วิเคราะห์ข้อมูล Bitcoin ${timestamps.length} candles (${Math.floor(timestamps.length / 24)} วัน)\n`);

// แปลง timestamp เป็นชั่วโมงในวัน (timezone GMT+7)
const hourlyData = {};
for (let i = 0; i < 24; i++) {
  hourlyData[i] = {
    hour: i,
    prices: [],
    volumes: []
  };
}

timestamps.forEach((ts, idx) => {
  const date = new Date(ts * 1000);
  const hour = (date.getUTCHours() + 7) % 24; // GMT+7 for Thailand

  // ใช้ราคา open สำหรับจำลองการซื้อ DCA
  hourlyData[hour].prices.push(opens[idx]);
  hourlyData[hour].volumes.push(volumes[idx]);
});

// คำนวณสถิติแต่ละชั่วโมง
const hourlyStats = Object.values(hourlyData).map(h => {
  const avg = h.prices.reduce((a, b) => a + b, 0) / h.prices.length;
  const min = Math.min(...h.prices);
  const max = Math.max(...h.prices);
  const median = h.prices.sort((a, b) => a - b)[Math.floor(h.prices.length / 2)];
  const stdDev = Math.sqrt(
    h.prices.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / h.prices.length
  );

  return {
    hour: h.hour,
    count: h.prices.length,
    avg,
    median,
    min,
    max,
    stdDev,
    avgVolume: h.volumes.reduce((a, b) => a + b, 0) / h.volumes.length
  };
});

// เรียงตามราคาเฉลี่ยจากต่ำไปสูง
const sortedByAvg = [...hourlyStats].sort((a, b) => a.avg - b.avg);

console.log('🏆 TOP 5 ชั่วโมงที่มีราคาเฉลี่ยต่ำที่สุด (ดีสำหรับ DCA):');
console.log('─'.repeat(80));
sortedByAvg.slice(0, 5).forEach((stat, idx) => {
  const hourStr = `${stat.hour.toString().padStart(2, '0')}:00`;
  const rank = idx + 1;
  console.log(`${rank}. ${hourStr} น. - ราคาเฉลี่ย: ${stat.avg.toFixed(2)} บาท (ตัวอย่าง: ${stat.count} ครั้ง)`);
});

console.log('\n📉 BOTTOM 5 ชั่วโมงที่มีราคาเฉลี่ยสูงที่สุด (แย่สำหรับ DCA):');
console.log('─'.repeat(80));
sortedByAvg.slice(-5).reverse().forEach((stat, idx) => {
  const hourStr = `${stat.hour.toString().padStart(2, '0')}:00`;
  console.log(`${5-idx}. ${hourStr} น. - ราคาเฉลี่ย: ${stat.avg.toFixed(2)} บาท`);
});

// Backtest: เปรียบเทียบการซื้อในเวลาต่างๆ
console.log('\n\n💰 BACKTEST: การ DCA 1,000 บาทต่อวัน');
console.log('─'.repeat(80));

// สมมติซื้อ 1000 บาทต่อวัน
const dcaAmount = 1000;
const backtestResults = {};

// จัดกลุ่มข้อมูลตามวัน
const dailyData = {};
timestamps.forEach((ts, idx) => {
  const date = new Date(ts * 1000);
  const dateKey = date.toISOString().split('T')[0];

  if (!dailyData[dateKey]) {
    dailyData[dateKey] = {};
  }

  const hour = (date.getUTCHours() + 7) % 24;
  if (!dailyData[dateKey][hour]) {
    dailyData[dateKey][hour] = opens[idx];
  }
});

// จำลอง DCA ในแต่ละชั่วโมง
for (let hour = 0; hour < 24; hour++) {
  let totalBTC = 0;
  let totalInvested = 0;
  let dayCount = 0;

  Object.values(dailyData).forEach(day => {
    if (day[hour]) {
      const btcBought = dcaAmount / day[hour];
      totalBTC += btcBought;
      totalInvested += dcaAmount;
      dayCount++;
    }
  });

  if (dayCount > 0) {
    const avgPrice = totalInvested / totalBTC;
    const currentPrice = closes[closes.length - 1]; // ราคาปัจจุบัน
    const currentValue = totalBTC * currentPrice;
    const profit = currentValue - totalInvested;
    const profitPercent = (profit / totalInvested) * 100;

    backtestResults[hour] = {
      hour,
      totalBTC,
      totalInvested,
      avgPrice,
      currentValue,
      profit,
      profitPercent,
      dayCount
    };
  }
}

// เรียงตามกำไร
const sortedBacktest = Object.values(backtestResults).sort((a, b) => b.profitPercent - a.profitPercent);

console.log(`ข้อมูล: ซื้อ ${dcaAmount} บาทต่อวัน เป็นเวลา ~${Math.floor(timestamps.length / 24)} วัน\n`);

console.log('🥇 TOP 5 เวลาที่ให้ผลตอบแทนดีที่สุด:');
sortedBacktest.slice(0, 5).forEach((result, idx) => {
  const hourStr = `${result.hour.toString().padStart(2, '0')}:00`;
  console.log(`${idx + 1}. ${hourStr} น. - ` +
    `BTC: ${result.totalBTC.toFixed(8)}, ` +
    `ราคาเฉลี่ยที่ซื้อ: ${result.avgPrice.toFixed(2)}, ` +
    `กำไร: ${result.profitPercent.toFixed(2)}%`);
});

console.log('\n🥉 BOTTOM 5 เวลาที่ให้ผลตอบแทนแย่ที่สุด:');
sortedBacktest.slice(-5).reverse().forEach((result, idx) => {
  const hourStr = `${result.hour.toString().padStart(2, '0')}:00`;
  console.log(`${5-idx}. ${hourStr} น. - ` +
    `BTC: ${result.totalBTC.toFixed(8)}, ` +
    `ราคาเฉลี่ยที่ซื้อ: ${result.avgPrice.toFixed(2)}, ` +
    `กำไร: ${result.profitPercent.toFixed(2)}%`);
});

// คำนวณความแตกต่างระหว่างดีที่สุดและแย่ที่สุด
const best = sortedBacktest[0];
const worst = sortedBacktest[sortedBacktest.length - 1];
const diff = best.profitPercent - worst.profitPercent;

console.log('\n📈 สรุป:');
console.log('─'.repeat(80));
console.log(`✅ เวลาดีที่สุด: ${best.hour.toString().padStart(2, '0')}:00 น. (กำไร ${best.profitPercent.toFixed(2)}%)`);
console.log(`❌ เวลาแย่ที่สุด: ${worst.hour.toString().padStart(2, '0')}:00 น. (กำไร ${worst.profitPercent.toFixed(2)}%)`);
console.log(`🔄 ความแตกต่าง: ${diff.toFixed(2)}%`);

// แนะนำเวลา
console.log('\n\n🎯 คำแนะนำ:');
console.log('─'.repeat(80));
const top3Hours = sortedBacktest.slice(0, 3).map(r => `${r.hour.toString().padStart(2, '0')}:00`);
console.log(`แนะนำให้ทำ DCA Bitcoin ในช่วงเวลา: ${top3Hours.join(', ')} น.`);
console.log(`ตามข้อมูล ${Math.floor(timestamps.length / 24)} วันที่ผ่านมา เวลาเหล่านี้มีแนวโน้มให้ผลตอบแทนที่ดีกว่าเวลาอื่น`);
console.log(`\nหมายเหตุ: ผลลัพธ์อาจแตกต่างกันในอนาคต ควรใช้เป็นข้อมูลอ้างอิงเท่านั้น`);
