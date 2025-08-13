import React, { useEffect, useState } from "react";
import api from "../utils/api";

export default function PlaceDetails({ placeId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [place, setPlace] = useState(null);
  const [comments, setComments] = useState([]);
  const [avgRating, setAvgRating] = useState(null);

  useEffect(() => {
    if (!placeId) return;
    setLoading(true);
    api.get(`/api/places/${placeId}/details`)
      .then(data => {
        setPlace(data.place);
        setComments(data.comments || []);
        setAvgRating(data.avg_rating ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [placeId]);

  if (!placeId) return null;
  if (loading) return <div className="p-4">Loading…</div>;
  if (!place) return null;

  // location parsing
  let lat = '', lng = '';
  if (place.location) {
    const parts = place.location.toString().split(",");
    lat = parts[0] ?? '';
    lng = parts[1] ?? '';
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded p-4 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold">{place.title}</h2>
          <button onClick={onClose} className="text-gray-600">Close</button>
        </div>

        {place.image_path && <img src={place.image_path} alt={place.title} className="w-full h-48 object-cover my-2 rounded" />}
        <p>{place.description}</p>

        <p className="mt-2">⭐ <strong>{avgRating ?? "No rating"}</strong></p>

        <h3 className="mt-4 font-semibold">Comments</h3>
        {comments.length ? (
          <ul className="space-y-2">
            {comments.map(c => (
              <li key={c.id}><strong>{c.user_name}</strong>: {c.text}</li>
            ))}
          </ul>
        ) : <p>No comments yet</p>}

        <div className="mt-4">
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            🚗 Get Directions
          </a>
        </div>
      </div>
    </div>
  );
}
