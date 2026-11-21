import mongoose from 'mongoose';

const carSchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      required: [true, 'Поле brand є обов\'язковим'],
      trim: true,
      minlength: [2, 'brand: щонайменше 2 символи'],
      maxlength: [100, 'brand: не більше 100 символів'],
    },
    model: {
      type: String,
      required: [true, 'Поле model є обов\'язковим'],
      trim: true,
      minlength: [2, 'model: щонайменше 2 символи'],
      maxlength: [100, 'model: не більше 100 символів'],
      unique: true,
    },
    year: {
      type: Number,
      required: [true, 'Поле year є обов\'язковим'],
      min: [1886, 'year: не менше 1886'],
      max: [2100, 'year: не більше 2100'],
      cast: 'year: значення має бути числом',
    },
    problem: {
      type: String,
      trim: true,
      maxlength: [500, 'problem: не більше 500 символів'],
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
     required: [true, 'У запису має бути власник'],
     index: true,
    },
  },
  {
    timestamps: true, // Автоматично додає createdAt та updatedAt
    toJSON: {
      virtuals: true, // Додає віртуальне поле id (рядкове представлення _id)
      versionKey: false, // Прибирає службове поле __v
      transform: (doc, ret) => {
        delete ret._id; // У JSON-відповіді API залишаємо лише поле id
      },
    },
  }
);

export default mongoose.model('Car', carSchema);
