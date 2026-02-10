import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { useTheme } from '../lib/ThemeContext';
import { Menu, X, ChevronDown, Globe, Sun, Moon } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const languages = [
  { 
    code: 'az', 
    name: 'Azərbaycan',
    flag: 'https://flagcdn.com/w40/az.png'
  },
  { 
    code: 'en', 
    name: 'English',
    flag: 'https://flagcdn.com/w40/gb.png'
  },
  { 
    code: 'ru', 
    name: 'Русский',
    flag: 'https://flagcdn.com/w40/ru.png'
  },
];

export function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredDropdown, setHoveredDropdown] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks = [
    { path: '/', label: t('nav.home'), type: 'link' },
    { path: '/about', label: t('nav.about'), type: 'link' },
    { path: '/courses', label: t('nav.courses'), type: 'link' },
    { 
      label: t('nav.vacancies'), 
      type: 'dropdown',
      items: [
        { path: '/vacancies', label: t('nav.vacanciesDropdown') },
        { path: '/internships', label: t('nav.internshipsDropdown') }
      ]
    },
    { path: '/blog', label: t('nav.blog'), type: 'link' },
    { path: '/contact', label: t('nav.contact'), type: 'link' },
  ];

  const currentLang = languages.find(l => l.code === language);

  return (
    <header
      data-testid="header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm' 
          : 'bg-white dark:bg-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
            <img 
              src="/logo.jpg"
              alt="Novatech"
              className="h-12 w-12 object-contain"
            />
            <span className="text-xl font-bold text-slate-900 dark:text-white hidden sm:block">Novatech</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((item, index) => {
              if (item.type === 'dropdown') {
                const isActive = item.items.some(subItem => location.pathname === subItem.path);
                return (
                  <div 
                    key={index}
                    className="relative group"
                    onMouseEnter={() => setHoveredDropdown(index)}
                    onMouseLeave={() => setHoveredDropdown(null)}
                  >
                    <button
                      className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-[#5B5BF7] py-2 ${
                        isActive
                          ? 'text-[#5B5BF7]' 
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                      data-testid={`nav-dropdown-${item.label.toLowerCase()}`}
                    >
                      {item.label}
                      <ChevronDown className={`w-4 h-4 transition-transform ${hoveredDropdown === index ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Hover Dropdown Menu */}
                    {hoveredDropdown === index && (
                      <div className="absolute top-full left-0 pt-2 w-56">
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                          {item.items.map(subItem => (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              className={`block px-4 py-2.5 text-sm transition-colors ${
                                location.pathname === subItem.path 
                                  ? 'bg-slate-100 dark:bg-slate-700 text-[#5B5BF7]' 
                                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                              }`}
                              data-testid={`nav-${subItem.path.replace('/', '')}`}
                            >
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.path.replace('/', '') || 'home'}`}
                  className={`text-sm font-medium transition-colors hover:text-[#5B5BF7] ${
                    location.pathname === item.path 
                      ? 'text-[#5B5BF7]' 
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="theme-toggle"
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
            </Button>

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  data-testid="language-switcher"
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <img 
                    src={currentLang?.flag} 
                    alt={currentLang?.name}
                    className="w-5 h-4 object-cover rounded-sm"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{currentLang?.code.toUpperCase()}</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark:bg-slate-800 dark:border-slate-700">
                {languages.map(lang => (
                  <DropdownMenuItem
                    key={lang.code}
                    data-testid={`lang-${lang.code}`}
                    onClick={() => setLanguage(lang.code)}
                    className={`cursor-pointer flex items-center gap-3 ${
                      language === lang.code ? 'bg-slate-100 dark:bg-slate-700' : ''
                    }`}
                  >
                    <img 
                      src={lang.flag} 
                      alt={lang.name}
                      className="w-6 h-4 object-cover rounded-sm"
                    />
                    <span className="dark:text-slate-200">{lang.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* CTA Button */}
            <Link to="/contact" className="hidden md:block">
              <Button 
                data-testid="header-cta"
                className="bg-[#5B5BF7] hover:bg-[#4A4AE0] text-white rounded-full px-6 shadow-lg shadow-blue-500/20"
              >
                {t('nav.freeConsultation')}
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden dark:text-white"
              onClick={() => setIsOpen(!isOpen)}
              data-testid="mobile-menu-toggle"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 dark:border-slate-700" data-testid="mobile-menu">
            <nav className="flex flex-col gap-1">
              {navLinks.map((item, index) => {
                if (item.type === 'dropdown') {
                  return (
                    <div key={index} className="mb-2">
                      <div className="px-4 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 mb-1">
                        {item.label}
                      </div>
                      <div className="pl-2">
                        {item.items.map(subItem => (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                              location.pathname === subItem.path
                                ? 'bg-[#5B5BF7]/10 text-[#5B5BF7]'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-[#5B5BF7]/10 text-[#5B5BF7]'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="mt-3 px-2">
                <Link to="/contact">
                  <Button className="w-full bg-[#5B5BF7] hover:bg-[#4A4AE0] text-white rounded-full">
                    {t('nav.freeConsultation')}
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
