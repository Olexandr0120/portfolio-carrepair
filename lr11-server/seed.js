import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/User.js';
import Car from './models/Car.js';

if (!process.env.MONGODB_URI) {
  console.error('Не задано MONGODB_URI. Перевірте файл .env');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

// Очищаємо обидві колекції та синхронізуємо унікальні індекси
await Car.deleteMany({});
await User.deleteMany({});
await User.syncIndexes();
await Car.syncIndexes();

const PASSWORD = 'Passw0rd!';
// Для кожного користувача хеш обчислюється окремо: сіль різна, тому хеші однакового пароля відрізняються
const hashPassword = () => bcrypt.hash(PASSWORD, 10);

const [admin, alice, bob] = await User.insertMany([
  { name: 'Адміністратор', email: 'admin@example.com', passwordHash: await hashPassword(), role: 'admin' },
  { name: 'Аліса', email: 'alice@example.com', passwordHash: await hashPassword() },
  { name: 'Богдан', email: 'bob@example.com', passwordHash: await hashPassword() },
]);

const created = await Car.insertMany([
  { brand: 'Toyota', model: 'Camry', year: 2020, owner: alice._id },
  { brand: 'Honda', model: 'Civic', year: 2019, owner: alice._id },
  { brand: 'BMW', model: 'X5', year: 2021, owner: bob._id },
  { brand: 'Mercedes', model: 'E-Class', year: 2022, owner: bob._id },
  { brand: 'Audi', model: 'A6', year: 2020, owner: admin._id },
]);

console.log(`Додано користувачів: 3, записів: ${created.length}`);
console.log(`Для входу використовуйте пароль "${PASSWORD}" (admin@example.com, alice@example.com, bob@example.com)`);
await mongoose.disconnect();