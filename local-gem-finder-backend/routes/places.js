// routes/places.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticate = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const multer = require("multer");
const path = require("path");





// @route    POST /api/places/add
// @desc     Add a new place
// @access   Private (requires token)
// ✅ Add a place with image and cleaned location

router.post("/add", authenticate, upload.single("image"), async (req, res) => {
  try {
    const { title, description, category, location } = req.body;
    const userId = req.user.userId;

    // ✅ Clean the location input
    let locationInput = location ? location.trim() : "";
    locationInput = locationInput
      .replace(/[^\d.,-]/g, " ") // keep only digits, dot, comma, minus
      .replace(/\s+/g, ",")      // replace spaces with comma
      .replace(/,+/g, ",");      // collapse multiple commas

    const [latStr, lngStr] = locationInput.split(",");
    if (!latStr || !lngStr || isNaN(latStr) || isNaN(lngStr)) {
      return res.status(400).json({ error: "Invalid location format. Use 'lat,lng'" });
    }

    const cleanLocation = `${parseFloat(latStr)},${parseFloat(lngStr)}`;

    // ✅ Image full URL for easy frontend access
    const imageFullUrl = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : null;

    // ✅ Insert into DB
    const result = await pool.query(
      `INSERT INTO places (user_id, title, description, category, location, image_path)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, title, description, category, cleanLocation, imageFullUrl]
    );

    // ✅ Return the complete place data with proper image URL
    const insertedPlace = result.rows[0];
    res.status(201).json({
      message: "Place posted with image ✅",
      place: {
        ...insertedPlace,
        // Ensure frontend gets the full URL
        image_path: insertedPlace.image_path || null
      },
    });
  } catch (err) {
    console.error("Error posting place with image:", err);
    res.status(500).json({ 
      error: "Server error",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});


// GET all places posted by the logged-in user
router.get("/my-posts", authenticate, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      "SELECT * FROM places WHERE user_id = $1 ORDER BY id DESC",
      [userId]
    );
    res.json({ myPlaces: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch user's places" });
  }
});


// Rate a place (1 to 5)
router.post("/rate/:placeId", authenticate, async (req, res) => {
  const { placeId } = req.params;
  const { rating } = req.body;
  const userId = req.user.userId;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  try {
    // Check if already rated
    const existing = await pool.query(
      "SELECT * FROM ratings WHERE user_id = $1 AND place_id = $2",
      [userId, placeId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "You already rated this place" });
    }

    // Insert rating
    const result = await pool.query(
      "INSERT INTO ratings (user_id, place_id, rating) VALUES ($1, $2, $3) RETURNING *",
      [userId, placeId, rating]
    );

    res.status(201).json({ message: "Rating submitted ✅", rating: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// GET all places with average ratings
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        places.*, 
        COALESCE(AVG(ratings.rating), 0)::numeric(2,1) AS avg_rating
      FROM places
      LEFT JOIN ratings ON places.id = ratings.place_id
      GROUP BY places.id
      ORDER BY avg_rating DESC;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch places" });
  }
});





// Get all posted places
router.get("/all", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM places ORDER BY id DESC");
    res.json({ places: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch places ❌" });
  }
});

// Rate a place
router.post("/:placeId/rate", authenticate, async (req, res) => {
  const { rating } = req.body;
  const userId = req.user.userId;
  const placeId = req.params.placeId;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  try {
    const existing = await pool.query(
      "SELECT * FROM ratings WHERE user_id = $1 AND place_id = $2",
      [userId, placeId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        "UPDATE ratings SET rating = $1 WHERE user_id = $2 AND place_id = $3",
        [rating, userId, placeId]
      );
      return res.json({ message: "Rating updated ✅" });
    }

    await pool.query(
      "INSERT INTO ratings (user_id, place_id, rating) VALUES ($1, $2, $3)",
      [userId, placeId, rating]
    );

    res.status(201).json({ message: "Rating submitted ✅" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to rate the place ❌" });
  }
});


// GET all places posted by the logged-in user
router.get("/my-places", authenticate, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      "SELECT * FROM places WHERE user_id = $1 ORDER BY id DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch user's places" });
  }
});


// GET /api/places/search?query=sunset&category=nature
router.get("/search", async (req, res) => {
  const { query, category } = req.query;

  try {
    let sql = "SELECT * FROM places WHERE 1=1";
    const values = [];

    if (query) {
      sql += " AND LOWER(title) LIKE LOWER($" + (values.length + 1) + ")";
      values.push(`%${query}%`);
    }

    if (category) {
      sql += " AND LOWER(category) = LOWER($" + (values.length + 1) + ")";
      values.push(category);
    }

    const result = await pool.query(sql, values);
    res.json({ places: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// GET top-rated places
router.get("/top-rated", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, COALESCE(AVG(r.rating), 0) AS avg_rating
      FROM places p
      LEFT JOIN ratings r ON p.id = r.place_id
      GROUP BY p.id
      ORDER BY avg_rating DESC
      LIMIT 10
    `);
    res.json({ topPlaces: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ✏️ Edit a place (only by the owner)
router.put("/edit/:id", authenticate, async (req, res) => {
  const placeId = req.params.id;
  const { title, description, category, location } = req.body;
  const userId = req.user.userId;

  try {
    // Check ownership
    const place = await pool.query("SELECT * FROM places WHERE id = $1", [placeId]);
    if (place.rows.length === 0) return res.status(404).json({ error: "Place not found" });
    if (place.rows[0].user_id !== userId) return res.status(403).json({ error: "Not authorized" });

    // Update
    const updated = await pool.query(
      `
      UPDATE places
      SET title = $1, description = $2, category = $3, location = $4
      WHERE id = $5 RETURNING *
      `,
      [title, description, category, location, placeId]
    );

    res.json({ message: "Place updated ✅", place: updated.rows[0] });
  } catch (err) {
    console.error("Error updating place:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});



// routes/places.js

router.delete("/delete/:id", authenticate, async (req, res) => {
  const placeId = req.params.id;
  const userId = req.user.userId;

  try {
    // Check if the place exists and belongs to the user
    const place = await pool.query("SELECT * FROM places WHERE id = $1", [placeId]);

    if (place.rows.length === 0) {
      return res.status(404).json({ error: "Place not found" });
    }

    if (place.rows[0].user_id !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this place" });
    }

    // ✅ First delete related ratings
    await pool.query("DELETE FROM ratings WHERE place_id = $1", [placeId]);

    // ✅ Then delete the place
    await pool.query("DELETE FROM places WHERE id = $1", [placeId]);

    res.json({ message: "Place and related ratings deleted ✅" });
  } catch (err) {
    console.error("Error deleting place:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// ⭐ Add a place to favorites
router.post("/favorite/:id", authenticate, async (req, res) => {
  const userId = req.user.userId;
  const placeId = req.params.id;

  try {
    await pool.query(
      "INSERT INTO favorites (user_id, place_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, placeId]
    );
    res.json({ message: "Place added to favorites ✅" });
  } catch (err) {
    console.error("Error favoriting place:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// 📄 Get all favorited places
router.get("/favorites", authenticate, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `
      SELECT p.*
      FROM places p
      JOIN favorites f ON p.id = f.place_id
      WHERE f.user_id = $1
      `,
      [userId]
    );
    res.json({ favorites: result.rows });
  } catch (err) {
    console.error("Error fetching favorites:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// 💬 Post a comment on a place
router.post("/:id/comment", authenticate, async (req, res) => {
  const userId = req.user.userId;
  const placeId = req.params.id;
  const { content } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO comments (user_id, place_id, content) VALUES ($1, $2, $3) RETURNING *",
      [userId, placeId, content]
    );
    res.status(201).json({ message: "Comment posted ✅", comment: result.rows[0] });
  } catch (err) {
    console.error("Error posting comment:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// 📄 Get all comments on a place
router.get("/:id/comments", async (req, res) => {
  const placeId = req.params.id;

  try {
    const result = await pool.query(
      `
      SELECT c.id, c.content, c.created_at, u.name AS user_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.place_id = $1
      ORDER BY c.created_at DESC
      `,
      [placeId]
    );
    res.json({ comments: result.rows });
  } catch (err) {
    console.error("Error fetching comments:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// ✅ Get nearby places based on user's location (fixed version)
// ✅ Get nearby places based on user's location
// router.get("/nearby", async (req, res) => {
//   const { lat, lng, radius } = req.query;

//   if (!lat || !lng || !radius) {
//     return res.status(400).json({ error: "lat, lng, and radius are required" });
//   }

//   try {
//     const result = await pool.query(`
//       SELECT *, (
//         6371 * acos(
//           cos(radians($1)) * cos(radians(CAST(split_part(location, ',', 1) AS double precision))) *
//           cos(radians(CAST(split_part(location, ',', 2) AS double precision)) - radians($2)) +
//           sin(radians($1)) * sin(radians(CAST(split_part(location, ',', 1) AS double precision)))
//         )
//       ) AS distance
//       FROM places
//     `, [lat, lng]);
//     const nearby = result.rows.filter(place => place.distance <= parseFloat(radius));

//     res.json({ nearby });
//   } catch (err) {
//     console.error("Error fetching nearby places:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });


router.delete("/:id", authenticate, async (req, res) => {
  const userId = req.user.userId;
  const placeId = req.params.id;

  try {
    // ✅ Check if the user is admin
    const userResult = await pool.query("SELECT is_admin FROM users WHERE id = $1", [userId]);
    const isAdmin = userResult.rows[0]?.is_admin;

    if (!isAdmin) {
      // ✅ Check if the user owns the place
      const placeResult = await pool.query("SELECT user_id FROM places WHERE id = $1", [placeId]);
      if (placeResult.rows.length === 0 || placeResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: "Unauthorized to delete this place" });
      }
    }

    // ✅ First delete associated ratings/comments
    await pool.query("DELETE FROM ratings WHERE place_id = $1", [placeId]);
    await pool.query("DELETE FROM comments WHERE place_id = $1", [placeId]);

    // ✅ Then delete the place
    await pool.query("DELETE FROM places WHERE id = $1", [placeId]);

    res.json({ message: "Place deleted ✅" });
  } catch (err) {
    console.error("Error deleting place:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ REPORT a place
router.post("/report/:id", authenticate, async (req, res) => {
  const userId = req.user.userId;
  const placeId = req.params.id;
  const { reason } = req.body;

  if (!reason || reason.trim() === "") {
    return res.status(400).json({ error: "Reason for report is required" });
  }

  try {
    // ✅ Check if the place exists
    const placeCheck = await pool.query("SELECT * FROM places WHERE id = $1", [placeId]);
    if (placeCheck.rows.length === 0) {
      return res.status(404).json({ error: "Place not found" });
    }

    // ✅ Check if user has already reported this place
    const existingReport = await pool.query(
      "SELECT * FROM reports WHERE user_id = $1 AND place_id = $2",
      [userId, placeId]
    );

    if (existingReport.rows.length > 0) {
      return res.status(400).json({ error: "You have already reported this place" });
    }

    // ✅ Insert the report
    await pool.query(
      "INSERT INTO reports (user_id, place_id, reason) VALUES ($1, $2, $3)",
      [userId, placeId, reason]
    );

    res.json({ message: "Report submitted ✅" });
  } catch (err) {
    console.error("Error reporting place:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});




// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
// const upload = multer({ storage });

// Update your route
router.post("/add", authenticate, upload.single("image"), async (req, res) => {
  const { title, description, category, location } = req.body;
  const userId = req.user.userId;
  const imagePath = req.file ? req.file.path : null;

  try {
    const result = await pool.query(
      "INSERT INTO places (user_id, title, description, category, location, image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [userId, title, description, category, location, imagePath]
    );
    res.status(201).json({ message: "Place posted with image ✅", place: result.rows[0] });
  } catch (err) {
    console.error("Error uploading place:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
