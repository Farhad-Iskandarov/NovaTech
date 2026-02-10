import React from 'react';
import { motion } from 'framer-motion';

export function LogosMarquee() {
  const logos = [
    {
      name: 'Google',
      image: 'https://www.vectorlogo.zone/logos/google/google-ar21.svg',
    },
    {
      name: 'Microsoft',
      image: 'https://www.vectorlogo.zone/logos/microsoft/microsoft-ar21.svg',
    },
    {
      name: 'Meta',
      image: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg',
    },
    {
      name: 'Amazon',
      image: 'https://www.vectorlogo.zone/logos/amazon/amazon-ar21.svg',
    },
    {
      name: 'GitHub',
      image: 'https://www.vectorlogo.zone/logos/github/github-ar21.svg',
    }
  ];

  // Quadruple logos for seamless infinite loop
  const repeatedLogos = [...logos, ...logos, ...logos, ...logos];
  
  // Calculate total width for smooth animation (5 logos * 280px each = 1400px per set)
  const singleSetWidth = logos.length * 280;

  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-10 overflow-hidden border-y border-slate-700/50">
      <div className="relative flex overflow-hidden">
        <motion.div
          className="flex gap-12"
          animate={{
            x: [0, -singleSetWidth],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 25,
              ease: "linear",
            },
          }}
          style={{ willChange: 'transform' }}
        >
          {repeatedLogos.map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="flex items-center justify-center flex-shrink-0"
              style={{ width: '280px', height: '80px' }}
            >
              <img
                src={logo.image}
                alt={logo.name}
                className="h-14 w-auto max-w-[200px] object-contain filter brightness-0 invert opacity-70 hover:opacity-100 transition-opacity duration-300"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
