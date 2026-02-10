import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, ArrowLeft, Clock, Share2, ChevronRight } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export function BlogPage() {
  const { t, getContent, language } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get(`${API}/blogs`);
        setPosts(res.data);
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();

    // Track page view
    axios.post(`${API}/analytics/pageview`, {
      page_path: '/blog',
      page_title: 'Blog',
      device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    }).catch(() => {});
  }, []);

  // Manual date formatting for consistent output across all languages
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

  return (
    <div data-testid="blog-page" className="min-h-screen bg-white dark:bg-slate-900">
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
              data-testid="blog-title"
              className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {t('blog.title')}
            </h1>
            <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {t('blog.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-12 md:py-16 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="w-full h-56 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4" />
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-500 dark:text-slate-400 text-lg mb-6">{t('blog.noPosts')}</p>
              <p className="text-slate-400 dark:text-slate-500">Check back soon for updates!</p>
            </div>
          ) : (
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="initial"
              animate="animate"
              variants={{
                animate: {
                  transition: { staggerChildren: 0.1 }
                }
              }}
            >
              {posts.map(post => {
                // Get the correct image for this specific post
                const postImage = post.image_url || 
                  post.content_blocks?.find(block => block.type === 'image')?.image_url || 
                  'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800';
                
                return (
                  <motion.div key={post.id} variants={fadeInUp}>
                    <Card className="group h-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                      <div className="relative overflow-hidden">
                        <img 
                          src={postImage}
                          alt={getContent(post.title)}
                          className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
                          <Calendar className="w-4 h-4" />
                          {formatDate(post.created_at)}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-[#5B5BF7] transition-colors line-clamp-2">
                          {getContent(post.title)}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3">
                          {getContent(post.excerpt)}
                        </p>
                        <Link to={`/blog/${post.slug}`}>
                          <Button variant="ghost" className="p-0 h-auto text-[#5B5BF7] hover:text-[#4A4AE0] group-hover:translate-x-1 transition-all">
                            {t('blog.readMore')}
                            <ArrowRight className="ml-1 w-4 h-4" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}

export function BlogDetailPage() {
  const { slug } = useParams();
  const { t, getContent, language } = useLanguage();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postRes, allPostsRes] = await Promise.all([
          axios.get(`${API}/blogs/${slug}`),
          axios.get(`${API}/blogs`)
        ]);
        setPost(postRes.data);
        // Get related posts (excluding current post)
        setRelatedPosts(allPostsRes.data.filter(p => p.slug !== slug).slice(0, 4));
      } catch (error) {
        console.error('Error fetching blog post:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Track page view
    axios.post(`${API}/analytics/pageview`, {
      page_path: `/blog/${slug}`,
      page_title: 'Blog Post',
      device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    }).catch(() => {});
  }, [slug]);

  // Manual date formatting for consistent output across all languages
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

  // Estimate reading time based on content blocks
  const getReadingTime = () => {
    if (!post?.content_blocks) return '3-4';
    let totalWords = 0;
    post.content_blocks.forEach(block => {
      if (block.type === 'text' && block.text) {
        const text = getContent(block.text).replace(/<[^>]*>/g, '');
        totalWords += text.split(/\s+/).length;
      }
    });
    const minutes = Math.ceil(totalWords / 200) || 3;
    return `${minutes}-${minutes + 1}`;
  };

  // Share functions
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post ? getContent(post.title) : '';

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-900">
        <p className="text-xl text-slate-600 dark:text-slate-300 mb-4">Blog yazısı tapılmadı</p>
        <Link to="/blog">
          <Button variant="outline" className="rounded-full">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Bloqa qayıt
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="blog-detail-page" className="bg-white dark:bg-slate-900">
      {/* Breadcrumb */}
      <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Link to="/blog" className="hover:text-[#5B5BF7] transition-colors">
              Bloq
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <span className="text-slate-900 dark:text-white font-medium truncate max-w-[300px]">
              {getContent(post.title)}
            </span>
          </nav>
        </div>
      </div>

      <article className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Title */}
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {getContent(post.title)}
            </h1>

            {/* Meta Info Row */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-8 pb-6 border-b border-slate-200 dark:border-slate-700">
              {/* Reading Time */}
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{getReadingTime()} dəq. oxuma vaxtı</span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{formatDate(post.created_at)}</span>
              </div>

              {/* Share Buttons */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-slate-500 dark:text-slate-400 mr-1">Paylaş:</span>
                <a 
                  href={shareLinks.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-[#1877F2] hover:text-white flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a 
                  href={shareLinks.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-[#0A66C2] hover:text-white flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"
                  aria-label="LinkedIn"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a 
                  href={shareLinks.whatsapp} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-[#25D366] hover:text-white flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"
                  aria-label="WhatsApp"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <a 
                  href={shareLinks.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-black hover:text-white flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all"
                  aria-label="X (Twitter)"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>

            {/* Featured Image */}
            {post.image_url && (
              <div className="mb-10">
                <img 
                  src={post.image_url}
                  alt={getContent(post.title)}
                  className="w-full rounded-2xl shadow-lg"
                />
              </div>
            )}

            {/* Content Blocks with Modern Animation */}
            <div className="space-y-12">
              {post.content_blocks && post.content_blocks.length > 0 ? (
                post.content_blocks.map((block, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    {block.type === 'image' && block.image_url ? (
                      <div className="flex justify-center my-8">
                        <div className="w-full max-w-2xl">
                          <img
                            src={block.image_url}
                            alt=""
                            className="w-full h-auto rounded-xl shadow-lg object-cover hover:shadow-2xl transition-shadow duration-300"
                            style={{ maxHeight: '500px' }}
                          />
                        </div>
                      </div>
                    ) : block.type === 'text' && block.text ? (
                      <div className="prose prose-lg max-w-none
                        prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white
                        prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:text-base
                        prose-a:text-[#5B5BF7] prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-slate-900 dark:prose-strong:text-white
                        prose-ul:text-slate-700 dark:prose-ul:text-slate-300 prose-ol:text-slate-700 dark:prose-ol:text-slate-300">
                        <p className="whitespace-pre-wrap">{getContent(block.text)}</p>
                      </div>
                    ) : null}
                  </motion.div>
                ))
              ) : (
                <div className="prose prose-lg max-w-none
                  prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white
                  prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed
                  prose-a:text-[#5B5BF7] prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-slate-900 dark:prose-strong:text-white
                  prose-ul:text-slate-700 dark:prose-ul:text-slate-300 prose-ol:text-slate-700 dark:prose-ol:text-slate-300
                  prose-img:rounded-xl prose-img:shadow-md"
                >
                  <p className="text-slate-500 dark:text-slate-400 italic">No content available</p>
                </div>
              )}
            </div>

            {/* Tags/Date Footer */}
            <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Dərc edildi: {formatDate(post.created_at)}
              </p>
            </div>
          </motion.div>
        </div>
      </article>

      {/* Related Posts Section */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-slate-50 dark:bg-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-8">
              {language === 'en' ? 'Similar Posts' : language === 'ru' ? 'Похожие статьи' : 'Oxşar Yazılar'}
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedPosts.map(relatedPost => {
                // Get the correct image for this specific related post
                const relatedPostImage = relatedPost.image_url ||
                  relatedPost.content_blocks?.find(block => block.type === 'image')?.image_url || 
                  'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800';
                return (
                  <Link 
                    key={relatedPost.id} 
                    to={`/blog/${relatedPost.slug}`}
                    className="group"
                  >
                    <Card className="h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                      <div className="relative overflow-hidden">
                        <img 
                          src={relatedPostImage}
                          alt={getContent(relatedPost.title)}
                          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                          <Clock className="w-3 h-3" />
                          <span>{getReadingTime()} {language === 'en' ? 'min read' : language === 'ru' ? 'мин. чтения' : 'dəq. oxuma vaxtı'}</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-[#5B5BF7] transition-colors line-clamp-2 text-base">
                          {getContent(relatedPost.title)}
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
