// src/components/PlacePopup.jsx
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../utils/api";

export default function PlacePopup({ place }) {
  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState("");
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    if (place?.id) {
      fetchComments();
      fetchRatings();
    }
  }, [place.id]);

  const fetchComments = async () => {
    try {
      const data = await api.get(`/places/${place.id}/comments`);
      setComments(data.comments || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const fetchRatings = async () => {
    try {
      const data = await api.get(`/places/${place.id}/ratings`);
      setAvgRating(data.avgRating || 0);
    } catch (err) {
      console.error("Error fetching ratings:", err);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/places/${place.id}/comment`, { text: newComment.trim() });
      setNewComment("");
      fetchComments();
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  const submitRating = async (e) => {
    e.preventDefault();
    if (!rating) return;
    try {
      await api.post(`/places/${place.id}/rate`, { rating: Number(rating) });
      setRating("");
      fetchRatings();
    } catch (err) {
      console.error("Error posting rating:", err);
    }
  };

  return (
    <div className="p-3 max-w-xs">
      <h2 className="text-lg font-bold">{place.title}</h2>

      {place.image_path && (
        <img
          src={place.image_path.startsWith("http")
            ? place.image_path
            : `${import.meta.env.VITE_API_URL}/${place.image_path}`}
          alt={place.title}
          className="w-full h-32 object-cover rounded mt-2"
        />
      )}

      <p className="mt-1 text-sm">{place.description}</p>
      <p className="mt-1 text-yellow-500 font-semibold">⭐ {avgRating.toFixed(1)}</p>

      {user && (
        <>
          {/* Rating */}
          <form onSubmit={submitRating} className="mt-2 flex">
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="border p-1 rounded text-sm flex-grow"
            >
              <option value="">Rate this place</option>
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num} ⭐</option>
              ))}
            </select>
            <button type="submit" className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs">
              Submit
            </button>
          </form>

          {/* Comment */}
          <form onSubmit={submitComment} className="mt-2 flex">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add comment..."
              className="border p-1 rounded text-xs flex-grow"
            />
            <button type="submit" className="ml-1 px-2 bg-green-500 text-white rounded text-xs">
              Post
            </button>
          </form>
        </>
      )}

      {/* Comments */}
      <div className="mt-2 max-h-28 overflow-y-auto">
        {comments.length > 0 ? (
          comments.map((c, i) => (
            <p key={i} className="text-xs border-b py-1">
              💬 <strong>{c.username}</strong>: {c.text}
            </p>
          ))
        ) : (
          <p className="text-xs text-gray-500">No comments yet</p>
        )}
      </div>

      {/* Directions */}
      {place.location && (
        <a
          className="text-blue-600 underline mt-2 block text-sm"
          href={`https://www.google.com/maps/dir/?api=1&destination=${place.location}`}
          target="_blank"
          rel="noreferrer"
        >
          Get Directions
        </a>
      )}
    </div>
  );
}
