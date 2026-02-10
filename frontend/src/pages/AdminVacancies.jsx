import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Pencil, Trash2, Briefcase, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyLocalizedContent = { en: '', az: '', ru: '' };

const JOB_TYPES = ['Full-time', 'Part-time', 'Remote', 'Hybrid'];

export function AdminVacancies() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: { ...emptyLocalizedContent },
    department: { ...emptyLocalizedContent },
    description: { ...emptyLocalizedContent },
    location: '',
    job_type: 'Full-time',
    is_active: true,
    meta_title: { ...emptyLocalizedContent },
    meta_description: { ...emptyLocalizedContent }
  });

  const token = localStorage.getItem('novatech-token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchVacancies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVacancies = async () => {
    try {
      const res = await axios.get(`${API}/vacancies?active_only=false`, { headers });
      setVacancies(res.data);
    } catch (error) {
      toast.error('Failed to load vacancies');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vacancy) => {
    setEditingVacancy(vacancy);
    setFormData({
      title: vacancy.title || { ...emptyLocalizedContent },
      department: vacancy.department || { ...emptyLocalizedContent },
      description: vacancy.description || { ...emptyLocalizedContent },
      location: vacancy.location || '',
      job_type: vacancy.job_type || 'Full-time',
      is_active: vacancy.is_active ?? true,
      meta_title: vacancy.meta_title || { ...emptyLocalizedContent },
      meta_description: vacancy.meta_description || { ...emptyLocalizedContent }
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingVacancy(null);
    setFormData({
      title: { ...emptyLocalizedContent },
      department: { ...emptyLocalizedContent },
      description: { ...emptyLocalizedContent },
      location: '',
      job_type: 'Full-time',
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
      if (editingVacancy) {
        await axios.put(`${API}/vacancies/${editingVacancy.id}`, formData, { headers });
        toast.success('Vacancy updated');
      } else {
        await axios.post(`${API}/vacancies`, formData, { headers });
        toast.success('Vacancy created');
      }
      setShowModal(false);
      fetchVacancies();
    } catch (error) {
      toast.error('Failed to save vacancy');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vacancy?')) return;

    try {
      await axios.delete(`${API}/vacancies/${id}`, { headers });
      toast.success('Vacancy deleted');
      setVacancies(vacancies.filter(v => v.id !== id));
    } catch (error) {
      toast.error('Failed to delete vacancy');
    }
  };

  const handleToggleActive = async (vacancy) => {
    try {
      await axios.put(`${API}/vacancies/${vacancy.id}`, { is_active: !vacancy.is_active }, { headers });
      setVacancies(vacancies.map(v => v.id === vacancy.id ? { ...v, is_active: !v.is_active } : v));
      toast.success(vacancy.is_active ? 'Vacancy disabled' : 'Vacancy enabled');
    } catch (error) {
      toast.error('Failed to update vacancy');
    }
  };

  const updateLocalizedField = (field, lang, value) => {
    setFormData({
      ...formData,
      [field]: { ...formData[field], [lang]: value }
    });
  };

  return (
    <div data-testid="admin-vacancies" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vacancies</h1>
          <p className="text-slate-600">Manage job openings</p>
        </div>
        <Button onClick={handleCreate} className="bg-[#5B5BF7] hover:bg-[#4A4AE0]">
          <Plus className="w-4 h-4 mr-2" />
          Add Vacancy
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
      ) : vacancies.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No vacancies yet</h3>
            <p className="text-slate-600 mb-4">Create your first job opening</p>
            <Button onClick={handleCreate} className="bg-[#5B5BF7] hover:bg-[#4A4AE0]">
              <Plus className="w-4 h-4 mr-2" />
              Add Vacancy
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {vacancies.map((vacancy) => (
            <Card key={vacancy.id} className={`${!vacancy.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {vacancy.title?.az || vacancy.title?.en}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${vacancy.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {vacancy.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {vacancy.department?.az || vacancy.department?.en}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {vacancy.location}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {vacancy.job_type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={vacancy.is_active}
                      onCheckedChange={() => handleToggleActive(vacancy)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(vacancy)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(vacancy.id)} className="text-red-600 hover:text-red-700">
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
            <DialogTitle>{editingVacancy ? 'Edit Vacancy' : 'Add Vacancy'}</DialogTitle>
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

            {/* Department */}
            <div className="space-y-3">
              <Label>Department</Label>
              <Input
                placeholder="Department (AZ)"
                value={formData.department.az}
                onChange={(e) => updateLocalizedField('department', 'az', e.target.value)}
              />
              <Input
                placeholder="Department (EN)"
                value={formData.department.en}
                onChange={(e) => updateLocalizedField('department', 'en', e.target.value)}
              />
            </div>

            {/* Location & Job Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Location</Label>
                <Input
                  placeholder="e.g. Sumgayit, Azerbaijan"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <Label>Job Type</Label>
                <select
                  value={formData.job_type}
                  onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 focus:border-[#5B5BF7] focus:outline-none"
                >
                  {JOB_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
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
                {editingVacancy ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
