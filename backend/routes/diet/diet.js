const express = require('express');
const Diet = require('../../models/diet');
const Profile = require('../../models/profile');

const router = express.Router();

// Add to diet.js routes
router.get('/:user_id', async (req, res) => {
    const { user_id } = req.params;
    try {
        const diet = await Diet.findOne({ user_id });
        if (!diet) return res.status(404).json({ message: 'Diet plan not found' });
        res.status(200).json(diet);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching diet', error: err });
    }
  });

  // PUT request to update both consumed and burned calories
router.put('/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const { calories } = req.body; // Expecting both consumed and burned calories in the body

    try {
        // Find the user's diet document
        const diet = await Diet.findOne({ user_id });
        if (!diet) {
            return res.status(404).json({ message: 'Diet plan not found for this user' });
        }

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Update consumed calories for today
        if (calories && calories.consumed !== undefined) {
            const existingConsumedEntry = diet.calories.consumed.find(entry => entry.date === today);
            if (existingConsumedEntry) {
                // Update existing entry
                existingConsumedEntry.amount = calories.consumed;
            } else {
                // Add new entry for today
                diet.calories.consumed.push({
                    date: today,
                    amount: calories.consumed
                });
            }
        }

        // Update burned calories for today
        if (calories && calories.burned !== undefined) {
            const existingBurnedEntry = diet.calories.burned.find(entry => entry.date === today);
            if (existingBurnedEntry) {
                // Update existing entry
                existingBurnedEntry.amount = calories.burned;
            } else {
                // Add new entry for today
                diet.calories.burned.push({
                    date: today,
                    amount: calories.burned
                });
            }
        }

        // Save the updated diet data
        await diet.save();

        // Return the updated diet data
        res.status(200).json({
            message: 'Diet plan updated successfully',
            diet: diet
        });
    } catch (err) {
        console.error('Error updating diet:', err);
        res.status(500).json({ message: 'Error updating diet', error: err });
    }
});
// Helper function to shuffle array
function shuffleArray(array) {
    let shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Helper function to generate meal plan based on user-selected foods
function generateMealPlan(userGoal, maintenanceCalories, selectedMeals) {
    const mealPlan = {
        breakfast: [],
        lunch: [],
        dinner: [],
        totalCalories: 0
    };

    // Calculate target calories based on goal
    let targetCalories;
    if (userGoal === 'gain') {
        targetCalories = maintenanceCalories + 500;
    } else if (userGoal === 'lose') {
        targetCalories = maintenanceCalories - 500;
    } else {
        targetCalories = maintenanceCalories;
    }

    // Generate a meal plan for a week (7 days)
    for (let i = 0; i < 7; i++) {
        // Select breakfast
        const breakfastIndex = i % selectedMeals.breakfast.length;
        const breakfastItem = {
            meal: selectedMeals.breakfast[breakfastIndex].name,
            calories: selectedMeals.breakfast[breakfastIndex].calories
        };
        mealPlan.breakfast.push(breakfastItem);

        // Select lunch
        const lunchIndex = i % selectedMeals.lunch.length;
        const lunchItem = {
            meal: selectedMeals.lunch[lunchIndex].name,
            calories: selectedMeals.lunch[lunchIndex].calories
        };
        mealPlan.lunch.push(lunchItem);

        // Select dinner
        const dinnerIndex = i % selectedMeals.dinner.length;
        const dinnerItem = {
            meal: selectedMeals.dinner[dinnerIndex].name,
            calories: selectedMeals.dinner[dinnerIndex].calories
        };
        mealPlan.dinner.push(dinnerItem);
    }

    // Calculate total daily calories
    const dailyCalories = mealPlan.breakfast.reduce((sum, item) => sum + item.calories, 0) +
                         mealPlan.lunch.reduce((sum, item) => sum + item.calories, 0) +
                         mealPlan.dinner.reduce((sum, item) => sum + item.calories, 0);

    // Adjust calories if needed (simple proportional adjustment)
    if (dailyCalories > 0) {
        const adjustmentFactor = targetCalories / (dailyCalories / 7);
        mealPlan.breakfast.forEach(item => item.calories = Math.round(item.calories * adjustmentFactor));
        mealPlan.lunch.forEach(item => item.calories = Math.round(item.calories * adjustmentFactor));
        mealPlan.dinner.forEach(item => item.calories = Math.round(item.calories * adjustmentFactor));
    }

    mealPlan.totalCalories = targetCalories;
    return mealPlan;
}

// API to generate a meal plan based on user selections
router.post('/generate-meal-plan/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const { breakfast, lunch, dinner } = req.body;

    try {
        const profile = await Profile.findOne({ user_id });
        const diet = await Diet.findOne({ user_id });

        if (!profile || !diet) {
            return res.status(404).json({ message: 'Profile or diet not found for this user' });
        }

        const userGoal = profile.fitness_goals.goal;
        const maintenanceCalories = profile.metrics.maintenance_calories;

        // Generate the meal plan
        const mealPlan = generateMealPlan(userGoal, maintenanceCalories, { breakfast, lunch, dinner });

        // Update consumed calories in the diet model
        const today = new Date();
        diet.meal_plans = mealPlan;
        diet.calories.consumed.push({
            date: today,
            amount: mealPlan.totalCalories
        });
        diet.last_updated = today;
        
        await diet.save();

        res.status(200).json({ 
            message: 'Meal plan generated successfully', 
            mealPlan 
        });
    } catch (err) {
        console.error('Error generating meal plan:', err);
        res.status(500).json({ message: 'Error generating meal plan', error: err });
    }
});

//api to add calories for the day
router.post('/add-calories/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const { calories } = req.body;

    try {
        const diet = await Diet.findOne({ user_id });
        if (!diet) {
            return res.status(404).json({ message: 'Diet not found for this user' });
        }

        // Add today's calories to the consumed calories array
        const today = new Date();
        diet.calories.consumed.push({
            date: today,
            amount: calories
        });

        await diet.save();
        res.status(200).json({ message: 'Calories added successfully', diet });
    } catch (err) {
        console.error('Error adding calories:', err);
        res.status(500).json({ message: 'Error adding calories', error: err });
    }
});
// API to shuffle the meal plan
router.post('/shuffle/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const { type } = req.body;

    try {
        const diet = await Diet.findOne({ user_id });
        if (!diet) {
            return res.status(404).json({ message: 'Diet plan not found for this user' });
        }

        let shuffledMealPlan = JSON.parse(JSON.stringify(diet.meal_plans));

        if (type === "today") {
            const todayIndex = new Date().getDay() - 1; // 0-6 for Monday-Sunday
            
            // Shuffle today's meals only
            shuffledMealPlan.breakfast = [...diet.meal_plans.breakfast];
            shuffledMealPlan.lunch = [...diet.meal_plans.lunch];
            shuffledMealPlan.dinner = [...diet.meal_plans.dinner];
            
            // Swap today's meals with random days
            const swapIndex = Math.floor(Math.random() * 7);
            
            // Breakfast swap
            [shuffledMealPlan.breakfast[todayIndex], shuffledMealPlan.breakfast[swapIndex]] = 
            [shuffledMealPlan.breakfast[swapIndex], shuffledMealPlan.breakfast[todayIndex]];

            // Lunch swap
            [shuffledMealPlan.lunch[todayIndex], shuffledMealPlan.lunch[swapIndex]] = 
            [shuffledMealPlan.lunch[swapIndex], shuffledMealPlan.lunch[todayIndex]];

            // Dinner swap
            [shuffledMealPlan.dinner[todayIndex], shuffledMealPlan.dinner[swapIndex]] = 
            [shuffledMealPlan.dinner[swapIndex], shuffledMealPlan.dinner[todayIndex]];
        } else {
            // Shuffle entire week's plan
            shuffledMealPlan.breakfast = shuffleArray(diet.meal_plans.breakfast);
            shuffledMealPlan.lunch = shuffleArray(diet.meal_plans.lunch);
            shuffledMealPlan.dinner = shuffleArray(diet.meal_plans.dinner);
        }

        diet.meal_plans = shuffledMealPlan;
        diet.last_updated = new Date();
        await diet.save();

        res.status(200).json({ 
            message: 'Meal plan shuffled successfully', 
            mealPlan: shuffledMealPlan 
        });
    } catch (err) {
        console.error('Error shuffling meal plan:', err);
        res.status(500).json({ message: 'Error shuffling meal plan', error: err });
    }
});

// API to get food categories (e.g., breakfast, lunch, dinner) and their calories
router.get('/food-categories/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        // Debugging log to confirm if user_id is being passed correctly
        console.log('Fetching food categories for user:', user_id);

        // Fetch profile first
        const profile = await Profile.findOne({ user_id });
        console.log('Fetched Profile:', profile); // Log the fetched profile for debugging
        
        // Check if profile is not found
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found for this user' });
        }

        // Fetch diet data
        let diet = await Diet.findOne({ user_id });
        console.log('Fetched Diet:', diet); // Log the fetched diet for debugging

        // If the diet doesn't exist, create a default diet
        if (!diet) {
            console.log('Creating new diet for user');
            diet = new Diet({
                user_id: user_id,
                meal_plans: {
                    breakfast: [],
                    lunch: [],
                    dinner: [],
                    totalCalories: 0
                },
                calories: {
                    burned: [],
                    consumed: []
                },
                bmr: profile.metrics.bmr || 0,  // Use profile's BMR
                food_calories: {
                    breakfast: {
                        "Egg": 78,
                        "Oatmeal (1 cup)": 154,
                        "Banana (1 medium)": 105,
                        "Avocado (1 medium)": 240,
                        "Whole Wheat Toast (1 slice)": 70,
                        "Greek Yogurt (1 cup, plain)": 100,
                    },
                    lunch: {
                        "Chicken Breast (100g)": 165,
                        "Brown Rice (1 cup cooked)": 215,
                        "Sweet Potato (100g)": 94,
                        "Broccoli (100g)": 35,
                        "Salmon (100g)": 206,
                    },
                    dinner: {
                        "Grilled Chicken (100g)": 165,
                        "Roasted Vegetables (1 cup)": 120,
                        "Spaghetti (whole wheat, 1 cup cooked)": 174,
                    }
                },
                last_updated: new Date()
            });
            await diet.save();  // Save the new diet to the database
        }

        // Convert the food_calories schema to the required format
        const foodCategories = {
            breakfast: Object.entries(diet.food_calories.breakfast).map(([name, calories]) => ({
                name,
                calories
            })),
            lunch: Object.entries(diet.food_calories.lunch).map(([name, calories]) => ({
                name,
                calories
            })),
            dinner: Object.entries(diet.food_calories.dinner).map(([name, calories]) => ({
                name,
                calories
            }))
        };

        // Return the food categories to the frontend
        res.status(200).json(foodCategories);
    } catch (err) {
        console.error('Error fetching food categories:', err);
        res.status(500).json({ message: 'Error fetching food categories', error: err });
    }
});


module.exports = router;
