import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { Plus, Pencil, Trash2, GripVertical, Image, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { ImageUploader } from '../components/ImageUploader';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyLocalizedContent = { en: '', az: '', ru: '' };

export function AdminSlides() {
  const { getContent } = useLanguage();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [formData, setFormData] = useState({
    title: { ...emptyLocalizedContent },
    subtitle: { ...emptyLocalizedContent },
    badge: { ...emptyLocalizedContent },
    background_image: '',
    cta_text: { ...emptyLocalizedContent },
    cta_link: '',
    order: 1,
    is_active: true
  });

  const token = localStorage.getItem('novatech-token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchSlides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSlides = async () => {
    try {
      const res = await axios.get(`${API}/slides?active_only=false`, { headers });
      setSlides(res.data.sort((a, b) => a.order - b.order));
    } catch (error) {
      toast.error('Failed to load slides');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSlide) {
        await axios.put(`${API}/slides/${editingSlide.id}`, formData, { headers });
        toast.success('Slide updated successfully');
      } else {
        await axios.post(`${API}/slides`, formData, { headers });
        toast.success('Slide created successfully');
      }
      setShowModal(false);
      setEditingSlide(null);
      resetForm();
      fetchSlides();
    } catch (error) {
      toast.error('Failed to save slide');
    }
  };

  const handleEdit = (slide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title || { ...emptyLocalizedContent },
      subtitle: slide.subtitle || { ...emptyLocalizedContent },
      badge: slide.badge || { ...emptyLocalizedContent },
      background_image: slide.background_image || '',
      cta_text: slide.cta_text || { ...emptyLocalizedContent },
      cta_link: slide.cta_link || '',
      order: slide.order || 1,
      is_active: slide.is_active ?? true
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this slide?')) return;
    try {
      await axios.delete(`${API}/slides/${id}`, { headers });
      toast.success('Slide deleted successfully');
      fetchSlides();
    } catch (error) {
      toast.error('Failed to delete slide');
    }
  };

  const handleReorder = async (slideId, direction) => {
    const currentIndex = slides.findIndex(s => s.id === slideId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;

    const updatedSlides = [...slides];
    const temp = updatedSlides[currentIndex];
    updatedSlides[currentIndex] = updatedSlides[newIndex];
    updatedSlides[newIndex] = temp;

    // Update order values
    try {
      await Promise.all([
        axios.put(`${API}/slides/${updatedSlides[currentIndex].id}`, { order: currentIndex + 1 }, { headers }),
        axios.put(`${API}/slides/${updatedSlides[newIndex].id}`, { order: newIndex + 1 }, { headers })
      ]);
      fetchSlides();
      toast.success('Slide order updated');
    } catch (error) {
      toast.error('Failed to reorder slides');
    }
  };

  const toggleActive = async (slide) => {
    try {
      await axios.put(`${API}/slides/${slide.id}`, { is_active: !slide.is_active }, { headers });
      toast.success(`Slide ${!slide.is_active ? 'activated' : 'deactivated'}`);
      fetchSlides();
    } catch (error) {
      toast.error('Failed to update slide');
    }
  };

  const resetForm = () => {
    setFormData({
      title: { ...emptyLocalizedContent },
      subtitle: { ...emptyLocalizedContent },
      badge: { ...emptyLocalizedContent },
      background_image: '',
      cta_text: { ...emptyLocalizedContent },
      cta_link: '',
      order: slides.length + 1,
      is_active: true
    });
  };

  const updateLocalizedField = (field, lang, value) => {
    setFormData({
      ...formData,
      [field]: { ...formData[field], [lang]: value }
    });
  };

  return (
    <div data-testid="admin-slides" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hero Slides</h1>
          <p className="text-slate-600">Manage homepage carousel slides</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setShowModal(true); }}
          data-testid="add-slide-btn"
          className="bg-[#5B5BF7] hover:bg-[#4A4AE0]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Slide
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-32 h-20 bg-slate-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-slate-200 rounded w-1/2" />
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : slides.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Image className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No slides yet</h3>
            <p className="text-slate-600 mb-4">Add your first hero carousel slide</p>
            <Button onClick={() => { resetForm(); setShowModal(true); }} className="bg-[#5B5BF7] hover:bg-[#4A4AE0]">
              <Plus className="w-4 h-4 mr-2" />
              Add Slide
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {slides.map((slide, index) => (
            <Card key={slide.id} className={`transition-opacity ${!slide.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleReorder(slide.id, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      data-testid={`slide-up-${slide.id}`}
                    >
                      <ChevronUp className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => handleReorder(slide.id, 'down')}
                      disabled={index === slides.length - 1}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      data-testid={`slide-down-${slide.id}`}
                    >
                      <ChevronDown className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div className="w-32 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    {slide.background_image ? (
                      <img 
                        src={slide.background_image} 
                        alt={getContent(slide.title)} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {getContent(slide.title) || 'Untitled Slide'}
                      </h3>
                      <span className="text-xs text-slate-500">#{slide.order}</span>
                    </div>
                    <p className="text-sm text-slate-600 truncate">
                      {getContent(slide.subtitle) || 'No subtitle'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${slide.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {slide.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {slide.cta_link && (
                        <span className="text-xs text-slate-500">
                          CTA: {slide.cta_link === 'whatsapp' ? 'WhatsApp' : slide.cta_link}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={slide.is_active}
                      onCheckedChange={() => toggleActive(slide)}
                      data-testid={`slide-toggle-${slide.id}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(slide)}
                      data-testid={`edit-slide-${slide.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(slide.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      data-testid={`delete-slide-${slide.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) { setEditingSlide(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSlide ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title - Multi-language */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Title *</Label>
              <div className="grid gap-3">
                {['en', 'az', 'ru'].map(lang => (
                  <div key={lang} className="flex items-center gap-2">
                    <span className="w-8 text-xs font-medium text-slate-500 uppercase">{lang}</span>
                    <Input
                      value={formData.title[lang]}
                      onChange={(e) => updateLocalizedField('title', lang, e.target.value)}
                      placeholder={`Title in ${lang === 'en' ? 'English' : lang === 'az' ? 'Azerbaijani' : 'Russian'}`}
                      data-testid={`slide-title-${lang}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Subtitle - Multi-language */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Subtitle</Label>
              <div className="grid gap-3">
                {['en', 'az', 'ru'].map(lang => (
                  <div key={lang} className="flex items-center gap-2">
                    <span className="w-8 text-xs font-medium text-slate-500 uppercase">{lang}</span>
                    <Input
                      value={formData.subtitle[lang]}
                      onChange={(e) => updateLocalizedField('subtitle', lang, e.target.value)}
                      placeholder={`Subtitle in ${lang === 'en' ? 'English' : lang === 'az' ? 'Azerbaijani' : 'Russian'}`}
                      data-testid={`slide-subtitle-${lang}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Badge - Multi-language */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Badge Text</Label>
              <div className="grid gap-3">
                {['en', 'az', 'ru'].map(lang => (
                  <div key={lang} className="flex items-center gap-2">
                    <span className="w-8 text-xs font-medium text-slate-500 uppercase">{lang}</span>
                    <Input
                      value={formData.badge[lang]}
                      onChange={(e) => updateLocalizedField('badge', lang, e.target.value)}
                      placeholder={`Badge in ${lang === 'en' ? 'English' : lang === 'az' ? 'Azerbaijani' : 'Russian'}`}
                      data-testid={`slide-badge-${lang}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Background Image */}
            <div className="space-y-2">
              <ImageUploader
                label="Background Image"
                value={formData.background_image}
                onChange={(url) => setFormData({ ...formData, background_image: url })}
                placeholder="https://images.unsplash.com/..."
                required={true}
                testId="slide-image"
              />
            </div>

            {/* CTA Text - Multi-language */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Button Text</Label>
              <div className="grid gap-3">
                {['en', 'az', 'ru'].map(lang => (
                  <div key={lang} className="flex items-center gap-2">
                    <span className="w-8 text-xs font-medium text-slate-500 uppercase">{lang}</span>
                    <Input
                      value={formData.cta_text[lang]}
                      onChange={(e) => updateLocalizedField('cta_text', lang, e.target.value)}
                      placeholder={`Button text in ${lang === 'en' ? 'English' : lang === 'az' ? 'Azerbaijani' : 'Russian'}`}
                      data-testid={`slide-cta-text-${lang}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Link */}
            <div className="space-y-2">
              <Label>Button Link</Label>
              <Input
                value={formData.cta_link}
                onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                placeholder="whatsapp, /courses, or https://..."
                data-testid="slide-cta-link"
              />
              <p className="text-xs text-slate-500">Use &quot;whatsapp&quot; for WhatsApp link, or enter a URL path like &quot;/courses&quot;</p>
            </div>

            {/* Order */}
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                data-testid="slide-order"
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <Label>Active</Label>
                <p className="text-sm text-slate-500">Show this slide on the website</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                data-testid="slide-active-toggle"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#5B5BF7] hover:bg-[#4A4AE0]" data-testid="save-slide-btn">
                {editingSlide ? 'Update Slide' : 'Create Slide'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
