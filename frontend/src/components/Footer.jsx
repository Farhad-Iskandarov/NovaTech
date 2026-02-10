import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { useSettings } from '../lib/SettingsContext';
import { MapPin, Phone, Mail, Instagram, Facebook, Linkedin, Youtube } from 'lucide-react';

// TikTok icon (not in lucide-react)
const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const socialIcons = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: TikTokIcon
};

export function Footer() {
  const { t, getContent } = useLanguage();
  const { settings, loading } = useSettings();

  const quickLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/about', label: t('nav.about') },
    { path: '/courses', label: t('nav.courses') },
    { path: '/blog', label: t('nav.blog') },
    { path: '/contact', label: t('nav.contact') },
  ];

  // Get contact info from settings
  const contact = settings?.contact || {};
  const address = contact.address ? getContent(contact.address) : 'Sumgayit, Markaz Plaza, Azerbaijan';
  const phone = contact.phones?.[0] || settings?.whatsapp_number || '+123456789';
  const email = contact.email || 'info@novatech.az';

  // Get active social media links
  const socialLinks = (settings?.social_media || []).filter(s => s.is_active);

  return (
    <footer data-testid="footer" className="bg-slate-900 dark:bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="Novatech"
                className="h-12 w-12 object-contain rounded-lg bg-white p-1"
              />
              <span className="text-xl font-bold">Novatech</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">{t('footer.quickLinks')}</h4>
            <ul className="space-y-3">
              {quickLinks.map(link => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-slate-400 hover:text-[#5B5BF7] transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-6">{t('footer.contact')}</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#5B5BF7] flex-shrink-0 mt-0.5" />
                <span className="text-slate-400 text-sm">{address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#5B5BF7] flex-shrink-0" />
                <a href={`tel:${phone}`} className="text-slate-400 hover:text-white text-sm">
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#5B5BF7] flex-shrink-0" />
                <a href={`mailto:${email}`} className="text-slate-400 hover:text-white text-sm">
                  {email}
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-lg font-semibold mb-6">{t('footer.followUs')}</h4>
            <div className="flex flex-wrap gap-3">
              {socialLinks.length > 0 ? (
                socialLinks.map((social) => {
                  const IconComponent = socialIcons[social.platform] || Instagram;
                  return (
                    <a
                      key={social.platform}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`social-${social.platform}`}
                      className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#5B5BF7] transition-colors"
                      aria-label={social.platform}
                    >
                      <IconComponent className="w-5 h-5" />
                    </a>
                  );
                })
              ) : (
                <>
                  <a
                    href="https://instagram.com/novatech"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="social-instagram"
                    className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#5B5BF7] transition-colors"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href="https://facebook.com/novatech"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="social-facebook"
                    className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#5B5BF7] transition-colors"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Novatech Education Center. {t('footer.rights')}
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-slate-500 hover:text-slate-300 text-sm">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="text-slate-500 hover:text-slate-300 text-sm">
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
