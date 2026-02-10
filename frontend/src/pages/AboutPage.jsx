import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { motion } from 'framer-motion';
import { Target, Eye, BookOpen } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export function AboutPage() {
  const { t, getContent, language } = useLanguage();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Translations for facility section
  const facilityText = {
    az: {
      title: 'Markaz Plaza, Sumqayıt',
      description: 'Sumqayıtın mərkəzində yerləşən müasir mərkəzimiz öyrənmə üçün ideal mühit yaradır. Ən müasir avadanlıq və rahat sinif otaqları ilə tələbələrimizin uğur qazanması üçün lazım olan hər şeyi təmin edirik.',
      graduates: 'Məzunlar',
      courses: 'Kurslar', 
      instructors: 'Müəllimlər'
    },
    en: {
      title: 'Markaz Plaza, Sumgayit',
      description: 'Located in the heart of Sumgayit, our modern facility provides the perfect environment for learning. With state-of-the-art equipment and comfortable classrooms, we ensure our students have everything they need to succeed.',
      graduates: 'Graduates',
      courses: 'Courses',
      instructors: 'Instructors'
    },
    ru: {
      title: 'Маркази Плаза, Сумгаит',
      description: 'Расположенный в самом сердце Сумгаита, наш современный центр обеспечивает идеальную среду для обучения. Благодаря современному оборудованию и комфортным классам мы гарантируем нашим студентам всё необходимое для успеха.',
      graduates: 'Выпускники',
      courses: 'Курсы',
      instructors: 'Преподаватели'
    }
  };

  const facility = facilityText[language] || facilityText.en;

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await axios.get(`${API}/teachers`);
        setTeachers(res.data);
      } catch (error) {
        console.error('Error fetching teachers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();

    // Track page view
    axios.post(`${API}/analytics/pageview`, {
      page_path: '/about',
      page_title: 'About Us',
      device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    }).catch(() => {});
  }, []);

  const values = [
    {
      icon: Target,
      title: t('about.mission.title'),
      content: t('about.mission.content')
    },
    {
      icon: Eye,
      title: t('about.vision.title'),
      content: t('about.vision.content')
    },
    {
      icon: BookOpen,
      title: t('about.story.title'),
      content: t('about.story.content')
    }
  ];

  return (
    <div data-testid="about-page" className="min-h-screen bg-white dark:bg-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 md:py-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#5B5BF7]/10 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 
              data-testid="about-title"
              className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {t('about.title')}
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('about.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission, Vision, Story */}
      <section className="py-16 md:py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 hover:shadow-lg transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#5B5BF7]/10 dark:bg-[#5B5BF7]/20 flex items-center justify-center mb-6">
                  <item.icon className="w-7 h-7 text-[#5B5BF7]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Image */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800"
                alt="Novatech Education Center"
                className="rounded-3xl shadow-xl"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {facility.title}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                {facility.description}
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl px-6 py-4 shadow-sm">
                  <p className="text-3xl font-bold text-[#5B5BF7]">500+</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{facility.graduates}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl px-6 py-4 shadow-sm">
                  <p className="text-3xl font-bold text-[#5B5BF7]">6</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{facility.courses}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl px-6 py-4 shadow-sm">
                  <p className="text-3xl font-bold text-[#5B5BF7]">10+</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{facility.instructors}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-20 bg-white dark:bg-slate-900" data-testid="team-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {t('about.team.title')}
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300">
              {t('about.team.subtitle')}
            </p>
          </motion.div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="text-center animate-pulse">
                  <div className="w-40 h-40 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32 mx-auto mb-2" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-12">
              {teachers.map((teacher, index) => (
                <motion.div
                  key={teacher.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center group"
                >
                  <div className="relative mb-6 inline-block">
                    <img 
                      src={teacher.image_url || `https://ui-avatars.com/api/?name=${teacher.name}&background=5B5BF7&color=fff&size=200`}
                      alt={teacher.name}
                      className="w-40 h-40 rounded-full object-cover mx-auto ring-4 ring-slate-100 dark:ring-slate-700 group-hover:ring-[#5B5BF7]/20 transition-all"
                    />
                    <div className="absolute inset-0 rounded-full bg-[#5B5BF7]/0 group-hover:bg-[#5B5BF7]/10 transition-all" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{teacher.name}</h3>
                  <p className="text-[#5B5BF7] font-medium mb-3">{getContent(teacher.role)}</p>
                  {teacher.bio && (
                    <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xs mx-auto">{getContent(teacher.bio)}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
