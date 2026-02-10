import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Course category tags with links
const courseCategories = [
  { id: 'frontend', label: { en: 'Frontend Development', az: 'Frontend Proqramlaşdırma', ru: 'Фронтенд разработка' }, link: '/courses?category=development' },
  { id: 'backend', label: { en: 'Backend Development', az: 'Backend Proqramlaşdırma', ru: 'Бэкенд разработка' }, link: '/courses?category=development' },
  { id: 'design', label: { en: 'Graphic Design', az: 'Qrafik Dizayn', ru: 'Графический дизайн' }, link: '/courses?category=design' },
  { id: 'smm', label: { en: 'SMM', az: 'SMM', ru: 'SMM' }, link: '/courses?category=marketing' },
  { id: 'office', label: { en: 'Microsoft Office', az: 'Microsoft Office', ru: 'Microsoft Office' }, link: '/courses?category=office' },
  { id: 'kids', label: { en: 'IT for Kids', az: 'Uşaqlar üçün IT', ru: 'IT для детей' }, link: '/courses?category=kids' },
];

export function HeroCarousel({ slides, settings }) {
  const { getContent, language } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const containerRef = useRef(null);
  
  // Touch/Swipe state
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const activeSlides = slides?.filter(s => s.is_active) || [];

  const nextSlide = useCallback(() => {
    if (activeSlides.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }
  }, [activeSlides.length]);

  const prevSlide = useCallback(() => {
    if (activeSlides.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
    }
  }, [activeSlides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  // Touch handlers for swipe gestures
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextSlide();
      setIsAutoPlaying(false);
      setTimeout(() => setIsAutoPlaying(true), 5000);
    }
    if (isRightSwipe) {
      prevSlide();
      setIsAutoPlaying(false);
      setTimeout(() => setIsAutoPlaying(true), 5000);
    }
  };

  // Auto-play every 3 seconds
  useEffect(() => {
    if (!isAutoPlaying || activeSlides.length <= 1) return;
    
    const interval = setInterval(nextSlide, 3000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, activeSlides.length]);

  // Show loading skeleton while slides are being fetched
  if (!slides || slides.length === 0) {
    return (
      <section className="relative min-h-[600px] md:min-h-[700px] overflow-hidden bg-slate-50 dark:bg-slate-900" data-testid="hero-carousel-loading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse w-3/4" />
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                ))}
              </div>
              <div className="h-14 w-48 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            </div>
            <div className="h-[400px] bg-slate-200 dark:bg-slate-700 rounded-3xl animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  if (activeSlides.length === 0) {
    return null;
  }

  const whatsappNumber = settings?.whatsapp_number || '+123456789';
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`;

  // Use first slide for static left content (title, CTA)
  const staticSlide = activeSlides[0];
  const currentSlideData = activeSlides[currentSlide];

  const getCtaLink = (link) => {
    if (link === 'whatsapp') return whatsappUrl;
    if (link?.startsWith('/')) return link;
    if (link?.startsWith('http')) return link;
    return link || '/courses';
  };

  const isExternalLink = (link) => {
    return link === 'whatsapp' || link?.startsWith('http');
  };

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[600px] md:min-h-[700px] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800" 
      data-testid="hero-carousel"
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#5B5BF7]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-[#00C9A7]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* LEFT SIDE - FIXED CONTENT (does not change with slides) */}
          <div className="space-y-6 md:space-y-8 order-2 lg:order-1">
            {/* Main Headline - STATIC */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 dark:text-white leading-[1.1]"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              data-testid="hero-title"
            >
              {getContent(staticSlide.title)}
            </motion.h1>

            {/* Subtitle - STATIC */}
            {staticSlide.subtitle && getContent(staticSlide.subtitle) && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-lg"
                data-testid="hero-subtitle"
              >
                {getContent(staticSlide.subtitle)}
              </motion.p>
            )}

            {/* Category Tags - STATIC */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap gap-2 md:gap-3"
            >
              {courseCategories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                >
                  <Link to={category.link}>
                    <button className="px-4 py-2 md:px-5 md:py-2.5 rounded-full text-sm md:text-base font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#5B5BF7] hover:text-[#5B5BF7] dark:hover:border-[#5B5BF7] dark:hover:text-[#5B5BF7] hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-0.5">
                      {category.label[language] || category.label.en}
                    </button>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button - STATIC */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="pt-2 md:pt-4"
            >
              {isExternalLink(staticSlide.cta_link) ? (
                <a 
                  href={getCtaLink(staticSlide.cta_link)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  data-testid="hero-cta"
                >
                  <Button
                    size="lg"
                    className="bg-[#5B5BF7] hover:bg-[#4A4AE0] text-white rounded-full px-8 md:px-10 py-6 md:py-7 text-base md:text-lg font-semibold shadow-2xl shadow-blue-500/30 hover:-translate-y-1 hover:shadow-blue-500/40 transition-all duration-300"
                  >
                    {getContent(staticSlide.cta_text) || 'İndi Başla'}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </a>
              ) : (
                <Link to={getCtaLink(staticSlide.cta_link)} data-testid="hero-cta">
                  <Button
                    size="lg"
                    className="bg-[#5B5BF7] hover:bg-[#4A4AE0] text-white rounded-full px-8 md:px-10 py-6 md:py-7 text-base md:text-lg font-semibold shadow-2xl shadow-blue-500/30 hover:-translate-y-1 hover:shadow-blue-500/40 transition-all duration-300"
                  >
                    {getContent(staticSlide.cta_text) || 'İndi Başla'}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              )}
            </motion.div>
          </div>

          {/* RIGHT SIDE - SLIDING CONTENT (changes every 3 seconds) */}
          <div 
            className="relative order-1 lg:order-2 touch-pan-y"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Image Carousel - Smooth crossfade transition */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/20 dark:shadow-black/40 aspect-[4/3] md:aspect-[16/12] bg-slate-200 dark:bg-slate-700">
              {/* Background layer to prevent white flash */}
              {activeSlides.map((slide, index) => (
                <motion.div
                  key={slide.id}
                  initial={false}
                  animate={{ 
                    opacity: index === currentSlide ? 1 : 0,
                    scale: index === currentSlide ? 1 : 1.05
                  }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0"
                  style={{ zIndex: index === currentSlide ? 2 : 1 }}
                >
                  <img
                    src={slide.background_image}
                    alt={getContent(slide.title)}
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient overlay on image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
                </motion.div>
              ))}
              
              {/* Slide caption overlay */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-slate-900/80 to-transparent z-10"
                >
                  {currentSlideData.badge && getContent(currentSlideData.badge) && (
                    <p className="text-white text-sm md:text-base font-medium">
                      {getContent(currentSlideData.badge)}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Controls - Below the image */}
            {activeSlides.length > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                {/* Previous Arrow */}
                <button
                  onClick={() => { prevSlide(); setIsAutoPlaying(false); setTimeout(() => setIsAutoPlaying(true), 5000); }}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-[#5B5BF7] transition-all duration-300"
                  data-testid="carousel-prev"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>

                {/* Dots */}
                <div className="flex items-center gap-2">
                  {activeSlides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`transition-all duration-300 rounded-full ${
                        index === currentSlide
                          ? 'w-8 h-3 bg-[#5B5BF7]'
                          : 'w-3 h-3 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                      }`}
                      data-testid={`carousel-dot-${index}`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Next Arrow */}
                <button
                  onClick={() => { nextSlide(); setIsAutoPlaying(false); setTimeout(() => setIsAutoPlaying(true), 5000); }}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-[#5B5BF7] transition-all duration-300"
                  data-testid="carousel-next"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
