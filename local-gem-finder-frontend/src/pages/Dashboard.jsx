import React, { useState } from "react";
import ExploreWorld from "./ExploreWorld";
import Profile from "./Profile";
import AddPost from "./AddPost";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [tab, setTab] = useState("explore");
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center gap-1 pt-6 pb-2"
        >
          {[
            { id: "explore", label: "Explore" },
            { id: "profile", label: "Profile" },
            { id: "add", label: "Add Post" }
          ].map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTab(item.id)}
              className={`px-6 py-3 rounded-t-lg font-medium text-sm sm:text-base transition-all duration-200 ${
                tab === item.id
                  ? "bg-white text-blue-600 shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-xl overflow-hidden"
        >
          <div className="p-4 sm:p-6">
            {tab === "explore" && (
              <div className="min-h-[70vh]">
                <ExploreWorld />
              </div>
            )}
            {tab === "profile" && <Profile />}
            {tab === "add" && <AddPost />}
          </div>
        </motion.div>
      </div>
    </div>
  );
}