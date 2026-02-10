import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Trash2, Calendar, User, Phone, BookOpen, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function AdminTrialLessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);

  const token = localStorage.getItem('novatech-token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLessons = async () => {
    try {
      const res = await axios.get(`${API}/trial-lessons`, { headers });
      setLessons(res.data);
    } catch (error) {
      toast.error('Failed to load trial lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu müraciəti silmək istədiyinizə əminsiniz?')) return;
    
    setDeleting(id);
    try {
      await axios.delete(`${API}/trial-lessons/${id}`, { headers });
      toast.success('Müraciət silindi');
      setLessons(lessons.filter(l => l.id !== id));
    } catch (error) {
      toast.error('Silinmə zamanı xəta baş verdi');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('BÜTÜN müraciətləri silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz!')) return;
    
    setDeletingAll(true);
    try {
      await axios.delete(`${API}/trial-lessons`, { headers });
      toast.success('Bütün müraciətlər silindi');
      setLessons([]);
    } catch (error) {
      toast.error('Silinmə zamanı xəta baş verdi');
    } finally {
      setDeletingAll(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
    const monthName = months[date.getMonth()];
    
    return `${day} ${monthName} ${year}, ${hours}:${minutes}`;
  };

  return (
    <div data-testid="admin-trial-lessons" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sınaq Dərsi Müraciətləri</h1>
          <p className="text-slate-600">Pulsuz sınaq dərsinə yazılan müraciətlər</p>
        </div>
        {lessons.length > 0 && (
          <Button 
            onClick={handleDeleteAll}
            disabled={deletingAll}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
            data-testid="delete-all-btn"
          >
            {deletingAll ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Silinir...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Hamısını Sil ({lessons.length})
              </>
            )}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Hələ müraciət yoxdur</h3>
            <p className="text-slate-600">Sınaq dərsinə yazılmış müraciətlər burada görünəcək</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-[#5B5BF7]/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-[#5B5BF7]" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-lg">
                        {lesson.full_name}
                      </h3>
                      
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm">{lesson.contact}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <BookOpen className="w-4 h-4" />
                          <span className="text-sm font-medium text-[#5B5BF7]">{lesson.course}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs">{formatDate(lesson.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(lesson.id)}
                    disabled={deleting === lesson.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                    data-testid={`delete-lesson-${lesson.id}`}
                  >
                    {deleting === lesson.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
