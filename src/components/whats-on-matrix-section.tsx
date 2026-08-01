"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Terminal, Users } from "lucide-react";
import gsap from "gsap";

const features = [
  {
    icon: BrainCircuit,
    title: "Technical Workshops",
    description:
      "Hands-on sessions on deep learning, computer vision, NLP, and MLOps led by faculty and industry experts.",
    gradient: "from-teal-500/10 via-emerald-500/5 to-transparent",
    iconBg: "bg-primary/10 text-primary border-primary/20",
  },
  {
    icon: Terminal,
    title: "Hackathons & Sprints",
    description:
      "Compete in department hackathons, build real-world AI prototypes, and present to judges.",
    gradient: "from-cyan-500/10 via-sky-500/5 to-transparent",
    iconBg: "bg-primary/10 text-primary border-primary/20",
  },
  {
    icon: Users,
    title: "Student Community",
    description:
      "Connect with fellow AIML students, find project collaborators, and earn verified attendance certificates.",
    gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
    iconBg: "bg-primary/10 text-primary border-primary/20",
  },
];

export default function WhatsOnMatrixSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Subtle GSAP entrance enhancement for icons
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".feature-icon-box",
        { scale: 0.8, rotate: -5 },
        {
          scale: 1,
          rotate: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "back.out(1.7)",
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      className="px-6 py-20 max-w-7xl mx-auto w-full relative z-10"
      id="matrix-features"
    >
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="font-mono text-xs text-primary uppercase tracking-widest mb-10 flex items-center gap-2.5 font-bold"
      >
        <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-sm shadow-primary/50" />
        What&apos;s on Matrix
      </motion.div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 35, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.6,
                delay: index * 0.14,
                ease: [0.215, 0.61, 0.355, 1],
              }}
              whileHover={{ y: -6 }}
              className="feature-card relative group p-7 bg-card border border-border rounded-xl shadow-sm hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all overflow-hidden"
            >
              {/* Subtle Ambient Hover Gradient Overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
              />

              {/* Icon Container */}
              <div
                className={`feature-icon-box w-11 h-11 rounded-lg ${feature.iconBg} border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm`}
              >
                <Icon size={22} />
              </div>

              {/* Card Title & Content */}
              <h3 className="font-heading text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
