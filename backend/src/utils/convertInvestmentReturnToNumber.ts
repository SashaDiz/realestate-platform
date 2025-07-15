// Этот скрипт конвертирует поле investmentReturn из строки в число для всех объектов
// Запускать: node src/utils/convertInvestmentReturnToNumber.js

const mongoose = require('mongoose');
const Property = require('../models/Property').default;
const connectDB = require('../config/database').default;

console.log('cwd:', process.cwd());
console.log('__dirname:', __dirname);

async function migrateInvestmentReturn() {
  await connectDB();
  const properties = await Property.find({ investmentReturn: { $type: 'string' } });
  let updated = 0;
  for (const doc of properties) {
    const str = doc.investmentReturn;
    if (!str) continue;
    const match = str.match(/(\d+([\.,]\d+)?)/);
    const num = match ? parseFloat(match[1].replace(',', '.')) : null;
    if (num !== null) {
      doc.investmentReturn = num;
      await doc.save();
      updated++;
    } else {
      doc.investmentReturn = undefined;
      await doc.save();
    }
  }
  console.log(`\nГотово! Обновлено объектов: ${updated}`);
  mongoose.connection.close();
}

migrateInvestmentReturn().catch(err => {
  console.error('Ошибка миграции:', err);
  mongoose.connection.close();
});
