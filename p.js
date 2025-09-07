let transactions = [
  { amount: 1151515 },
  { amount: 10 },
  { amount: -30000 },
  { amount: -1000000 },
  { amount: 5000 },
  { amount: 2000 },
  { amount: 555555555 },
  { amount: 5555 },
  { amount: 55 },
  { amount: 55 },
  { amount: 5 },
  { amount: 5 },
  { amount: 555555 }
];

let totalIncome = transactions
  .filter(t => t.amount > 0)
  .reduce((sum, t) => sum + t.amount, 0);

let totalExpense = transactions
  .filter(t => t.amount < 0)
  .reduce((sum, t) => sum + Math.abs(t.amount), 0);

let balance = totalIncome - totalExpense;

document.getElementById("summary").innerHTML = `
  <p>💰 รายรับทั้งหมด: ${totalIncome.toLocaleString()} บาท</p>
  <p>📉 รายจ่ายทั้งหมด: ${totalExpense.toLocaleString()} บาท</p>
  <p>🧮 ยอดคงเหลือ: ${balance.toLocaleString()} บาท</p>
`;
