import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { useSettings } from '../lib/SettingsContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { HeroCarousel } from '../components/HeroCarousel';
import { LogosMarquee } from '../components/LogosMarquee';
import {
  GraduationCap,
  Users,
  Briefcase,
  Award,
  Monitor,
  ArrowRight,
  Star,
  Clock,
  ChevronRight,
  Send,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function HomePage() {
  const { t, getContent, language } = useLanguage();
  const { settings, getWhatsAppUrl } = useSettings();
  const [courses, setCourses] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [slides, setSlides] = useState([]);
  const [ctaSection, setCtaSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [homepageBlogs, setHomepageBlogs] = useState([]);

  // Get first image from blog - check multiple sources
  const getBlogImage = (blog) => {
    // First check if blog has a direct image_url
    if (blog.image_url) {
      return blog.image_url;
    }
    // Then check content_blocks for image
    if (blog.content_blocks && blog.content_blocks.length > 0) {
      const imageBlock = blog.content_blocks.find(block => block.type === 'image' && block.image_url);
      if (imageBlock) {
        return imageBlock.image_url;
      }
    }
    // Default fallback
    return 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800';
  };

  // Format date for blog posts - Manual formatting for consistent output
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const year = date.getFullYear();

    const months = {
      az: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      ru: ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря']
    };

    const monthName = months[language]?.[date.getMonth()] || months.en[date.getMonth()];
    return `${day} ${monthName} ${year}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Seed database first
        await axios.post(`${API}/seed`);

        const [coursesRes, testimonialsRes, slidesRes, ctaRes, blogsRes] = await Promise.all([
          axios.get(`${API}/courses`),
          axios.get(`${API}/testimonials`),
          axios.get(`${API}/slides`),
          axios.get(`${API}/cta-sections`).catch(() => ({ data: [] })),
          axios.get(`${API}/blogs/homepage`).catch(() => ({ data: [] }))
        ]);
        setCourses(coursesRes.data.filter(c => c.is_popular).slice(0, 6));
        setTestimonials(testimonialsRes.data);
        setSlides(slidesRes.data);
        setHomepageBlogs(blogsRes.data);

        // Find home_cta section
        const homeCta = ctaRes.data.find(s => s.section_key === 'home_cta');
        setCtaSection(homeCta);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Track page view
    axios.post(`${API}/analytics/pageview`, {
      page_path: '/',
      page_title: 'Home',
      device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      country: 'Unknown'
    }).catch(() => { });
  }, []);

  const features = [
    { icon: Users, ...t('whyNovatech.features.instructors') },
    { icon: Briefcase, ...t('whyNovatech.features.practical') },
    { icon: Monitor, ...t('whyNovatech.features.projects') },
    { icon: Award, ...t('whyNovatech.features.certificate') },
    { icon: GraduationCap, ...t('whyNovatech.features.flexible') },
  ];

  return (
    <div data-testid="home-page">
      {/* Hero Carousel */}
      <HeroCarousel slides={slides} settings={settings} />

      {/* Why Novatech Section */}
      <section className="py-24 md:py-32 bg-white dark:bg-slate-900" data-testid="why-novatech-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {t('whyNovatech.title')}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t('whyNovatech.subtitle')}
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="group bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 hover:bg-white dark:hover:bg-slate-700 hover:shadow-xl transition-all duration-300 border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#5B5BF7]/10 flex items-center justify-center mb-6 group-hover:bg-[#5B5BF7] group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-[#5B5BF7] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Logos Marquee Section */}
      <LogosMarquee />

      {/* Popular Courses Section */}
      <section className="py-24 md:py-32 bg-slate-50 dark:bg-slate-800" data-testid="popular-courses-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex flex-col md:flex-row md:items-end justify-between mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {t('popularCourses.title')}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                {t('popularCourses.subtitle')}
              </p>
            </div>
            <Link to="/courses" className="mt-6 md:mt-0">
              <Button variant="outline" className="rounded-full group dark:text-white dark:border-slate-600">
                {t('popularCourses.viewAll')}
                <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white dark:bg-slate-700 rounded-2xl p-6 animate-pulse">
                  <div className="w-full h-48 bg-slate-200 dark:bg-slate-600 rounded-xl mb-4" />
                  <div className="h-6 bg-slate-200 dark:bg-slate-600 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-full mb-4" />
                  <div className="h-10 bg-slate-200 dark:bg-slate-600 rounded-full w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {courses.map((course, index) => (
                <motion.div key={course.id} variants={fadeInUp}>
                  <Card className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                    <div className="relative overflow-hidden">
                      <img
                        src={course.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'}
                        alt={getContent(course.title)}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full text-xs font-semibold text-[#5B5BF7]">
                          {course.category}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[#5B5BF7] transition-colors">
                        {getContent(course.title)}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                        {getContent(course.description)}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {course.duration}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                          {course.level}
                        </span>
                      </div>
                      <Link to={`/courses/${course.id}`}>
                        <Button
                          variant="outline"
                          className="w-full rounded-full group-hover:bg-[#5B5BF7] group-hover:text-white group-hover:border-[#5B5BF7] dark:text-white dark:border-slate-600 transition-all"
                        >
                          {t('popularCourses.learnMore')}
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 md:py-32 bg-white dark:bg-slate-900 overflow-hidden" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {t('testimonials.title')}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {t('testimonials.subtitle')}
            </p>
          </motion.div>

          {/* Auto-scroll Testimonials Marquee */}
          <div className="relative overflow-hidden">
            <motion.div
              className="flex gap-8"
              animate={{
                x: [0, -1 * (testimonials.length > 0 ? testimonials.length * 420 : 1260)],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: testimonials.length > 0 ? testimonials.length * 8 : 24,
                  ease: "linear",
                },
              }}
            >
              {/* Duplicate testimonials for seamless loop */}
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <div
                  key={`${testimonial.id}-${index}`}
                  className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 flex-shrink-0 w-[380px]"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                    "{getContent(testimonial.content)}"
                  </p>
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.image_url || `https://ui-avatars.com/api/?name=${testimonial.name}&background=5B5BF7&color=fff`}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.course}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Blog Carousel Section - Auto-scroll like Testimonials */}
      {homepageBlogs.length > 0 && (
        <section className="py-24 md:py-32 bg-slate-50 dark:bg-slate-800 overflow-hidden" data-testid="blog-carousel-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="flex flex-col md:flex-row md:items-end justify-between mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {t('blog.title')}
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  {t('blog.subtitle')}
                </p>
              </div>
              <Link to="/blog" className="mt-6 md:mt-0">
                <Button variant="outline" className="rounded-full group dark:text-white dark:border-slate-600">
                  {t('blog.viewAll')}
                  <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            {/* Auto-scroll Blog Marquee - Same as Testimonials */}
            <div className="relative overflow-hidden">
              <motion.div
                className="flex gap-8"
                animate={{
                  x: [0, -1 * (homepageBlogs.length > 0 ? homepageBlogs.length * 420 : 1260)],
                }}
                transition={{
                  x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: homepageBlogs.length > 0 ? homepageBlogs.length * 8 : 24,
                    ease: "linear",
                  },
                }}
              >
                {/* Duplicate blogs for seamless loop */}
                {[...homepageBlogs, ...homepageBlogs].map((blog, index) => (
                  <div
                    key={`${blog.id}-${index}`}
                    className="flex-shrink-0 w-[380px]"
                  >
                    <Card className="group h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                      <div className="relative overflow-hidden">
                        <img
                          src={getBlogImage(blog)}
                          alt={getContent(blog.title)}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(blog.created_at)}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[#5B5BF7] transition-colors line-clamp-2">
                          {getContent(blog.title)}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                          {getContent(blog.excerpt)}
                        </p>
                        <Link to={`/blog/${blog.slug}`}>
                          <Button
                            variant="outline"
                            className="rounded-full group-hover:bg-[#5B5BF7] group-hover:text-white group-hover:border-[#5B5BF7] dark:text-white dark:border-slate-600 transition-all"
                          >
                            {t('popularCourses.learnMore')}
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Trial Lesson CTA Section */}
      <TrialLessonSection />
    </div>
  );
}

// Trial Lesson Form Section Component
function TrialLessonSection() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    full_name: '',
    contact: '',
    course: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.contact || !formData.course) {
      toast.error(t('trialLesson.fillAll'));
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/trial-lessons`, formData);
      toast.success(t('trialLesson.success'));
      setFormData({ full_name: '', contact: '', course: '' });
    } catch (error) {
      toast.error(t('trialLesson.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-[#5B5BF7] via-[#4A4AE0] to-[#6B5BF7]" data-testid="cta-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left Side - Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="text-6xl md:text-7xl mb-6">🚀</div>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {t('trialLesson.title')}
            </h2>
          </motion.div>

          {/* Right Side - Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl">
              <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
                {t('trialLesson.formTitle')}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <Input
                    type="text"
                    placeholder={t('trialLesson.namePlaceholder')}
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full h-14 px-5 text-base rounded-xl border-slate-200 focus:border-[#5B5BF7] focus:ring-[#5B5BF7]"
                    data-testid="trial-name-input"
                  />
                </div>

                {/* Phone or Email */}
                <div>
                  <Input
                    type="text"
                    placeholder={t('trialLesson.contactPlaceholder')}
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full h-14 px-5 text-base rounded-xl border-slate-200 focus:border-[#5B5BF7] focus:ring-[#5B5BF7]"
                    data-testid="trial-contact-input"
                  />
                </div>

                {/* Course Input - Manual Text Entry */}
                <div>
                  <Input
                    type="text"
                    placeholder={t('trialLesson.coursePlaceholder')}
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full h-14 px-5 text-base rounded-xl border-slate-200 focus:border-[#5B5BF7] focus:ring-[#5B5BF7]"
                    data-testid="trial-course-input"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-[#5B5BF7] hover:bg-[#4A4AE0] text-white text-lg font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
                  data-testid="trial-submit-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t('trialLesson.submitting')}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      {t('trialLesson.submit')}
                    </>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
