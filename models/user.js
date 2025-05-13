const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bookmarks: [
    {
      movieId: { type: String, required: true }, // e.g., TMDB ID
      title: String, // optional
      posterPath: String
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
