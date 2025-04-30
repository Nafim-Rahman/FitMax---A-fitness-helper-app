function getUserIdFromSession() {
    const userId = localStorage.getItem('user_id');  // Assuming the user is logged in
    return userId;
}

// Check if the user is logged in before allowing any action
let userId = getUserIdFromSession();

if (!userId) {
    alert('User not signed in. Please log in.');
    window.location.href = '/'; // Redirect to the login page if not logged in
} else {
    let currentMealPlan = null;

    async function fetchProfile() {
        const response = await fetch(`/api/profile/${userId}`);
        if (!response.ok) return null;
        return (await response.json()).profile;
    }

    // Removed the fetchFoodCategories function

    async function generateMealPlan() {
        const statusDiv = document.getElementById('mealPlanStatus');
        statusDiv.textContent = 'Generating...';

        try {
            const profile = await fetchProfile();
            
            // Hardcoded meal categories (can be adjusted)
            const foodCategories = {
                breakfast: [
                    { name: "Egg", calories: 78 },
                    { name: "Oatmeal (1 cup)", calories: 154 },
                    { name: "Banana (1 medium)", calories: 105 },
                    // Add more food items as needed
                ],
                lunch: [
                    { name: "Chicken Breast (100g)", calories: 165 },
                    { name: "Brown Rice (1 cup cooked)", calories: 215 },
                    { name: "Sweet Potato (100g)", calories: 94 },
                    // Add more food items as needed
                ],
                dinner: [
                    { name: "Grilled Chicken (100g)", calories: 165 },
                    { name: "Roasted Vegetables (1 cup)", calories: 120 },
                    { name: "Spaghetti (whole wheat, 1 cup cooked)", calories: 174 },
                    // Add more food items as needed
                ]
            };

            // Generate the meal plan using hardcoded categories
            const response = await fetch(`/api/diet/generate-meal-plan/${userId}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    breakfast: foodCategories.breakfast,
                    lunch: foodCategories.lunch,
                    dinner: foodCategories.dinner
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error('Failed to generate meal plan');
            }

            currentMealPlan = data.mealPlan;
            displayMealPlan(currentMealPlan);
            statusDiv.textContent = 'Meal plan generated!';

            // Use 'totalCalories' from the response to update both 'consumed' and 'burned' calories for today
            const totalCaloriesToday = currentMealPlan.totalCalories;
            const totalBurnedCalories = totalCaloriesToday * 0.8; // Example: Burned calories = 80% of consumed calories (adjust as needed)

            // Update consumed and burned calories for today directly in the backend
            const today = new Date();
            const todayDate = today.toISOString().split('T')[0];  // Format the date as YYYY-MM-DD

            // Send the update to the backend
            const dietResponse = await fetch(`/api/diet/${userId}`, {
                method: 'GET',
                headers: {'Content-Type': 'application/json'}
            });

            const dietData = await dietResponse.json();
            const diet = dietData.diet || { calories: { consumed: [], burned: [] } };

            // Check if the calories for today already exist and update them
            const existingConsumedEntry = diet.calories.consumed.find(entry => entry.date === todayDate);
            if (existingConsumedEntry) {
                existingConsumedEntry.amount = totalCaloriesToday;
            } else {
                // Otherwise, create a new entry for consumed calories
                diet.calories.consumed.push({ date: todayDate, amount: totalCaloriesToday });
            }

            // Update burned calories
            const existingBurnedEntry = diet.calories.burned.find(entry => entry.date === todayDate);
            if (existingBurnedEntry) {
                existingBurnedEntry.amount = totalBurnedCalories;
            } else {
                // Otherwise, create a new entry for burned calories
                diet.calories.burned.push({ date: todayDate, amount: totalBurnedCalories });
            }

            // Save the updated diet data
            await fetch(`/api/diet/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(diet)
            });

            document.getElementById('totalCaloriesToday').textContent = `Total Calories Consumed Today: ${totalCaloriesToday} kcal`;
            alert('Calories updated successfully!');
        } catch (error) {
            console.error(error);
            statusDiv.textContent = 'Error generating plan';
        }
    }

    async function shuffleMeals(type) {
        try {
            const response = await fetch(`/api/diet/shuffle/${userId}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({type})
            });

            const data = await response.json();
            currentMealPlan = data.mealPlan;
            displayMealPlan(currentMealPlan);
        } catch (error) {
            alert('Shuffle failed');
        }
    }

    function displayMealPlan(mealPlan) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const tbody = document.querySelector('#mealPlanTable tbody');
        tbody.innerHTML = '';

        days.forEach((day, i) => {
            const totalCal = mealPlan.breakfast[i].calories + 
                            mealPlan.lunch[i].calories + 
                            mealPlan.dinner[i].calories;
            tbody.innerHTML += `
                <tr>
                    <td>${day}</td>
                    <td>${mealPlan.breakfast[i].meal} (${mealPlan.breakfast[i].calories})</td>
                    <td>${mealPlan.lunch[i].meal} (${mealPlan.lunch[i].calories})</td>
                    <td>${mealPlan.dinner[i].meal} (${mealPlan.dinner[i].calories})</td>
                    <td>${totalCal}</td>
                </tr>
            `;
        });
    }

    // Add event listener for "Meals Completed for Today" button
    document.getElementById('mealsCompletedToday').addEventListener('click', () => {
        const today = new Date().getDay(); // Get the day of the week (0 for Sunday, 1 for Monday, etc.)
        
        if (!currentMealPlan) {
            alert('Meal plan data is not available.');
            return;
        }

        const totalCaloriesToday = currentMealPlan.breakfast[today].calories + 
                                    currentMealPlan.lunch[today].calories + 
                                    currentMealPlan.dinner[today].calories;

        // Directly update consumed and burned calories for the day in the backend
        fetch(`/api/diet/${userId}`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        })
        .then(res => res.json())
        .then(dietData => {
            const diet = dietData.diet || { calories: { consumed: [], burned: [] } };
            const todayDate = new Date().toISOString().split('T')[0];

            // Update consumed calories
            const existingConsumedEntry = diet.calories.consumed.find(entry => entry.date === todayDate);
            if (existingConsumedEntry) {
                existingConsumedEntry.amount = totalCaloriesToday;
            } else {
                diet.calories.consumed.push({ date: todayDate, amount: totalCaloriesToday });
            }

            // Burned calories (80% of consumed calories for this example)
            const totalBurnedCalories = totalCaloriesToday * 0.8;
            const existingBurnedEntry = diet.calories.burned.find(entry => entry.date === todayDate);
            if (existingBurnedEntry) {
                existingBurnedEntry.amount = totalBurnedCalories;
            } else {
                diet.calories.burned.push({ date: todayDate, amount: totalBurnedCalories });
            }

            // Save the updated diet data
            fetch(`/api/diet/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(diet)
            });

            document.getElementById('totalCaloriesToday').textContent = `Total Calories Consumed Today: ${totalCaloriesToday} kcal`;
            alert('Calories updated successfully!');
        })
        .catch(err => {
            console.error("Error adding calories:", err);
            alert("An error occurred while updating calories.");
        });
    });

    // Initial load
    document.addEventListener('DOMContentLoaded', async () => {
        const dietResponse = await fetch(`/api/diet/${userId}`);
        if (dietResponse.ok) {
            currentMealPlan = (await dietResponse.json()).meal_plans;
            if (currentMealPlan) displayMealPlan(currentMealPlan);
        }
    });

    // Event listeners for buttons
    document.getElementById('generateMealPlan').addEventListener('click', generateMealPlan);
    document.getElementById('shuffleToday').addEventListener('click', () => shuffleMeals('today'));
    document.getElementById('shuffleWeek').addEventListener('click', () => shuffleMeals('week'));
}
