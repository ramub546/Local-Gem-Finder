const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const pool = require("../db");

router.get("/my-profile", verifyToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    // Get user details
    const userQuery = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1", 
      [userId]
    );
    
    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userQuery.rows[0];

    // Get statistics and places in parallel
    const [stats, places] = await Promise.all([
      // Get user stats
      pool.query(`
        SELECT 
          COUNT(p.id) as places_posted,
          COALESCE(SUM(r.rating * 10), 0) as coins_earned
        FROM places p
        LEFT JOIN ratings r ON p.id = r.place_id
        WHERE p.user_id = $1
      `, [userId]),
      
      // Get user's places with proper image URLs
      pool.query(`
        SELECT 
          id, 
          title, 
          description, 
          image_path as image
        FROM places 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [userId])
    ]);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      stats: {
        placesPosted: parseInt(stats.rows[0].places_posted),
        coinsEarned: parseInt(stats.rows[0].coins_earned)
      },
      places: places.rows
    });

  } catch (err) {
    console.error("Profile Error:", err);
    res.status(500).json({ 
      error: "Failed to load profile",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;