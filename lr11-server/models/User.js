import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Поле name є обов\'язковим'],
    trim: true,
    minlength: [2, 'name: щонайменше 2 символи'],
    maxlength: [50, 'name: не більше 50 символів'],
  },
  email: {
    type: String,
    required: [true, 'Поле email є обов\'язковим'],
    trim: true,
    lowercase: true,
    unique: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'email: некоректний формат'],
  },
  passwordHash: {
    type: String,
    required: true,
    select: false, // Хеш не потрапляє у вибірки, доки його явно не запитано
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.passwordHash; // Хеш ніколи не повертається клієнту
    },
  },
});


export default mongoose.model('User', userSchema);