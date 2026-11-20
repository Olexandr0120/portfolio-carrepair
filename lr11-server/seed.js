import mongoose from 'mongoose';
import Car from './models/Car.js';

if (!process.env.MONGODB_URI) {
  console.error('Не задано MONGODB_URI. Запускайте скрипт через: npm run seed');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Підключено до бази: ${mongoose.connection.name}`);

  // Очищаємо колекцію перед повторним наповненням
  await Car.deleteMany({});

  const created = await Car.insertMany([
    { brand: 'Toyota', model: 'Camry', year: 2020 },
    { brand: 'Honda', model: 'Civic', year: 2019 },
    { brand: 'BMW', model: 'X5', year: 2021 },
    { brand: 'Mercedes', model: 'E-Class', year: 2022 },
    { brand: 'Audi', model: 'A6', year: 2020 },
  ]);

  console.log(`Додано початкових записів: ${created.length}`);
} catch (err) {
  console.error('Помилка під час наповнення бази даних:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}