'use client';

import React from 'react';

interface GradientButtonProps {
  label: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

export default function GradientButton({
  label,
  type = 'button',
  onClick,
}: GradientButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="relative inline-block px-8 py-4 text-lg font-bold text-white bg-black rounded-xl overflow-hidden group transition-all duration-300"
    >
      <span className="relative z-10">{label}</span>
      <span
        className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
        bg-[length:300%_300%] bg-linear-to-r from-accent-blue via-accent-indigo to-accent-sky
        animate-gradient-smooth"
      />
    </button>
  );
}
