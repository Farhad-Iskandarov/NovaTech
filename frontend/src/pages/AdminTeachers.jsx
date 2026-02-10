import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { ImageUploader } from '../components/ImageUploader';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyLocalizedContent = { en: '', az: '', ru: '' };

export function AdminTeachers() {
  const { getContent } = useLanguage();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: { ...emptyLocalizedContent },
    bio: { ...emptyLocalizedContent },
    image_url: '',
    order: 0,
    is_active: true
  });

  const token = localStorage.getItem('novatech-token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API}/teachers?active_only=false`, { headers });
      setTeachers(res.data);
    } catch (error) {
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${API}/teachers/${editing.id}`, formData, { headers });
        toast.success('Teacher updated');
      } else {
        await axios.post(`${API}/teachers`, formData, { headers });
        toast.success('Teacher added');
      }
      setShowModal(false);
      setEditing(null);
      resetForm();
      fetchTeachers();
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setFormData({
      name: item.name || '',
      role: item.role || { ...emptyLocalizedContent },
      bio: item.bio || { ...emptyLocalizedContent },
      image_url: item.image_url || '',
      order: item.order || 0,
      is_active: item.is_active ?? true
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this teacher?')) return;
    try {
      await axios.delete(`${API}/teachers/${id}`, { headers });
      toast.success('Teacher deleted');
      fetchTeachers();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: { ...emptyLocalizedContent },
      bio: { ...emptyLocalizedContent },
      image_url: '',
      order: 0,
      is_active: true
    });
  };

  return (
    <div data-testid="admin-teachers" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teachers</h1>
          <p className="text-slate-600">Manage your teaching staff</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setEditing(null); setShowModal(true); }}
          className="bg-[#5B5BF7] hover:bg-[#4A4AE0] text-white rounded-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Teacher
        </Button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 text-center">
                <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-4" />
                <div className="h-5 bg-slate-200 rounded w-24 mx-auto mb-2" />
                <div className="h-4 bg-slate-200 rounded w-32 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {teachers.map(teacher => (
            <Card key={teacher.id} className="border border-slate-100 hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center">
                <img 
                  src={teacher.image_url || `https://ui-avatars.com/api/?name=${teacher.name}&background=5B5BF7&color=fff&size=200`}
                  alt={teacher.name}
                  className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
                />
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900">{teacher.name}</h3>
                  {!teacher.is_active && (
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full">Inactive</span>
                  )}
                </div>
                <p className="text-sm text-[#5B5BF7] mb-2">{getContent(teacher.role)}</p>
                {teacher.bio && (
                  <p className="text-sm text-slate-500 line-clamp-2">{getContent(teacher.bio)}</p>
                )}
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(teacher)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDelete(teacher.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Teacher' : 'Add Teacher'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Role *</Label>
              <Input 
                placeholder="English"
                value={formData.role.en}
                onChange={(e) => setFormData({ ...formData, role: { ...formData.role, en: e.target.value } })}
                required
              />
              <Input 
                placeholder="Azərbaycan"
                value={formData.role.az}
                onChange={(e) => setFormData({ ...formData, role: { ...formData.role, az: e.target.value } })}
              />
              <Input 
                placeholder="Русский"
                value={formData.role.ru}
                onChange={(e) => setFormData({ ...formData, role: { ...formData.role, ru: e.target.value } })}
              />
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea 
                placeholder="English"
                value={formData.bio.en}
                onChange={(e) => setFormData({ ...formData, bio: { ...formData.bio, en: e.target.value } })}
              />
              <Textarea 
                placeholder="Azərbaycan"
                value={formData.bio.az}
                onChange={(e) => setFormData({ ...formData, bio: { ...formData.bio, az: e.target.value } })}
              />
              <Textarea 
                placeholder="Русский"
                value={formData.bio.ru}
                onChange={(e) => setFormData({ ...formData, bio: { ...formData.bio, ru: e.target.value } })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <ImageUploader
                  label="Teacher Photo"
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  placeholder="https://..."
                  testId="teacher-image"
                />
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input 
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
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
