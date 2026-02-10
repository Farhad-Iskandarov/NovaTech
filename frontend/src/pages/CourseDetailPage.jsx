import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { Button } from '../components/ui/button';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '../components/ui/accordion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { motion } from 'framer-motion';
import { Clock, Monitor, Award, GraduationCap, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function CourseDetailPage() {
  const { id } = useParams();
  const { t, getContent } = useLanguage();
  const [course, setCourse] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, faqsRes] = await Promise.all([
          axios.get(`${API}/courses/${id}`),
          axios.get(`${API}/faqs/${id}`)
        ]);
        setCourse(courseRes.data);
        setFaqs(faqsRes.data);
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Track page view
    axios.post(`${API}/analytics/pageview`, {
      page_path: `/courses/${id}`,
      page_title: 'Course Detail',
      device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    }).catch(() => {});
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/submissions/application`, {
        ...formData,
        course_id: course.id,
        course_name: getContent(course.title)
      });
      toast.success(t('application.success'));
      setShowModal(false);
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      toast.error(t('application.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5B5BF7]" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center">
        <p className="text-xl text-slate-600 dark:text-slate-300 mb-4">Course not found</p>
        <Link to="/courses">
          <Button variant="outline" className="rounded-full">
            <ArrowLeft className="mr-2 w-4 h-4" />
            {t('common.backHome')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="course-detail-page" className="min-h-screen bg-white dark:bg-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            to="/courses" 
            className="inline-flex items-center text-slate-600 dark:text-slate-300 hover:text-[#5B5BF7] mb-6 transition-colors"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Courses
          </Link>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex gap-2 mb-4">
                <span className="px-3 py-1 bg-[#5B5BF7]/10 rounded-full text-sm font-semibold text-[#5B5BF7]">
                  {course.category}
                </span>
                {course.is_popular && (
                  <span className="px-3 py-1 bg-[#00C9A7] rounded-full text-sm font-semibold text-white">
                    Popular
                  </span>
                )}
              </div>
              
              <h1 
                data-testid="course-title"
                className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                {getContent(course.title)}
              </h1>
              
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                {getContent(course.description)}
              </p>

              {/* Course Info */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-[#5B5BF7]" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('courseDetail.duration')}</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{course.duration}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-[#5B5BF7]" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('courseDetail.format')}</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{course.format}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-[#5B5BF7]" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('courseDetail.level')}</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{course.level}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-[#5B5BF7]" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('courseDetail.certificate')}</p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {course.certificate ? t('courseDetail.yes') : t('courseDetail.no')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {course.price && (
                <p className="text-3xl font-bold text-[#5B5BF7] mb-6">{course.price}</p>
              )}

              <Button 
                onClick={() => setShowModal(true)}
                data-testid="apply-now-btn"
                size="lg"
                className="bg-[#5B5BF7] hover:bg-[#4A4AE0] text-white rounded-full px-10 py-6 text-lg font-semibold shadow-lg shadow-blue-500/20"
              >
                {t('courseDetail.applyNow')}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img 
                src={course.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'}
                alt={getContent(course.title)}
                className="rounded-3xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* What You'll Learn & Curriculum */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* What You'll Learn */}
            {course.outcomes && course.outcomes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {t('courseDetail.whatYouLearn')}
                </h2>
                <ul className="space-y-4">
                  {course.outcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-[#00C9A7] flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 dark:text-slate-300">{getContent(outcome)}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Curriculum */}
            {course.curriculum && course.curriculum.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {t('courseDetail.curriculum')}
                </h2>
                <ul className="space-y-4">
                  {course.curriculum.map((item, index) => (
                    <li key={index} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="w-8 h-8 rounded-full bg-[#5B5BF7] text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{getContent(item)}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-800" data-testid="faq-section">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {t('courseDetail.faq')}
              </h2>
            </motion.div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={faq.id} 
                  value={faq.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-slate-900 dark:text-white hover:text-[#5B5BF7]">
                    {getContent(faq.question)}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-600 dark:text-slate-300">
                    {getContent(faq.answer)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* Application Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('application.title')}</DialogTitle>
            <DialogDescription>
              {getContent(course.title)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('application.name')} *</Label>
              <Input 
                id="name"
                data-testid="application-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('application.name')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('application.email')} *</Label>
              <Input 
                id="email"
                type="email"
                data-testid="application-email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('application.email')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('application.phone')} *</Label>
              <Input 
                id="phone"
                type="tel"
                data-testid="application-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t('application.phone')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">{t('application.message')}</Label>
              <Textarea 
                id="message"
                data-testid="application-message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={t('application.message')}
                rows={3}
              />
            </div>
            <Button 
              type="submit" 
              data-testid="application-submit"
              className="w-full bg-[#5B5BF7] hover:bg-[#4A4AE0] text-white rounded-full"
              disabled={submitting}
            >
              {submitting ? t('application.submitting') : t('application.submit')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
