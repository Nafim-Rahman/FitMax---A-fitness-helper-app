const express = require('express');
const Cardio = require('../../models/cardio');
const router = express.Router();

// Helper function to check if dates are in same week (fixed)
function isSameWeek(d1, d2) {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(d1);
  const secondDate = new Date(d2);
  
  // Reset time components to avoid timezone issues
  firstDate.setHours(0, 0, 0, 0);
  secondDate.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
  
  // Check if dates are in the same week
  if (diffDays >= 7) return false;
  
  // Find Sunday of the week for each date
  const sunday1 = new Date(firstDate);
  sunday1.setDate(firstDate.getDate() - firstDate.getDay());
  
  const sunday2 = new Date(secondDate);
  sunday2.setDate(secondDate.getDate() - secondDate.getDay());
  
  return sunday1.getTime() === sunday2.getTime();
}

// API 1: Track daily steps
router.put('/track-steps/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { daily_steps } = req.body;

  try {
    const cardio = await Cardio.findOne({ user_id });
    if (!cardio) return res.status(404).json({ message: 'No record found' });

    // Reset weekly counter if new week
    if (!cardio.cardio_goals.last_week_reset || 
        !isSameWeek(new Date(), cardio.cardio_goals.last_week_reset)) {
      cardio.cardio_goals.current_week_steps = 0;
      cardio.cardio_goals.last_week_reset = new Date();
    }

    // Add steps (handles both single number and array inputs)
    const stepsToAdd = typeof daily_steps === 'number' ? daily_steps : 
                      Array.isArray(daily_steps) ? daily_steps.reduce((a,b) => a + b, 0) : 0;
    
    cardio.daily_steps.push({ date: new Date(), steps: stepsToAdd });
    cardio.cardio_goals.current_week_steps += stepsToAdd;
    cardio.last_updated = new Date();

    await cardio.save();
    res.status(200).json({ message: 'Steps tracked', cardio });
  } catch (err) {
    res.status(500).json({ message: 'Error tracking steps', error: err });
  }
});

// API 2: Set or update cardio goals
router.put('/set-goals/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { goal_miles, type_of_activity } = req.body;

  try {
    const cardio = await Cardio.findOne({ user_id });
    if (!cardio) {
      return res.status(404).json({ message: 'No cardio record found for this user' });
    }

    cardio.cardio_goals.goal_miles = goal_miles;
    cardio.cardio_goals.type_of_activity = type_of_activity;
    cardio.last_updated = new Date();

    await cardio.save();
    res.status(200).json({ message: 'Cardio goals set successfully', cardio });
  } catch (err) {
    res.status(500).json({ message: 'Error setting cardio goals', error: err });
  }
});

// API 3: Track timer for walking/running sessions
router.put('/track-timer/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { cardio_timer } = req.body;  // Timer in minutes

  try {
    const cardio = await Cardio.findOne({ user_id });
    if (!cardio) {
      return res.status(404).json({ message: 'No cardio record found for this user' });
    }

    cardio.cardio_timer = (cardio.cardio_timer || 0) + cardio_timer;
    // Award heart points (1 heart point per 10 minutes of activity)
    cardio.heart_points = Math.floor(cardio.cardio_timer / 10);
    cardio.last_updated = new Date();

    await cardio.save();
    res.status(200).json({ message: 'Cardio timer tracked successfully', cardio });
  } catch (err) {
    res.status(500).json({ message: 'Error tracking cardio timer', error: err });
  }
});

// API 4: Get cardio details for a specific user
router.get('/:user_id', async (req, res) => {
  const { user_id } = req.params;

  try {
    const cardio = await Cardio.findOne({ user_id });
    if (!cardio) {
      return res.status(404).json({ message: 'No cardio record found for this user' });
    }
    res.status(200).json({ cardio });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cardio details', error: err });
  }
});

// API 5: Get weekly progress
router.get('/weekly-progress/:user_id', async (req, res) => {
  try {
    const cardio = await Cardio.findOne({ user_id: req.params.user_id });
    if (!cardio) return res.status(404).json({ message: 'No record found' });

    const progress = {
      currentSteps: cardio.cardio_goals.current_week_steps,
      weeklyGoal: cardio.cardio_goals.weekly_goal || 70000, // Default if not set
      progressPercent: Math.min(
        (cardio.cardio_goals.current_week_steps / (cardio.cardio_goals.weekly_goal || 70000)) * 100, 
        100
      ),
      streak: cardio.weekly_rewards.streak_count || 0,
      daysRemaining: 7 - (new Date().getDay() || 7) // Days left in week
    };

    res.status(200).json(progress);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching progress', error: err });
  }
});

// API 6: Claim weekly reward
router.post('/claim-reward/:user_id', async (req, res) => {
  try {
    const cardio = await Cardio.findOne({ user_id: req.params.user_id });
    if (!cardio) return res.status(404).json({ message: 'No record found' });

    // Check if weekly goal was met
    if (cardio.cardio_goals.current_week_steps < (cardio.cardio_goals.weekly_goal || 70000)) {
      return res.status(400).json({ message: 'Weekly goal not reached' });
    }

    // Check if reward already claimed this week
    const lastClaimed = cardio.weekly_rewards.last_reward_claimed;
    if (lastClaimed && isSameWeek(new Date(), lastClaimed)) {
      return res.status(400).json({ message: 'Reward already claimed this week' });
    }

    // Update reward status
    cardio.weekly_rewards.streak_count = (cardio.weekly_rewards.streak_count || 0) + 1;
    cardio.weekly_rewards.last_reward_claimed = new Date();
    // Award bonus heart points for completing weekly challenge
    cardio.heart_points = (cardio.heart_points || 0) + 10;
    cardio.last_updated = new Date();
    
    await cardio.save();

    res.status(200).json({ 
      message: 'Reward claimed!', 
      streak: cardio.weekly_rewards.streak_count,
      heartPoints: cardio.heart_points 
    });
  } catch (err) {
    res.status(500).json({ message: 'Error claiming reward', error: err });
  }
});

module.exports = router;