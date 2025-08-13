import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8 } }
};

const SectionWrapper = ({ children, className = "" }) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={container}
      className={className}
    >
      {children}
    </motion.section>
  );
};

export default function Landing() {
  useEffect(() => {
    document.title = "Local Gem Finder | Discover Hidden Gems";
  }, []);

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <SectionWrapper className="flex-1 flex flex-col justify-center items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center px-6 py-16">
        <motion.div variants={fadeIn}>
          <motion.h1 
            variants={item}
            className="text-4xl md:text-6xl font-bold mb-4"
          >
            Welcome to Local Gem Finder
          </motion.h1>
          <motion.p 
            variants={item}
            className="text-lg md:text-xl max-w-2xl mb-6"
          >
            Discover hidden gems near you, share your own favorite spots, and rate & comment on places shared by others.
          </motion.p>
          <motion.div 
            variants={item}
            className="flex gap-4 justify-center"
          >
            <Link
              to="/explore"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold shadow hover:bg-gray-200 transition transform hover:scale-105"
            >
              Explore World
            </Link>
          </motion.div>
        </motion.div>
      </SectionWrapper>

      {/* About Section */}
      <SectionWrapper className="bg-gradient-to-br from-blue-50 to-indigo-50 py-16 px-6 text-center">
        <motion.div variants={item}>
          <motion.h2 
            variants={item}
            className="text-3xl font-bold mb-4"
          >
            About Us
          </motion.h2>
          <motion.p 
            variants={item}
            className="max-w-3xl mx-auto text-gray-600 text-lg"
          >
            Local Gem Finder is a platform for explorers, travelers, and locals to discover and share hidden treasures in their city.
            From cozy cafes to breathtaking viewpoints, we make sure every gem gets the spotlight it deserves.
          </motion.p>
        </motion.div>
      </SectionWrapper>

      {/* How It Works */}
      <SectionWrapper className="bg-gradient-to-br from-purple-50 to-pink-50 py-16 px-6">
        <motion.h2 
          variants={item}
          className="text-3xl font-bold text-center mb-12"
        >
          How It Works
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              title: "1. Explore",
              text: "Search for hidden gems near you or anywhere in the world."
            },
            {
              title: "2. Share",
              text: "Post your own favorite spots with photos and descriptions."
            },
            {
              title: "3. Rate & Comment",
              text: "Help others discover the best spots with your feedback."
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.text}</p>
            </motion.div>
          ))}
        </div>
      </SectionWrapper>

      {/* Contact Section - Updated to brown color scheme */}
      <SectionWrapper className="bg-gradient-to-br from-amber-50 to-amber-100 py-16 px-6 text-center">
        <motion.div variants={item}>
          <motion.h2 
            variants={item}
            className="text-3xl font-bold mb-4 text-amber-800"
          >
            Contact Us
          </motion.h2>
          <motion.p 
            variants={item}
            className="text-amber-700 mb-6 text-lg"
          >
            We'd love to hear from you! Reach out for questions or feedback.
          </motion.p>
          <motion.a
            variants={item}
            href="mailto:ramub9634@gmail.com"
            className="inline-block text-blue-600 font-semibold hover:text-blue-700 transition-colors underline"
            whileHover={{ scale: 1.05 }}
          >
            ramub9634@gmail.com
          </motion.a>
        </motion.div>
      </SectionWrapper>
    </div>
  );
}