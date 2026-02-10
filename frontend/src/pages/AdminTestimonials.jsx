import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { ImageUploader } from '../components/ImageUploader';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyLocalizedContent = { en: '', az: '', ru: '' };

export function AdminTestimonials() {
  const { getContent } = useLanguage();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    course: '',
    content: { ...emptyLocalizedContent },
    rating: 5,
    image_url: '',
    is_active: true
  });

  const token = localStorage.getItem('novatech-token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const res = await axios.get(`${API}/testimonials?active_only=false`, { headers });
      setTestimonials(res.data);
    } catch (error) {
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API}/testimonials/${editing.id}`, formData, { headers });
        toast.success('Testimonial updated');
      } else {
        await axios.post(`${API}/testimonials`, formData, { headers });
        toast.success('Testimonial created');
      }
      setShowModal(false);
      setEditing(null);
      resetForm();
      fetchTestimonials();
    } catch (error) {
      toast.error('Failed to save testimonial');
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setFormData({
      name: item.name || '',
      course: item.course || '',
      content: item.content || { ...emptyLocalizedContent },
      rating: item.rating || 5,
      image_url: item.image_url || '',
      is_active: item.is_active ?? true
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await axios.delete(`${API}/testimonials/${id}`, { headers });
      toast.success('Testimonial deleted');
      fetchTestimonials();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      course: '',
      content: { ...emptyLocalizedContent },
      rating: 5,
      image_url: '',
      is_active: true
    });
  };

  return (
    <div data-testid="admin-testimonials" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Testimonials</h1>
          <p className="text-slate-600">Manage student reviews</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setEditing(null); setShowModal(true); }}
          className="bg-[#5B5BF7] hover:bg-[#4A4AE0] text-white rounded-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Testimonial
        </Button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {testimonials.map(item => (
            <Card key={item.id} className="border border-slate-100 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    <img 
                      src={item.image_url || `https://ui-avatars.com/api/?name=${item.name}&background=5B5BF7&color=fff`}
                      alt={item.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{item.name}</h3>
                        {!item.is_active && (
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full">Inactive</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mb-2">{item.course}</p>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(item.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">"{getContent(item.content)}"</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Course *</Label>
                <Input 
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Review (English) *</Label>
              <Textarea 
                value={formData.content.en}
                onChange={(e) => setFormData({ ...formData, content: { ...formData.content, en: e.target.value } })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Review (Azərbaycan)</Label>
              <Textarea 
                value={formData.content.az}
                onChange={(e) => setFormData({ ...formData, content: { ...formData.content, az: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <Label>Review (Русский)</Label>
              <Textarea 
                value={formData.content.ru}
                onChange={(e) => setFormData({ ...formData, content: { ...formData.content, ru: e.target.value } })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rating (1-5)</Label>
                <Input 
                  type="number"
                  min="1"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <ImageUploader
                  label="Student Photo"
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  placeholder="https://..."
                  testId="testimonial-image"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch 
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
              <Label>Active</Label>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#5B5BF7] hover:bg-[#4A4AE0]">
                {editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
