import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Pencil, Trash2, Tag, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyLocalizedContent = { en: '', az: '', ru: '' };

const CATEGORIES = ['IT', 'Finance', 'Business', 'Marketing', 'HR', 'Design', 'Other'];

export function AdminInternships() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInternship, setEditingInternship] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: { ...emptyLocalizedContent },
    description: { ...emptyLocalizedContent },
    category: 'IT',
    duration: '',
    is_active: true,
    meta_title: { ...emptyLocalizedContent },
    meta_description: { ...emptyLocalizedContent }
  });

  const token = localStorage.getItem('novatech-token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchInternships();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInternships = async () => {
    try {
      const res = await axios.get(`${API}/internships?active_only=false`, { headers });
      setInternships(res.data);
    } catch (error) {
      toast.error('Failed to load internships');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (internship) => {
    setEditingInternship(internship);
    setFormData({
      title: internship.title || { ...emptyLocalizedContent },
      description: internship.description || { ...emptyLocalizedContent },
      category: internship.category || 'IT',
      duration: internship.duration || '',
      is_active: internship.is_active ?? true,
      meta_title: internship.meta_title || { ...emptyLocalizedContent },
      meta_description: internship.meta_description || { ...emptyLocalizedContent }
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingInternship(null);
    setFormData({
      title: { ...emptyLocalizedContent },
      description: { ...emptyLocalizedContent },
      category: 'IT',
      duration: '',
      is_active: true,
      meta_title: { ...emptyLocalizedContent },
      meta_description: { ...emptyLocalizedContent }
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.az && !formData.title.en) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      if (editingInternship) {
        await axios.put(`${API}/internships/${editingInternship.id}`, formData, { headers });
        toast.success('Internship updated');
      } else {
        await axios.post(`${API}/internships`, formData, { headers });
        toast.success('Internship created');
      }
      setShowModal(false);
      fetchInternships();
    } catch (error) {
      toast.error('Failed to save internship');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this internship?')) return;

    try {
      await axios.delete(`${API}/internships/${id}`, { headers });
      toast.success('Internship deleted');
      setInternships(internships.filter(i => i.id !== id));
    } catch (error) {
      toast.error('Failed to delete internship');
    }
  };

  const handleToggleActive = async (internship) => {
    try {
      await axios.put(`${API}/internships/${internship.id}`, { is_active: !internship.is_active }, { headers });
      setInternships(internships.map(i => i.id === internship.id ? { ...i, is_active: !i.is_active } : i));
      toast.success(internship.is_active ? 'Internship disabled' : 'Internship enabled');
    } catch (error) {
      toast.error('Failed to update internship');
    }
  };

  const updateLocalizedField = (field, lang, value) => {
    setFormData({
      ...formData,
      [field]: { ...formData[field], [lang]: value }
    });
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'it': return 'bg-blue-100 text-blue-700';
      case 'finance': return 'bg-green-100 text-green-700';
      case 'business': return 'bg-purple-100 text-purple-700';
      case 'marketing': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div data-testid="admin-internships" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Internships</h1>
          <p className="text-slate-600">Manage internship programs</p>
        </div>
        <Button onClick={handleCreate} className="bg-[#5B5BF7] hover:bg-[#4A4AE0]">
          <Plus className="w-4 h-4 mr-2" />
          Add Internship
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : internships.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Tag className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No internships yet</h3>
            <p className="text-slate-600 mb-4">Create your first internship program</p>
            <Button onClick={handleCreate} className="bg-[#5B5BF7] hover:bg-[#4A4AE0]">
              <Plus className="w-4 h-4 mr-2" />
              Add Internship
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {internships.map((internship) => (
            <Card key={internship.id} className={`${!internship.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(internship.category)}`}>
                    {internship.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${internship.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {internship.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {internship.title?.az || internship.title?.en}
                </h3>

                <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-4">
                  <Clock className="w-4 h-4" />
                  <span>{internship.duration}</span>
                </div>

                <div className="flex items-center justify-between">
                  <Switch
                    checked={internship.is_active}
                    onCheckedChange={() => handleToggleActive(internship)}
                  />
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(internship)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(internship.id)} className="text-red-600 hover:text-red-700">
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
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInternship ? 'Edit Internship' : 'Add Internship'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-3">
              <Label>Title</Label>
              <Input
                placeholder="Title (AZ)"
                value={formData.title.az}
                onChange={(e) => updateLocalizedField('title', 'az', e.target.value)}
              />
              <Input
                placeholder="Title (EN)"
                value={formData.title.en}
                onChange={(e) => updateLocalizedField('title', 'en', e.target.value)}
              />
              <Input
                placeholder="Title (RU)"
                value={formData.title.ru}
                onChange={(e) => updateLocalizedField('title', 'ru', e.target.value)}
              />
            </div>

            {/* Category & Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 focus:border-[#5B5BF7] focus:outline-none"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Duration</Label>
                <Input
                  placeholder="e.g. 3 months"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label>Description</Label>
              <Textarea
                placeholder="Description (AZ)"
                rows={3}
                value={formData.description.az}
                onChange={(e) => updateLocalizedField('description', 'az', e.target.value)}
              />
              <Textarea
                placeholder="Description (EN)"
                rows={3}
                value={formData.description.en}
                onChange={(e) => updateLocalizedField('description', 'en', e.target.value)}
              />
            </div>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SEO Settings</CardTitle>
                <p className="text-sm text-slate-600">Custom meta title and description for search engines</p>
              </CardHeader>
              <CardContent className="space-y-4">
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
                          rows={2}
                          placeholder={`SEO description for search engines (${lang.toUpperCase()})`}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Active Toggle */}
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
              <Label>Active (visible to public)</Label>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#5B5BF7] hover:bg-[#4A4AE0]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingInternship ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
