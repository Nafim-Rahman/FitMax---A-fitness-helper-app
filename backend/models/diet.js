const mongoose = require('mongoose');

const dietSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  meal_plans: { type: Object, required: true },
  calories: {
    consumed: [{ date: Date, amount: Number }],
    burned: [{ date: Date, amount: Number }]
  },
  bmr: { type: Number, required: true },
  custom_meals: { type: Object },
  nutrition_notes: { type: [String] },
  food_calories: {
    breakfast: {
      "Egg": { type: Number, required: true },
      "Oatmeal (1 cup)": { type: Number, required: true },
      "Banana (1 medium)": { type: Number, required: true },
      "Avocado (1 medium)": { type: Number, required: true },
      "Whole Wheat Toast (1 slice)": { type: Number, required: true },
      "Greek Yogurt (1 cup, plain)": { type: Number, required: true },
      "Smoothie (1 cup)": { type: Number, required: true },
      "Cottage Cheese (1/2 cup)": { type: Number, required: true },
      "Chia Seeds (1 tbsp)": { type: Number, required: true }
    },
    lunch: {
      "Chicken Breast (100g)": { type: Number, required: true },
      "Brown Rice (1 cup cooked)": { type: Number, required: true },
      "Sweet Potato (100g)": { type: Number, required: true },
      "Broccoli (100g)": { type: Number, required: true },
      "Salmon (100g)": { type: Number, required: true },
      "Quinoa (1 cup cooked)": { type: Number, required: true },
      "Mixed Greens Salad (1 cup)": { type: Number, required: true },
      "Hummus (2 tbsp)": { type: Number, required: true },
      "Avocado (1 medium)": { type: Number, required: true }
    },
    dinner: {
      "Grilled Chicken (100g)": { type: Number, required: true },
      "Roasted Vegetables (1 cup)": { type: Number, required: true },
      "Spaghetti (whole wheat, 1 cup cooked)": { type: Number, required: true },
      "Tofu (100g)": { type: Number, required: true },
      "Steak (lean, 100g)": { type: Number, required: true },
      "Brown Rice (1 cup cooked)": { type: Number, required: true },
      "Asparagus (100g)": { type: Number, required: true },
      "Cauliflower (100g)": { type: Number, required: true },
      "Lentils (1/2 cup cooked)": { type: Number, required: true }
    }
  },
  last_updated: { type: Date, required: true }
});

// Create the Diet model
const Diet = mongoose.model('Diet', dietSchema);

module.exports = Diet;  // Ensure the Diet model is being correctly exported
