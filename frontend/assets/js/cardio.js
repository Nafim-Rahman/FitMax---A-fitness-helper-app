// Function to get the user_id from localStorage (or sessionStorage if needed)
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
    let stepsTaken = 0;
    let manualSteps = 0; // For the manually inputted steps
    let timerInterval;
    let totalTime = 0;

    // Set Goal Functionality
    document.getElementById('setGoalButton').addEventListener('click', function() {
        const goalMiles = document.getElementById('mileGoal').value;
        if (goalMiles) {
            axios.put(`/api/cardio/set-goals/${userId}`, {
                goal_miles: goalMiles,
                type_of_activity: 'walking'
            })
            .then(response => {
                alert('Goal set successfully!');
            })
            .catch(error => {
                console.error(error);
            });
        } else {
            alert('Please enter a mile goal.');
        }
    });

    // Start Walking Timer
    document.getElementById('startWalkingButton').addEventListener('click', function() {
        document.getElementById('startWalkingButton').style.display = 'none';
        document.getElementById('stopWalkingButton').style.display = 'inline-block';

        timerInterval = setInterval(() => {
            totalTime++;
            stepsTaken++; // Assuming each second equals 1 step
            document.getElementById('stepsCount').textContent = stepsTaken;
        }, 1000);
    });

    // Stop Walking Timer and Save Steps
    document.getElementById('stopWalkingButton').addEventListener('click', function() {
        clearInterval(timerInterval);
        document.getElementById('stopWalkingButton').style.display = 'none';
        document.getElementById('startWalkingButton').style.display = 'inline-block';

        // Save the steps taken to the backend
        if (userId) {
            axios.put(`/api/cardio/track-steps/${userId}`, {
                daily_steps: [stepsTaken + manualSteps]  // Combine manual steps with timer steps
            })
            .then(response => {
                console.log('Steps saved');
            })
            .catch(error => {
                console.error('Error saving steps', error);
            });

            // Check if goal is met and award heart points
            axios.get(`/api/cardio/${userId}`)
            .then(response => {
                const cardio = response.data.cardio;
                const goalMiles = cardio.cardio_goals.goal_miles;
                const stepsInMiles = (stepsTaken + manualSteps) / 2000; // Approximate conversion
                if (stepsInMiles >= goalMiles) {
                    const newHeartPoints = cardio.heart_points + 1; // Add heart point
                    axios.put(`/api/cardio/track-timer/${userId}`, {
                        cardio_timer: totalTime
                    })
                    .then(() => {
                        console.log('Heart points awarded');
                    })
                    .catch(error => {
                        console.error('Error updating heart points', error);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching cardio data', error);
            });
        } else {
            console.error('User is not logged in');
        }
    });

    // "Already walked today? Add the steps!" Button
    document.getElementById('addManualStepsButton').addEventListener('click', function() {
        const manualStepsInput = prompt("Enter the steps you walked today:");
        if (manualStepsInput && !isNaN(manualStepsInput) && manualStepsInput > 0) {
            manualSteps = parseInt(manualStepsInput);
            alert(`You've added ${manualSteps} steps.`);
        } else {
            alert('Please enter a valid number of steps.');
        }
    });

    // Save Button to update both steps and goal for the day
    document.getElementById('saveButton').addEventListener('click', function() {
        const goalMiles = document.getElementById('mileGoal').value;
        if (goalMiles) {
            axios.put(`/api/cardio/set-goals/${userId}`, {
                goal_miles: goalMiles,
                type_of_activity: 'walking'
            })
            .then(response => {
                alert('Goal saved successfully!');
            })
            .catch(error => {
                console.error(error);
            });
        }

        // Save the steps (including manual input and timer)
        axios.put(`/api/cardio/track-steps/${userId}`, {
            daily_steps: [stepsTaken + manualSteps]  // Combine manual steps with timer steps
        })
        .then(response => {
            alert('Steps saved successfully!');
        })
        .catch(error => {
            console.error('Error saving steps', error);
        });
    });

    // Reset Button to clear both steps and goal for the day
    document.getElementById('resetButton').addEventListener('click', function() {
        stepsTaken = 0;
        manualSteps = 0;
        totalTime = 0;
        document.getElementById('stepsCount').textContent = stepsTaken;
        document.getElementById('mileGoal').value = '';  // Reset the mile goal
        alert('All data for today has been reset.');
    });
}
