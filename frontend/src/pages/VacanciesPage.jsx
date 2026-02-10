import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { MapPin, Briefcase, Clock, ArrowRight } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function VacanciesPage() {
  const { t, getContent } = useLanguage();
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVacancies = async () => {
      try {
        const res = await axios.get(`${API}/vacancies`);
        setVacancies(res.data);
      } catch (error) {
        console.error('Error fetching vacancies:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVacancies();

    // Track page view
    axios.post(`${API}/analytics/pageview`, {
      page_path: '/vacancies',
      page_title: 'Vacancies',
      device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    }).catch(() => {});
  }, []);

  const getJobTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'full-time':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'part-time':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'remote':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div data-testid="vacancies-page" className="min-h-screen bg-white dark:bg-slate-900">
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
              data-testid="vacancies-title"
              className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {t('vacancies.title')}
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300">
              {t('vacancies.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Vacancies List */}
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
          ) : vacancies.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-2">
                {t('vacancies.noVacancies')}
              </p>
              <p className="text-slate-500 dark:text-slate-500">
                {t('vacancies.checkBack')}
              </p>
            </div>
          ) : (
            <motion.div 
              className="space-y-6"
              initial="initial"
              animate="animate"
              variants={{
                animate: { transition: { staggerChildren: 0.1 } }
              }}
            >
              {vacancies.map((vacancy, index) => (
                <motion.div
                  key={vacancy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[#5B5BF7] transition-colors">
                            {getContent(vacancy.title)}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getJobTypeColor(vacancy.job_type)}`}>
                              {vacancy.job_type}
                            </span>
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <Briefcase className="w-4 h-4" />
                              <span className="text-sm">{getContent(vacancy.department)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">{vacancy.location}</span>
                            </div>
                          </div>
                          
                          <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                            {getContent(vacancy.description)}
                          </p>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <a 
                            href={`mailto:hr@novatech.az?subject=Application for ${getContent(vacancy.title)}`}
                            className="inline-block"
                          >
                            <Button className="bg-[#5B5BF7] hover:bg-[#4A4AE0] text-white rounded-full px-6">
                              {t('vacancies.apply')}
                              <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                          </a>
                        </div>
                      </div>
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
