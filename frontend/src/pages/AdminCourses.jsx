import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Pencil, Trash2, Search, MoveUp, MoveDown, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { ImageUploader } from '../components/ImageUploader';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyLocalizedContent = { en: '', az: '', ru: '' };

const categories = ['development', 'design', 'marketing', 'office', 'kids'];
const levels = ['Beginner', 'Intermediate', 'Advanced'];
const formats = ['Online', 'On-site', 'Hybrid'];

export function AdminCourses() {
  const { getContent } = useLanguage();
  const [courses, setCourses] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingFaq, setEditingFaq] = useState(null);
  const [selectedCourseForFaq, setSelectedCourseForFaq] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    title: { ...emptyLocalizedContent },
    description: { ...emptyLocalizedContent },
    duration: '',
    format: 'Hybrid',
    level: 'Beginner',
    certificate: true,
    category: 'development',
    price: '',
    image_url: '',
    is_popular: false,
    is_active: true,
    outcomes: [],
    curriculum: [],
    meta_title: { ...emptyLocalizedContent },
    meta_description: { ...emptyLocalizedContent }
  });
  const [faqFormData, setFaqFormData] = useState({
    question: { ...emptyLocalizedContent },
    answer: { ...emptyLocalizedContent }
  });

  const token = localStorage.getItem('novatech-token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API}/courses?active_only=false`, { headers });
      setCourses(res.data);
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchFaqs = async (courseId) => {
    try {
      const res = await axios.get(`${API}/faqs/${courseId}`, { headers });
      setFaqs(res.data);
    } catch (error) {
      toast.error('Failed to load FAQs');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await axios.put(`${API}/courses/${editingCourse.id}`, formData, { headers });
        toast.success('Course updated successfully');
      } else {
        await axios.post(`${API}/courses`, formData, { headers });
        toast.success('Course created successfully');
      }
      setShowModal(false);
      setEditingCourse(null);
      resetForm();
      fetchCourses();
    } catch (error) {
      toast.error('Failed to save course');
    }
  };

  const handleFaqSubmit = async (e) => {
    e.preventDefault();
    try {
      const faqData = {
        ...faqFormData,
        course_id: selectedCourseForFaq.id
      };

      if (editingFaq) {
        await axios.put(`${API}/faqs/${editingFaq.id}`, faqData, { headers });
        toast.success('FAQ updated successfully');
      } else {
        await axios.post(`${API}/faqs`, faqData, { headers });
        toast.success('FAQ created successfully');
      }
      setShowFaqModal(false);
      setEditingFaq(null);
      resetFaqForm();
      fetchFaqs(selectedCourseForFaq.id);
    } catch (error) {
      toast.error('Failed to save FAQ');
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || { ...emptyLocalizedContent },
      description: course.description || { ...emptyLocalizedContent },
      duration: course.duration || '',
      format: course.format || 'Hybrid',
      level: course.level || 'Beginner',
      certificate: course.certificate !== false,
      category: course.category || 'development',
      price: course.price || '',
      image_url: course.image_url || '',
      is_popular: course.is_popular || false,
      is_active: course.is_active !== false,
      outcomes: course.outcomes || [],
      curriculum: course.curriculum || [],
      meta_title: course.meta_title || { ...emptyLocalizedContent },
      meta_description: course.meta_description || { ...emptyLocalizedContent }
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await axios.delete(`${API}/courses/${id}`, { headers });
      toast.success('Course deleted');
      fetchCourses();
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await axios.delete(`${API}/faqs/${id}`, { headers });
      toast.success('FAQ deleted');
      fetchFaqs(selectedCourseForFaq.id);
    } catch (error) {
      toast.error('Failed to delete FAQ');
    }
  };

  const resetForm = () => {
    setFormData({
      title: { ...emptyLocalizedContent },
      description: { ...emptyLocalizedContent },
      duration: '',
      format: 'Hybrid',
      level: 'Beginner',
      certificate: true,
      category: 'development',
      price: '',
      image_url: '',
      is_popular: false,
      is_active: true,
      outcomes: [],
      curriculum: [],
      meta_title: { ...emptyLocalizedContent },
      meta_description: { ...emptyLocalizedContent }
    });
  };

  const resetFaqForm = () => {
    setFaqFormData({
      question: { ...emptyLocalizedContent },
      answer: { ...emptyLocalizedContent }
    });
  };

  // Outcomes Management
  const addOutcome = () => {
    setFormData({
      ...formData,
      outcomes: [...formData.outcomes, { ...emptyLocalizedContent }]
    });
  };

  const updateOutcome = (index, lang, value) => {
    const newOutcomes = [...formData.outcomes];
    newOutcomes[index] = { ...newOutcomes[index], [lang]: value };
    setFormData({ ...formData, outcomes: newOutcomes });
  };

  const removeOutcome = (index) => {
    setFormData({
      ...formData,
      outcomes: formData.outcomes.filter((_, i) => i !== index)
    });
  };

  const moveOutcomeUp = (index) => {
    if (index === 0) return;
    const newOutcomes = [...formData.outcomes];
    [newOutcomes[index - 1], newOutcomes[index]] = [newOutcomes[index], newOutcomes[index - 1]];
    setFormData({ ...formData, outcomes: newOutcomes });
  };

  const moveOutcomeDown = (index) => {
    if (index === formData.outcomes.length - 1) return;
    const newOutcomes = [...formData.outcomes];
    [newOutcomes[index], newOutcomes[index + 1]] = [newOutcomes[index + 1], newOutcomes[index]];
    setFormData({ ...formData, outcomes: newOutcomes });
  };

  // Curriculum Management
  const addCurriculumItem = () => {
    setFormData({
      ...formData,
      curriculum: [...formData.curriculum, { ...emptyLocalizedContent }]
    });
  };

  const updateCurriculumItem = (index, lang, value) => {
    const newCurriculum = [...formData.curriculum];
    newCurriculum[index] = { ...newCurriculum[index], [lang]: value };
    setFormData({ ...formData, curriculum: newCurriculum });
  };

  const removeCurriculumItem = (index) => {
    setFormData({
      ...formData,
      curriculum: formData.curriculum.filter((_, i) => i !== index)
    });
  };

  const moveCurriculumUp = (index) => {
    if (index === 0) return;
    const newCurriculum = [...formData.curriculum];
    [newCurriculum[index - 1], newCurriculum[index]] = [newCurriculum[index], newCurriculum[index - 1]];
    setFormData({ ...formData, curriculum: newCurriculum });
  };

  const moveCurriculumDown = (index) => {
    if (index === formData.curriculum.length - 1) return;
    const newCurriculum = [...formData.curriculum];
    [newCurriculum[index], newCurriculum[index + 1]] = [newCurriculum[index + 1], newCurriculum[index]];
    setFormData({ ...formData, curriculum: newCurriculum });
  };

  const openFaqManagement = (course) => {
    setSelectedCourseForFaq(course);
    fetchFaqs(course.id);
  };

  const filteredCourses = courses.filter(course =>
    getContent(course.title).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div data-testid="admin-courses" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Course Management</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage courses, outcomes, curriculum, and FAQs</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }} className="bg-[#5B5BF7] hover:bg-[#4A4AE0]">
          <Plus className="w-4 h-4 mr-2" />
          New Course
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Course List */}
      <div className="grid gap-4">
        {loading ? (
          <Card><CardContent className="py-8 text-center">Loading...</CardContent></Card>
        ) : filteredCourses.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-slate-500">No courses found</CardContent></Card>
        ) : (
          filteredCourses.map(course => (
            <Card key={course.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{getContent(course.title)}</h3>
                      {!course.is_active && (
                        <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">Inactive</span>
                      )}
                      {course.is_popular && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Popular</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{getContent(course.description)}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>Category: {course.category}</span>
                      <span>Duration: {course.duration}</span>
                      <span>Level: {course.level}</span>
                      <span>Outcomes: {course.outcomes?.length || 0}</span>
                      <span>Curriculum: {course.curriculum?.length || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openFaqManagement(course)}>
                      FAQs
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(course)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(course.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Course Edit/Create Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="outcomes">What You'll Learn</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4">
                <Tabs defaultValue="en">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="az">Azerbaijani</TabsTrigger>
                    <TabsTrigger value="ru">Russian</TabsTrigger>
                  </TabsList>
                  {['en', 'az', 'ru'].map(lang => (
                    <TabsContent key={lang} value={lang} className="space-y-4">
                      <div>
                        <Label>Title ({lang.toUpperCase()})</Label>
                        <Input
                          value={formData.title[lang]}
                          onChange={(e) => setFormData({
                            ...formData,
                            title: { ...formData.title, [lang]: e.target.value }
                          })}
                          required={lang === 'en'}
                        />
                      </div>
                      <div>
                        <Label>Description ({lang.toUpperCase()})</Label>
                        <Textarea
                          value={formData.description[lang]}
                          onChange={(e) => setFormData({
                            ...formData,
                            description: { ...formData.description, [lang]: e.target.value }
                          })}
                          rows={3}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Duration</Label>
                    <Input
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="e.g., 4 months"
                      required
                    />
                  </div>
                  <div>
                    <Label>Price</Label>
                    <Input
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g., 500 AZN"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Level</Label>
                    <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Format</Label>
                    <Select value={formData.format} onValueChange={(value) => setFormData({ ...formData, format: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formats.map(format => (
                          <SelectItem key={format} value={format}>{format}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <ImageUploader
                      label="Course Image"
                      value={formData.image_url}
                      onChange={(url) => setFormData({ ...formData, image_url: url })}
                      placeholder="https://images.unsplash.com/..."
                      testId="course-image"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Outcomes Tab */}
              <TabsContent value="outcomes" className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>What You'll Learn (Outcomes)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addOutcome}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Outcome
                  </Button>
                </div>
                {formData.outcomes.map((outcome, index) => (
                  <Card key={index} className="border-2">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Outcome {index + 1}</span>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => moveOutcomeUp(index)} disabled={index === 0}>
                            <MoveUp className="w-4 h-4" />
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => moveOutcomeDown(index)} disabled={index === formData.outcomes.length - 1}>
                            <MoveDown className="w-4 h-4" />
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => removeOutcome(index)} className="text-red-600">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Tabs defaultValue="en">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="en">EN</TabsTrigger>
                          <TabsTrigger value="az">AZ</TabsTrigger>
                          <TabsTrigger value="ru">RU</TabsTrigger>
                        </TabsList>
                        {['en', 'az', 'ru'].map(lang => (
                          <TabsContent key={lang} value={lang}>
                            <Input
                              value={outcome[lang] || ''}
                              onChange={(e) => updateOutcome(index, lang, e.target.value)}
                              placeholder={`Outcome in ${lang.toUpperCase()}`}
                            />
                          </TabsContent>
                        ))}
                      </Tabs>
                    </CardContent>
                  </Card>
                ))}
                {formData.outcomes.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-8">No outcomes added yet. Click "Add Outcome" to start.</p>
                )}
              </TabsContent>

              {/* Curriculum Tab */}
              <TabsContent value="curriculum" className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Curriculum Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCurriculumItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                {formData.curriculum.map((item, index) => (
                  <Card key={index} className="border-2">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Item {index + 1}</span>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => moveCurriculumUp(index)} disabled={index === 0}>
                            <MoveUp className="w-4 h-4" />
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => moveCurriculumDown(index)} disabled={index === formData.curriculum.length - 1}>
                            <MoveDown className="w-4 h-4" />
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => removeCurriculumItem(index)} className="text-red-600">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Tabs defaultValue="en">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="en">EN</TabsTrigger>
                          <TabsTrigger value="az">AZ</TabsTrigger>
                          <TabsTrigger value="ru">RU</TabsTrigger>
                        </TabsList>
                        {['en', 'az', 'ru'].map(lang => (
                          <TabsContent key={lang} value={lang}>
                            <Input
                              value={item[lang] || ''}
                              onChange={(e) => updateCurriculumItem(index, lang, e.target.value)}
                              placeholder={`Curriculum item in ${lang.toUpperCase()}`}
                            />
                          </TabsContent>
                        ))}
                      </Tabs>
                    </CardContent>
                  </Card>
                ))}
                {formData.curriculum.length === 0 && (
                  <p className="text-center text-sm text-slate-500 py-8">No curriculum items added yet. Click "Add Item" to start.</p>
                )}
              </TabsContent>

              {/* SEO Tab */}
              <TabsContent value="seo" className="space-y-4">
                <Tabs defaultValue="en">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="az">Azerbaijani</TabsTrigger>
                    <TabsTrigger value="ru">Russian</TabsTrigger>
                  </TabsList>
                  {['en', 'az', 'ru'].map(lang => (
                    <TabsContent key={lang} value={lang} className="space-y-4">
                      <div>
                        <Label>Meta Title ({lang.toUpperCase()})</Label>
                        <Input
                          value={formData.meta_title[lang]}
                          onChange={(e) => setFormData({
                            ...formData,
                            meta_title: { ...formData.meta_title, [lang]: e.target.value }
                          })}
                          placeholder={`SEO title for search engines (${lang.toUpperCase()})`}
                        />
                      </div>
                      <div>
                        <Label>Meta Description ({lang.toUpperCase()})</Label>
                        <Textarea
                          value={formData.meta_description[lang]}
                          onChange={(e) => setFormData({
                            ...formData,
                            meta_description: { ...formData.meta_description, [lang]: e.target.value }
                          })}
                          rows={3}
                          placeholder={`SEO description for search engines (${lang.toUpperCase()})`}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Certificate</Label>
                  <Switch
                    checked={formData.certificate}
                    onCheckedChange={(checked) => setFormData({ ...formData, certificate: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Popular Course</Label>
                  <Switch
                    checked={formData.is_popular}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#5B5BF7] hover:bg-[#4A4AE0]">
                {editingCourse ? 'Update' : 'Create'} Course
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* FAQ Management Modal */}
      <Dialog open={selectedCourseForFaq !== null} onOpenChange={(open) => !open && setSelectedCourseForFaq(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage FAQs - {selectedCourseForFaq && getContent(selectedCourseForFaq.title)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button onClick={() => { resetFaqForm(); setShowFaqModal(true); }} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add FAQ
            </Button>

            {faqs.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No FAQs yet. Add your first FAQ.</p>
            ) : (
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <Card key={faq.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{getContent(faq.question)}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{getContent(faq.answer)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setEditingFaq(faq); setFaqFormData({ question: faq.question, answer: faq.answer }); setShowFaqModal(true); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteFaq(faq.id)} className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* FAQ Create/Edit Modal */}
      <Dialog open={showFaqModal} onOpenChange={setShowFaqModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFaqSubmit} className="space-y-4">
            <div>
              <Label>Question</Label>
              <Tabs defaultValue="en">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="en">EN</TabsTrigger>
                  <TabsTrigger value="az">AZ</TabsTrigger>
                  <TabsTrigger value="ru">RU</TabsTrigger>
                </TabsList>
                {['en', 'az', 'ru'].map(lang => (
                  <TabsContent key={lang} value={lang}>
                    <Input
                      value={faqFormData.question[lang]}
                      onChange={(e) => setFaqFormData({
                        ...faqFormData,
                        question: { ...faqFormData.question, [lang]: e.target.value }
                      })}
                      placeholder={`Question in ${lang.toUpperCase()}`}
                      required={lang === 'en'}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <div>
              <Label>Answer</Label>
              <Tabs defaultValue="en">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="en">EN</TabsTrigger>
                  <TabsTrigger value="az">AZ</TabsTrigger>
                  <TabsTrigger value="ru">RU</TabsTrigger>
                </TabsList>
                {['en', 'az', 'ru'].map(lang => (
                  <TabsContent key={lang} value={lang}>
                    <Textarea
                      value={faqFormData.answer[lang]}
                      onChange={(e) => setFaqFormData({
                        ...faqFormData,
                        answer: { ...faqFormData.answer, [lang]: e.target.value }
                      })}
                      placeholder={`Answer in ${lang.toUpperCase()}`}
                      rows={4}
                      required={lang === 'en'}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setShowFaqModal(false); resetFaqForm(); setEditingFaq(null); }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#5B5BF7] hover:bg-[#4A4AE0]">
                {editingFaq ? 'Update' : 'Add'} FAQ
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
