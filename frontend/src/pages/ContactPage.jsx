import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useSettings } from '../lib/SettingsContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function ContactPage() {
  const { t, getContent } = useLanguage();
  const { settings } = useSettings();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  useEffect(() => {
    // Track page view
    axios.post(`${API}/analytics/pageview`, {
      page_path: '/contact',
      page_title: 'Contact',
      device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/submissions/contact`, formData);
      toast.success(t('contact.form.success'));
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      toast.error(t('contact.form.error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Get contact info from settings
  const contact = settings?.contact || {};
  const address = contact.address ? getContent(contact.address) : 'Sumgayit, Markaz Plaza, Azerbaijan';
  const phone = contact.phones?.[0] || settings?.whatsapp_number || '+123456789';
  const email = contact.email || 'info@novatech.az';
  const mapEmbed = contact.google_map_embed || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3047.9947858825374!2d49.6619!3d40.5898!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sSumgayit%2C%20Azerbaijan!5e0!3m2!1sen!2s!4v1629789123456!5m2!1sen!2s";
  const workingHours = settings?.working_hours || { start: "09:00", end: "17:00" };

  const contactInfo = [
    {
      icon: MapPin,
      title: t('contact.address'),
      content: address
    },
    {
      icon: Phone,
      title: t('contact.phone'),
      content: phone,
      href: `tel:${phone}`
    },
    {
      icon: Mail,
      title: t('contact.email'),
      content: email,
      href: `mailto:${email}`
    },
    {
      icon: Clock,
      title: t('contact.workingHours'),
      content: `${workingHours.start} - ${workingHours.end}`
    }
  ];

  return (
    <div data-testid="contact-page" className="min-h-screen bg-white dark:bg-slate-900">
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
              data-testid="contact-title"
              className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {t('contact.title')}
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300">
              {t('contact.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="space-y-8 mb-12">
                {contactInfo.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#5B5BF7]/10 dark:bg-[#5B5BF7]/20 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-[#5B5BF7]" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{item.title}</p>
                      {item.href ? (
                        <a href={item.href} className="text-lg font-semibold text-slate-900 dark:text-white hover:text-[#5B5BF7] transition-colors">
                          {item.content}
                        </a>
                      ) : (
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">{item.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Map */}
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <iframe
                  src={mapEmbed}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Novatech Location"
                />
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 md:p-10">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name" className="dark:text-slate-200">{t('contact.form.name')} *</Label>
                    <Input 
                      id="contact-name"
                      data-testid="contact-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t('contact.form.name')}
                      className="h-12 rounded-lg border-slate-200 dark:border-slate-600 focus:border-[#5B5BF7] focus:ring-[#5B5BF7] bg-white dark:bg-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email" className="dark:text-slate-200">{t('contact.form.email')} *</Label>
                    <Input 
                      id="contact-email"
                      type="email"
                      data-testid="contact-email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t('contact.form.email')}
                      className="h-12 rounded-lg border-slate-200 dark:border-slate-600 focus:border-[#5B5BF7] focus:ring-[#5B5BF7] bg-white dark:bg-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone" className="dark:text-slate-200">{t('contact.form.phone')}</Label>
                    <Input 
                      id="contact-phone"
                      type="tel"
                      data-testid="contact-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={t('contact.form.phone')}
                      className="h-12 rounded-lg border-slate-200 dark:border-slate-600 focus:border-[#5B5BF7] focus:ring-[#5B5BF7] bg-white dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-message" className="dark:text-slate-200">{t('contact.form.message')} *</Label>
                    <Textarea 
                      id="contact-message"
                      data-testid="contact-message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={t('contact.form.message')}
                      rows={5}
                      className="rounded-lg border-slate-200 dark:border-slate-600 focus:border-[#5B5BF7] focus:ring-[#5B5BF7] bg-white dark:bg-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    data-testid="contact-submit"
                    size="lg"
                    className="w-full bg-[#5B5BF7] hover:bg-[#4A4AE0] text-white rounded-full py-6 font-semibold"
                    disabled={submitting}
                  >
                    {submitting ? t('contact.form.sending') : t('contact.form.submit')}
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
