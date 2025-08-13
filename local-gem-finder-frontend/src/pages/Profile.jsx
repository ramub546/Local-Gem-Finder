import React, { useEffect, useState } from "react";
import api from "../utils/api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/api/profile/my-profile");
        
        // Transform places data to ensure proper image URLs
        const places = response.places.map(place => ({
          ...place,
          image: place.image || null // Ensure image is either URL or null
        }));
        
        setProfile({
          ...response,
          places
        });
      } catch (err) {
        console.error("Profile load error:", err);
        setError("Failed to load profile. Please try again.");
      }
    };

    loadProfile();
  }, []);

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500 text-lg">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 
                         flex items-center justify-center rounded-full text-white text-3xl font-bold">
            {profile.user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Welcome, {profile.user.name}
            </h2>
            <p className="text-gray-500">{profile.user.email}</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white 
                         rounded-lg p-5 shadow text-center">
            <p className="text-3xl font-bold">{profile.stats.placesPosted}</p>
            <p className="text-sm">Places Posted</p>
          </div>
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white 
                         rounded-lg p-5 shadow text-center">
            <p className="text-3xl font-bold">{profile.stats.coinsEarned}</p>
            <p className="text-sm">Coins Earned</p>
          </div>
        </div>
      </div>

      {/* My Places */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-gray-800">My Places</h3>
        {profile.places.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {profile.places.map((place) => (
              <div key={place.id} className="bg-white shadow rounded-lg overflow-hidden 
                                          hover:shadow-lg transition">
                {place.image ? (
                  <img
                    src={place.image}
                    alt={place.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder.jpg';
                      e.target.className = 'w-full h-48 bg-gray-200 object-contain p-4';
                    }}
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No Image</span>
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-bold text-lg text-gray-800">{place.title}</h4>
                  <p className="text-gray-600 text-sm mt-2">{place.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <p className="text-gray-500">You haven't posted any places yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}