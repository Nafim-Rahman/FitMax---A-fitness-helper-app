const userId = localStorage.getItem("user_id"); // Get user ID from sign-in

if (!userId) {
  alert("User not signed in. Please log in.");
  window.location.href = '/';
}

// Fetch Profile, Cardio, Diet and Workout Data
fetch(`/api/profile/${userId}`)
  .then(res => res.json())
  .then(data => {
    const metrics = data.profile.metrics;
    const goals = data.profile.fitness_goals;
    const progress = data.profile.progress;

    // Display profile information
    document.getElementById('weight').textContent = `Weight: ${metrics.weight}kg`;
    document.getElementById('bmi').textContent = `BMI: ${metrics.bmi}`;
    document.getElementById('bmr').textContent = `BMR: ${metrics.bmr}`;
    document.getElementById('heart_rate').textContent = `Heart Rate: ${metrics.heart_rate || 'N/A'}`;
    document.getElementById('sleep').textContent = `Sleep Hours: ${metrics.sleep_hours || 'N/A'}`;

    document.getElementById('goal').textContent = `Goal: ${goals.goal}`;
    document.getElementById('level').textContent = `Fitness Level: ${goals.fitness_level}`;

    document.getElementById('workouts').textContent = `Workouts: ${progress.workouts_completed}`;
    document.getElementById('cardio').textContent = `Cardio: ${progress.cardio_goals_completed}`;
    document.getElementById('calories').textContent = `Calories Burned: ${progress.calories_burned}`;

    // Fetch Cardio Data (Daily Steps)
    fetch(`/api/cardio/${userId}`)
      .then(res => res.json())
      .then(cardioData => {
        const dailySteps = cardioData.cardio.daily_steps;  // Get daily steps from cardio data
        renderStepChart(dailySteps);
      })
      .catch(err => {
        console.error("Failed to load cardio data:", err);
        alert("Could not load cardio data. Please try again later.");
      });

    // Fetch Diet Data (Burned and Consumed Calories)
    fetch(`/api/diet/${userId}`)
      .then(res => res.json())
      .then(dietData => {
        const burnedCalories = dietData.calories ? dietData.calories.burned : [];
        const consumedCalories = dietData.calories ? dietData.calories.consumed: [];
        
        // Render the charts with the fetched data
        renderCaloriesCharts(burnedCalories, consumedCalories);
      })
      .catch(err => {
        console.error("Failed to load diet data:", err);
        alert("Could not load diet data. Please try again later.");
      });
  })
  .catch(err => {
    console.error("Failed to load profile data:", err);
    alert("Could not load profile data. Please try again later.");
  });

// Function to render Burnt and Gained Calories charts
function renderCaloriesCharts(burnedCalories, consumedCalories) {
  console.log("Rendering Burnt Calories:", burnedCalories); // Verify data
  console.log("Rendering Gained Calories:", consumedCalories); // Verify data
  
  // Burnt Calories chart (line chart)
  new Chart(document.getElementById("burnChart"), {
    type: 'line',
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{
        label: 'Burnt Calories',
        data: burnedCalories, // Use actual data for each day
        borderColor: '#aa66ff',
        fill: false
      }]
    },
    options: { responsive: true }
  });

  // Gained Calories chart (line chart)
  new Chart(document.getElementById("gainChart"), {
    type: 'line',
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{
        label: 'Gained Calories',
        data: consumedCalories, // Use actual data for each day
        borderColor: '#66ccff',
        fill: false
      }]
    },
    options: { responsive: true }
  });
}

// Function to render Daily Step Count chart
function renderStepChart(steps) {
  new Chart(document.getElementById("stepChart"), {
    type: 'bar',
    data: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{
        label: 'Steps',
        data: steps, // Use the fetched daily steps data
        backgroundColor: '#ffaa00'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// Fetch and update the Today's Workout button status in Sidebar
fetch(`/api/profile/${userId}`)
  .then(res => res.json())
  .then(data => {
    const dailySummary = data.profile.daily_summary;
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    const todaySummary = dailySummary.find(summary => summary.date === today);

    // Modify the "Today's Workout" button text and status based on completion
    const todaysWorkoutLink = document.getElementById("todaysWorkoutLink");

    if (todaySummary && todaySummary.workout_completed) {
      todaysWorkoutLink.textContent = "Today's Workout - Completed"; // Change text
      todaysWorkoutLink.style.color = "green"; // Optional: change color for completed status
    }
  })
  .catch(err => {
    console.error("Error fetching profile data:", err);
    alert("Could not fetch profile data. Please try again later.");
  });
