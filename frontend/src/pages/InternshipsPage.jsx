import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { Clock, Tag, ArrowRight, Filter } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  { value: '', label: { en: 'All', az: 'Hamısı', ru: 'Все' } },
  { value: 'IT', label: { en: 'IT', az: 'IT', ru: 'IT' } },
  { value: 'Finance', label: { en: 'Finance', az: 'Maliyyə', ru: 'Финансы' } },
  { value: 'Business', label: { en: 'Business', az: 'Biznes', ru: 'Бизнес' } },
  { value: 'Marketing', label: { en: 'Marketing', az: 'Marketinq', ru: 'Маркетинг' } },
  { value: 'Other', label: { en: 'Other', az: 'Digər', ru: 'Другое' } },
];

export function InternshipsPage() {
  const { t, getContent, language } = useLanguage();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const params = selectedCategory ? `?category=${selectedCategory}` : '';
        const res = await axios.get(`${API}/internships${params}`);
        setInternships(res.data);
      } catch (error) {
        console.error('Error fetching internships:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInternships();
  }, [selectedCategory]);

  useEffect(() => {
    // Track page view
    axios.post(`${API}/analytics/pageview`, {
      page_path: '/internships',
      page_title: 'Internships',
      device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    }).catch(() => {});
  }, []);

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'it':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'finance':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'business':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'marketing':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div data-testid="internships-page" className="min-h-screen bg-white dark:bg-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 
              data-testid="internships-title"
              className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {t('internships.title')}
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300">
              {t('internships.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <Filter className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setSelectedCategory(cat.value); setLoading(true); }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-[#5B5BF7] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label[language] || cat.label.en}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Internships List */}
      <section className="py-12 md:py-16 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : internships.length === 0 ? (
            <div className="text-center py-16">
              <Tag className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-2">
                {t('internships.noInternships')}
              </p>
              <p className="text-slate-500 dark:text-slate-500">
                {t('internships.checkBack')}
              </p>
            </div>
          ) : (
            <motion.div 
              className="grid md:grid-cols-2 gap-6"
              initial="initial"
              animate="animate"
              variants={{
                animate: { transition: { staggerChildren: 0.1 } }
              }}
            >
              {internships.map((internship, index) => (
                <motion.div
                  key={internship.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="group h-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(internship.category)}`}>
                          {internship.category}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{internship.duration}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[#5B5BF7] transition-colors">
                        {getContent(internship.title)}
                      </h3>
                      
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 line-clamp-3">
                        {getContent(internship.description)}
                      </p>
                      
                      <a 
                        href={`mailto:internships@novatech.az?subject=Application for ${getContent(internship.title)}`}
                        className="inline-block"
                      >
                        <Button className="bg-[#5B5BF7] hover:bg-[#4A4AE0] text-white rounded-full px-6">
                          {t('internships.apply')}
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
