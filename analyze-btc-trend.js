const fs = require('fs');

// อ่านข้อมูล ticker
const tickerData = {
  last: 2227052.51,
  high_24hr: 2406141.86,
  low_24hr: 2212500,
  percent_change: -7.38,
  volume: 293.05229992
};

console.log('\n📊 วิเคราะห์ Bitcoin (BTC/THB) - Bitkub Exchange');
console.log('═'.repeat(80));
console.log(`⏰ อัปเดต: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}\n`);

// แสดงราคาปัจจุบัน
console.log('💰 ราคาปัจจุบัน');
console.log('─'.repeat(80));
console.log(`   ราคา: ${tickerData.last.toLocaleString()} บาท`);
console.log(`   24hr High: ${tickerData.high_24hr.toLocaleString()} บาท`);
console.log(`   24hr Low: ${tickerData.low_24hr.toLocaleString()} บาท`);
console.log(`   เปลี่ยนแปลง: ${tickerData.percent_change}%`);
console.log(`   ปริมาณ: ${tickerData.volume.toFixed(2)} BTC\n`);

// อ่านข้อมูล Daily
const dailyPath = process.argv[2];
const dailyRaw = fs.readFileSync(dailyPath, 'utf8');
const dailyData = JSON.parse(dailyRaw);

const daily = {
  timestamps: dailyData.t,
  opens: dailyData.o,
  highs: dailyData.h,
  lows: dailyData.l,
  closes: dailyData.c,
  volumes: dailyData.v
};

// อ่านข้อมูล 4hr
const hourlyPath = process.argv[3];
const hourlyRaw = fs.readFileSync(hourlyPath, 'utf8');
const hourlyData = JSON.parse(hourlyRaw);

const hourly = {
  timestamps: hourlyData.t,
  opens: hourlyData.o,
  highs: hourlyData.h,
  lows: hourlyData.l,
  closes: hourlyData.c,
  volumes: hourlyData.v
};

// คำนวณ Moving Averages
function calculateMA(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

// คำนวณ RSI
function calculateRSI(closes, period = 14) {
  const changes = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? -c : 0);

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const rsi = [];
  for (let i = 0; i < period; i++) {
    rsi.push(null);
  }

  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }

  return rsi;
}

// วิเคราะห์เทรนด์
const ma7 = calculateMA(daily.closes, 7);
const ma20 = calculateMA(daily.closes, 20);
const ma50 = calculateMA(daily.closes, 50);
const rsi = calculateRSI(daily.closes);

const currentPrice = tickerData.last;
const ma7Current = ma7[ma7.length - 1];
const ma20Current = ma20[ma20.length - 1];
const ma50Current = ma50[ma50.length - 1];
const rsiCurrent = rsi[rsi.length - 1];

console.log('📈 Technical Indicators (Daily)');
console.log('─'.repeat(80));
console.log(`   MA7:  ${ma7Current ? ma7Current.toLocaleString('en-US', { maximumFractionDigits: 0 }) : 'N/A'} บาท`);
console.log(`   MA20: ${ma20Current ? ma20Current.toLocaleString('en-US', { maximumFractionDigits: 0 }) : 'N/A'} บาท`);
console.log(`   MA50: ${ma50Current ? ma50Current.toLocaleString('en-US', { maximumFractionDigits: 0 }) : 'N/A'} บาท`);
console.log(`   RSI(14): ${rsiCurrent ? rsiCurrent.toFixed(2) : 'N/A'}`);

// กำหนดเทรนด์
let trend = '❓ ไม่แน่นอน';
let trendDescription = '';

if (currentPrice < ma7Current && ma7Current < ma20Current && ma20Current < ma50Current) {
  trend = '📉 ขาลงชัดเจน (Strong Downtrend)';
  trendDescription = 'ราคาต่ำกว่า MA ทุกระยะ และ MA เรียงตัวขาลง';
} else if (currentPrice < ma7Current && ma7Current < ma20Current) {
  trend = '📉 ขาลง (Downtrend)';
  trendDescription = 'ราคาต่ำกว่า MA ระยะสั้น-กลาง';
} else if (currentPrice > ma7Current && ma7Current > ma20Current && ma20Current > ma50Current) {
  trend = '📈 ขาขึ้นชัดเจน (Strong Uptrend)';
  trendDescription = 'ราคาสูงกว่า MA ทุกระยะ และ MA เรียงตัวขาขึ้น';
} else if (currentPrice > ma7Current && ma7Current > ma20Current) {
  trend = '📈 ขาขึ้น (Uptrend)';
  trendDescription = 'ราคาสูงกว่า MA ระยะสั้น-กลาง';
}

console.log(`\n   เทรนด์: ${trend}`);
console.log(`   ${trendDescription}\n`);

// ข้อมูล RSI
console.log('🔍 การตีความ RSI:');
if (rsiCurrent < 30) {
  console.log('   ⚠️  RSI < 30: Oversold (ราคาต่ำเกินไป อาจมีโอกาสฟื้นตัว)');
} else if (rsiCurrent > 70) {
  console.log('   ⚠️  RSI > 70: Overbought (ราคาสูงเกินไป อาจมีโอกาสปรับฐาน)');
} else {
  console.log(`   ✅ RSI อยู่ในช่วงปกติ (30-70)`);
}

// หา Support และ Resistance จาก 90 วันย้อนหลัง
console.log('\n\n🎯 ระดับ Support และ Resistance');
console.log('─'.repeat(80));

// หาจุดต่ำสุดและสูงสุด
const recentHigh = Math.max(...daily.highs);
const recentLow = Math.min(...daily.lows);
const highIndex = daily.highs.indexOf(recentHigh);
const lowIndex = daily.lows.indexOf(recentLow);

console.log(`   จุดสูงสุด 90 วัน: ${recentHigh.toLocaleString()} บาท (${new Date(daily.timestamps[highIndex] * 1000).toLocaleDateString('th-TH')})`);
console.log(`   จุดต่ำสุด 90 วัน: ${recentLow.toLocaleString()} บาท (${new Date(daily.timestamps[lowIndex] * 1000).toLocaleDateString('th-TH')})`);
console.log(`   ช่วงราคา: ${((recentHigh - recentLow) / recentLow * 100).toFixed(2)}%\n`);

// หา Support levels จากข้อมูลล่าสุด 30 วัน
const recent30Lows = daily.lows.slice(-30);
const sortedLows = [...recent30Lows].sort((a, b) => a - b);

// หา Resistance levels
const recent30Highs = daily.highs.slice(-30);
const sortedHighs = [...recent30Highs].sort((a, b) => b - a);

// คำนวณระดับที่สำคัญ (round numbers)
const roundNumbers = [];
for (let price = 2000000; price <= 3500000; price += 100000) {
  roundNumbers.push(price);
}

// หา support ที่ใกล้เคียง
const nearbySupports = sortedLows
  .filter((price, idx, arr) => arr.indexOf(price) === idx) // unique
  .filter(price => price < currentPrice)
  .slice(0, 5);

console.log('📍 ระดับ Support ที่สำคัญ (จากต่ำไปสูง):');
nearbySupports.sort((a, b) => b - a).forEach((support, idx) => {
  const distance = ((currentPrice - support) / currentPrice * 100).toFixed(2);
  console.log(`   S${idx + 1}: ${support.toLocaleString('en-US', { maximumFractionDigits: 0 })} บาท (ห่างจากราคาปัจจุบัน -${distance}%)`);
});

// หา resistance ที่ใกล้เคียง
const nearbyResistances = sortedHighs
  .filter((price, idx, arr) => arr.indexOf(price) === idx)
  .filter(price => price > currentPrice)
  .slice(0, 5);

console.log('\n📍 ระดับ Resistance ที่สำคัญ (จากต่ำไปสูง):');
nearbyResistances.sort((a, b) => a - b).forEach((resistance, idx) => {
  const distance = ((resistance - currentPrice) / currentPrice * 100).toFixed(2);
  console.log(`   R${idx + 1}: ${resistance.toLocaleString('en-US', { maximumFractionDigits: 0 })} บาท (ห่างจากราคาปัจจุบัน +${distance}%)`);
});

// คาดการณ์ราคา
console.log('\n\n🔮 คาดการณ์ราคา Bitcoin');
console.log('═'.repeat(80));

// ถ้าขาลง
if (currentPrice < ma20Current) {
  console.log('📉 สถานะ: ขาลง\n');

  console.log('❌ กรณีที่ตลาดยังคงขาลงต่อเนื่อง:');

  const nextSupport1 = nearbySupports[0] || recentLow;
  const nextSupport2 = nearbySupports[1] || recentLow * 0.95;
  const nextSupport3 = nearbySupports[2] || recentLow * 0.90;

  console.log(`   🎯 Target 1: ${nextSupport1.toLocaleString('en-US', { maximumFractionDigits: 0 })} บาท (Support แรก)`);
  console.log(`      → ระยะทาง: ${((currentPrice - nextSupport1) / currentPrice * 100).toFixed(2)}%`);
  console.log(`   🎯 Target 2: ${nextSupport2.toLocaleString('en-US', { maximumFractionDigits: 0 })} บาท (Support ที่ 2)`);
  console.log(`      → ระยะทาง: ${((currentPrice - nextSupport2) / currentPrice * 100).toFixed(2)}%`);
  console.log(`   🎯 Target 3: ${nextSupport3.toLocaleString('en-US', { maximumFractionDigits: 0 })} บาท (Support ที่ 3)`);
  console.log(`      → ระยะทาง: ${((currentPrice - nextSupport3) / currentPrice * 100).toFixed(2)}%`);

  console.log('\n✅ กรณีที่ตลาดกลับตัวขาขึ้น (ต้องทะลุ Resistance):');

  const nextResistance1 = nearbyResistances[0] || ma20Current;
  const nextResistance2 = nearbyResistances[1] || ma50Current;
  const nextResistance3 = nearbyResistances[2] || recentHigh * 0.85;

  console.log(`   🎯 Target 1: ${nextResistance1.toLocaleString('en-US', { maximumFractionDigits: 0 })} บาท (MA20 / Resistance แรก)`);
  console.log(`      → ระยะทาง: +${((nextResistance1 - currentPrice) / currentPrice * 100).toFixed(2)}%`);
  console.log(`   🎯 Target 2: ${nextResistance2.toLocaleString('en-US', { maximumFractionDigits: 0 })} บาท (Resistance ที่ 2)`);
  console.log(`      → ระยะทาง: +${((nextResistance2 - currentPrice) / currentPrice * 100).toFixed(2)}%`);
  console.log(`   🎯 Target 3: ${nextResistance3.toLocaleString('en-US', { maximumFractionDigits: 0 })} บาท (Resistance ที่ 3)`);
  console.log(`      → ระยะทาง: +${((nextResistance3 - currentPrice) / currentPrice * 100).toFixed(2)}%`);
}

// ถ้าขาขึ้น
if (currentPrice > ma20Current) {
  console.log('📈 สถานะ: ขาขึ้น\n');

  console.log('✅ กรณีที่ตลาดยังคงขาขึ้นต่อเนื่อง:');

  const nextResistance1 = nearbyResistances[0] || ma50Current * 1.05;
  const nextResistance2 = nearbyResistances[1] || ma50Current * 1.10;
  const nextResistance3 = nearbyResistances[2] || recentHigh;

  console.log(`   🎯 Target 1: ${nextResistance1.toLocaleString('en-US', { maximumFractionDigits: 0 })} บาท (Resistance แรก)`);
  console.log(`      → ระยะทาง: +${((nextResistance1 - currentPrice) / currentPrice * 100).toFixed(2)}%`);
  console.log(`   🎯 Target 2: ${nextResistance2.toLocaleString('en-US', { maximumFractionDigits: 0 })} บาท (Resistance ที่ 2)`);
  console.log(`      → ระยะทาง: +${((nextResistance2 - currentPrice) / currentPrice * 100).toFixed(2)}%`);
  console.log(`   🎯 Target 3: ${nextResistance3.toLocaleString('en-US', { maximumFractionDigits: 0 })} บาท (จุดสูงสุด)`);
  console.log(`      → ระยะทาง: +${((nextResistance3 - currentPrice) / currentPrice * 100).toFixed(2)}%`);

  console.log('\n❌ กรณีที่ตลาดกลับตัวขาลง (หาก Support แตก):');

  const nextSupport1 = nearbySupports[0] || ma20Current;
  const nextSupport2 = nearbySupports[1] || ma50Current;
  const nextSupport3 = nearbySupports[2] || recentLow * 1.05;

  console.log(`   🎯 Target 1: ${nextSupport1.toLocaleString('en-US', { maximumFractionDigits: 0 })} บาท (MA20 / Support แรก)`);
  console.log(`      → ระยะทาง: ${((currentPrice - nextSupport1) / currentPrice * 100).toFixed(2)}%`);
  console.log(`   🎯 Target 2: ${nextSupport2.toLocaleString('en-US', { maximumFractionDigits: 0 })} บาท (Support ที่ 2)`);
  console.log(`      → ระยะทาง: ${((currentPrice - nextSupport2) / currentPrice * 100).toFixed(2)}%`);
  console.log(`   🎯 Target 3: ${nextSupport3.toLocaleString('en-US', { maximumFractionDigits: 0 })} บาท (Support ที่ 3)`);
  console.log(`      → ระยะทาง: ${((currentPrice - nextSupport3) / currentPrice * 100).toFixed(2)}%`);
}

// คำเตือน
console.log('\n\n⚠️  คำเตือน:');
console.log('─'.repeat(80));
console.log('• การวิเคราะห์นี้ใช้เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำในการลงทุน');
console.log('• ตลาด Crypto มีความผันผวนสูง ควรบริหารความเสี่ยงและตั้ง Stop Loss');
console.log('• ราคาอาจเคลื่อนไหวต่างจากคาดการณ์ได้ตลอดเวลา');
console.log('• ควรติดตามข่าวสารและปัจจัยพื้นฐานประกอบการตัดสินใจ\n');
