"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Brain, Sparkles, Zap, FolderTree, Share2, ArrowRight } from "lucide-react";


export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-zinc-50 dark:bg-zinc-950">
      {/* Left Side - Branding & Graphics */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-linear-to-br from-zinc-100 via-zinc-200 to-zinc-300 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900" />

        {/* Animated Orbs */}
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/5 dark:bg-blue-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-1/4 w-80 h-80 bg-purple-600/5 dark:bg-purple-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 20, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 w-72 h-72 bg-emerald-600/5 dark:bg-emerald-600/15 rounded-full blur-3xl"
        />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-size-[48px_48px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="h-10 w-10 bg-zinc-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Brain className="h-5 w-5 text-white dark:text-zinc-900" />
              </div>
              <span className="text-xl font-bold text-zinc-900 dark:text-white">HypeMind</span>
            </Link>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-md"
          >
            <h1 className="text-4xl xl:text-5xl font-bold text-zinc-950 dark:text-white mb-6 leading-tight">
              Your second brain,{" "}
              <span className="bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                organized.
              </span>
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              Capture ideas in milliseconds, organize with the PARA method, and retrieve anything instantly.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Zap, label: "Lightning Capture" },
                { icon: FolderTree, label: "PARA Built-in" },
                { icon: Sparkles, label: "AI Search" },
                { icon: Share2, label: "Collaborate" },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-zinc-900/10 dark:border-white/10 text-zinc-700 dark:text-white/80 text-sm"
                >
                  <feature.icon className="h-4 w-4" />
                  {feature.label}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom Quote */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex items-start gap-4"
          >
            <div className="h-12 w-12 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              SC
            </div>
            <div>
              <p className="text-zinc-700 dark:text-zinc-300 text-sm italic mb-2 max-w-xs">
                &ldquo;HypeMind replaced 4 apps for me. Now every idea has a home.&rdquo;
              </p>
              <p className="text-zinc-600 dark:text-zinc-500 text-xs">Sarah Chen, Indie Hacker</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-6">
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden inline-flex items-center gap-2">
            <div className="h-8 w-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center">
              <Brain className="h-4 w-4 text-white dark:text-zinc-900" />
            </div>
            <span className="font-bold text-zinc-900 dark:text-white">HypeMind</span>
          </Link>

          <div className="hidden lg:block" /> {/* Spacer */}

          {/* Theme Toggle */}
        
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </div>

        {/* Bottom Link */}
        <div className="p-6 text-center lg:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Learn more about HypeMind
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
