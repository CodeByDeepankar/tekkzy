"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { API_BASE_URL } from "@/lib/api";

interface ContactRequest {
  name: string;
  service: string;
  message: string;
  email: string;
  submitted: string;
  imageUrl?: string | null;
}

const placeholderImages = [
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1400&q=80",
];

export default function MessageBanner() {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragWidth, setDragWidth] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        if (!API_BASE_URL) {
          throw new Error("API base URL is not configured");
        }

        const response = await fetch(`${API_BASE_URL}/api/contacts`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setRequests(data.slice(0, 3));
          }
        }
      } catch (error) {
        console.error("Failed to fetch requests", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  useEffect(() => {
    if (!trackRef.current) return;
    const track = trackRef.current;
    const calculate = () => {
      const width = track.scrollWidth - track.clientWidth;
      setDragWidth(width > 0 ? width : 0);
    };
    calculate();
    window.addEventListener("resize", calculate);
    return () => window.removeEventListener("resize", calculate);
  }, [requests]);

  if (loading || requests.length === 0) return null;

  return (
    <section className="message-banner">
      <div className="container">
        <div className="section-header align-left">
          <span className="subtitle">Client Messages</span>
          <h2>Live Requests from Growing Teams</h2>
          <p>See the latest messages coming in from teams ready to build with Tekkzy.</p>
        </div>

        <motion.div
          ref={trackRef}
          className="message-banner-track"
          drag="x"
          dragConstraints={{ left: -dragWidth, right: 0 }}
          whileTap={{ cursor: "grabbing" }}
        >
          {requests.map((req, index) => (
            <motion.article
              key={`${req.email}-${index}`}
              className="message-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="message-image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={req.imageUrl || placeholderImages[index % placeholderImages.length]}
                  alt={req.name}
                />
                <div className="message-overlay">
                  <span className="badge">{req.service}</span>
                  <h3>{req.name}</h3>
                  <p>{req.message}</p>
                  <span className="timestamp">{req.submitted}</span>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
