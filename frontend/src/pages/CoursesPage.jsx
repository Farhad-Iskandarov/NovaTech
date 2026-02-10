import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Clock, ArrowRight } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Filter categories - ID must match exactly with course.category from database
const FILTER_CATEGORIES = [
  { id: 'all', labelKey: 'filterAll' },
  { id: 'development', labelKey: 'filterDevelopment' },
  { id: 'design', labelKey: 'filterDesign' },
  { id: 'marketing', labelKey: 'filterMarketing' },
  { id: 'office', labelKey: 'filterOffice' },
  { id: 'kids', labelKey: 'filterKids' },
];

export function CoursesPage() {
  const { t, getContent } = useLanguage();
  
  // State
  const [allCourses, setAllCourses] = useState([]);
  const [displayedCourses, setDisplayedCourses] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch courses on mount
  useEffect(() => {
    const loadCourses = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API}/courses`);
        const coursesData = response.data || [];
        
        console.log('Loaded courses:', coursesData.length);
        coursesData.forEach(c => {
          console.log(`- ${c.title?.en || c.title?.az}: category="${c.category}"`);
        });
        
        setAllCourses(coursesData);
        setDisplayedCourses(coursesData); // Show all by default
      } catch (err) {
        console.error('Failed to load courses:', err);
        setError('Failed to load courses');
        setAllCourses([]);
        setDisplayedCourses([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCourses();
    
    // Track page view
    axios.post(`${API}/analytics/pageview`, {
      page_path: '/courses',
      page_title: 'Courses',
      device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    }).catch(() => {});
  }, []);

  // Handle filter change - completely separate from loading
  const handleFilterClick = (filterId) => {
    console.log('Filter clicked:', filterId);
    setActiveFilter(filterId);
    
    if (filterId === 'all') {
      console.log('Showing all courses:', allCourses.length);
      setDisplayedCourses(allCourses);
    } else {
      const filtered = allCourses.filter(course => {
        const courseCategory = (course.category || '').toLowerCase().trim();
        const filterValue = filterId.toLowerCase().trim();
        const match = courseCategory === filterValue;
        console.log(`  Checking "${course.title?.en}": "${courseCategory}" === "${filterValue}" => ${match}`);
        return match;
      });
      console.log('Filtered courses:', filtered.length);
      setDisplayedCourses(filtered);
    }
  };

  return (
    <div data-testid="courses-page" className="min-h-screen bg-white dark:bg-slate-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 
              data-testid="courses-title"
              className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {t('courses.title')}
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300">
              {t('courses.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Filter Buttons + Courses Grid */}
      <section className="py-8 md:py-12 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-8" data-testid="filter-buttons">
            {FILTER_CATEGORIES.map(category => (
              <button
                key={category.id}
                type="button"
                data-testid={`filter-${category.id}`}
                onClick={() => handleFilterClick(category.id)}
                className={`
                  px-6 py-2 rounded-full text-sm font-medium transition-all duration-200
                  ${activeFilter === category.id 
                    ? 'bg-[#5B5BF7] text-white shadow-lg shadow-[#5B5BF7]/30' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-[#5B5BF7] hover:text-[#5B5BF7]'
                  }
                `}
              >
                {t(`courses.${category.labelKey}`)}
              </button>
            ))}
          </div>

          {/* Debug Info - Remove in production */}
          <div className="hidden text-center mb-4 text-sm text-slate-500">
            Active Filter: {activeFilter} | Total: {allCourses.length} | Displayed: {displayedCourses.length}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="courses-loading">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 animate-pulse">
                  <div className="w-full h-48 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4" />
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-4" />
                  <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-full w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-16" data-testid="courses-error">
              <p className="text-red-500 text-lg">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-[#5B5BF7] text-white rounded-full"
              >
                Retry
              </button>
            </div>
          )}

          {/* No Courses Found */}
          {!isLoading && !error && displayedCourses.length === 0 && (
            <div className="text-center py-16" data-testid="courses-empty">
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                {t('courses.noCourses') || 'No courses found in this category'}
              </p>
              <button 
                onClick={() => handleFilterClick('all')}
                className="mt-4 px-6 py-2 bg-[#5B5BF7] text-white rounded-full hover:bg-[#4A4AE0] transition-colors"
              >
                Show All Courses
              </button>
            </div>
          )}

          {/* Courses Grid */}
          {!isLoading && !error && displayedCourses.length > 0 && (
            <div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" 
              data-testid="courses-grid"
            >
              {displayedCourses.map(course => (
                <div 
                  key={course.id} 
                  className="group"
                  data-testid={`course-card-${course.id}`}
                  data-category={course.category}
                >
                  <Card className="h-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                    {/* Course Image */}
                    <div className="relative overflow-hidden">
                      <img 
                        src={course.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'}
                        alt={getContent(course.title)}
                        className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      {/* Category Badge */}
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full text-xs font-semibold text-[#5B5BF7] capitalize">
                          {course.category}
                        </span>
                        {course.is_popular && (
                          <span className="px-3 py-1 bg-[#00C9A7] rounded-full text-xs font-semibold text-white">
                            Popular
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Course Content */}
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[#5B5BF7] transition-colors line-clamp-2">
                        {getContent(course.title)}
                      </h3>
                      
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                        {getContent(course.description)}
                      </p>
                      
                      {/* Course Meta */}
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {course.duration}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                          {course.level}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                          {course.format}
                        </span>
                      </div>
                      
                      {/* Price */}
                      {course.price && (
                        <p className="text-lg font-bold text-[#5B5BF7] mb-4">{course.price}</p>
                      )}
                      
                      {/* Action Button */}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
