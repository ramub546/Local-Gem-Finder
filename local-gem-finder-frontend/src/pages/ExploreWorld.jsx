import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import api from "../utils/api";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { motion } from "framer-motion";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

export default function ExploreWorld() {
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [ratingInput, setRatingInput] = useState("");
  const [commentInput, setCommentInput] = useState("");

  const fetchPlaces = () => {
    api.get("/api/places")
      .then(res => {
        const arr = Array.isArray(res) ? res : (res.places || res);
        setPlaces(arr || []);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaceExtras = async (id) => {
    try {
      const commentsRes = await api.get(`/api/places/${id}/comments`);
      const updatedPlace = places.find(p => p.id === id);
      setSelectedPlace({
        ...updatedPlace,
        avg_rating: updatedPlace?.avg_rating ?? "No rating",
        comments: commentsRes.comments || []
      });
    } catch (err) {
      console.error("Error fetching extras:", err);
    }
  };

  const parseLocation = (loc) => {
    if (!loc) return [NaN, NaN];
    if (typeof loc === "string") {
      const [a, b] = loc.split(",").map(Number);
      return [a, b];
    }
    if (Array.isArray(loc)) return [Number(loc[0]), Number(loc[1])];
    if (typeof loc === "object" && loc.lat !== undefined && loc.lng !== undefined) {
      return [Number(loc.lat), Number(loc.lng)];
    }
    return [NaN, NaN];
  };

  const handleRateSubmit = (placeId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to rate a place.");
      return;
    }
    if (!ratingInput) return;
    api.post(`/api/places/${placeId}/rate`, { rating: Number(ratingInput) })
      .then(() => {
        setRatingInput("");
        fetchPlaces();
        fetchPlaceExtras(placeId);
      })
      .catch(err => {
        console.error(err);
        alert(err.response?.data?.error || "Failed to submit rating");
      });
  };

  const handleCommentSubmit = (placeId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to post a comment.");
      return;
    }
    if (!commentInput.trim()) return;
    api.post(`/api/places/${placeId}/comment`, { content: commentInput.trim() })
      .then(() => {
        setCommentInput("");
        fetchPlaceExtras(placeId);
      })
      .catch(err => {
        console.error(err);
        alert(err.response?.data?.error || "Failed to post comment");
      });
  };

  return (
    <div className="h-[calc(100vh-64px)] relative">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />

        {places.map(p => {
          if (!p.location) return null;
          const [lat, lng] = parseLocation(p.location);
          if (isNaN(lat) || isNaN(lng)) return null;
          const image = p.image || p.image_path || p.imageFullUrl || p.image_url;

          return (
            <Marker
              key={p.id}
              position={[lat, lng]}
              eventHandlers={{
                click: () => fetchPlaceExtras(p.id)
              }}
            >
              <Popup className="rounded-lg shadow-xl">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-72 p-3"
                >
                  <h3 className="font-bold text-lg text-gray-800">{p.title}</h3>
                  {p.category && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                      {p.category}
                    </span>
                  )}

                  {image && (
                    <img
                      src={image.startsWith("http") ? image : `${import.meta.env.VITE_API_URL}/${image}`}
                      alt={p.title}
                      className="w-full h-40 object-cover mt-2 rounded-lg shadow-sm"
                    />
                  )}

                  <p className="text-gray-600 text-sm mt-2">{p.description}</p>

                  {selectedPlace?.id === p.id && (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center">
                        <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm font-semibold">
                          ⭐ {selectedPlace.avg_rating || "No ratings"}
                        </div>
                      </div>

                      <div className="flex gap-2 items-center">
                        <select
                          value={ratingInput}
                          onChange={(e) => setRatingInput(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                        >
                          <option value="">Rate this place</option>
                          {[1, 2, 3, 4, 5].map(r => (
                            <option key={r} value={r}>{r} ⭐</option>
                          ))}
                        </select>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleRateSubmit(p.id)}
                          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
                        >
                          Rate
                        </motion.button>
                      </div>

                      <div className="border-t pt-3">
                        <h4 className="font-medium text-gray-700 mb-2">Comments</h4>
                        <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                          {selectedPlace.comments?.length > 0 ? (
                            selectedPlace.comments.map((c, idx) => (
                              <div key={idx} className="bg-gray-50 p-2 rounded-lg">
                                <p className="text-xs font-semibold text-gray-700">{c.user_name}</p>
                                <p className="text-xs text-gray-600">{c.content}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-500 italic">No comments yet</p>
                          )}
                        </div>

                        <div className="flex gap-2 mt-3">
                          <input
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            placeholder="Add your comment..."
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCommentSubmit(p.id)}
                            className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
                          >
                            Post
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  )}

                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-3 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                  >
                    Get Directions →
                  </motion.a>
                </motion.div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}