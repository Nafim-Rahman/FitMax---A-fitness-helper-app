document.getElementById('generateWorkout').addEventListener('click', function() {
    const fitnessLevel = document.getElementById('fitnessLevel').value;
    const userId = localStorage.getItem('user_id');  // Assuming the user is logged in

    if (!userId) {
        alert('User not signed in. Please log in.');
        window.location.href = '/';
        return;
    }

    // Fetch workout plan from the API
    fetch(`/api/workouts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: userId,
            fitness_level: fitnessLevel
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message);
        }

        // Display the generated workout plan
        displayWorkoutPlan(data.workout);
    })
    .catch(error => {
        console.error('Error generating workout:', error);
        alert('Could not generate workout plan. Please try again later.');
    });
});

// Function to display the generated workout plan
function displayWorkoutPlan(workout) {
    const workoutDetails = document.getElementById('workoutDetails');
    workoutDetails.innerHTML = ''; // Clear any previous content

    const workoutPlan = workout.workout_plan;
    workoutPlan.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day-plan');
        dayDiv.innerHTML = `<h4>${day.day} - ${day.workout_type.toUpperCase()}</h4>`;

        day.exercises.forEach(exercise => {
            const exerciseDiv = document.createElement('p');
            exerciseDiv.innerHTML = `${exercise.name} - ${exercise.sets} sets of ${exercise.reps} reps`;
            dayDiv.appendChild(exerciseDiv);
        });

        workoutDetails.appendChild(dayDiv);
    });
}
