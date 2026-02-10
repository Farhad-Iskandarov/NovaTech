import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Mail, Phone, MessageSquare, Calendar, Eye, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const token = localStorage.getItem('novatech-token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await axios.get(`${API}/submissions`, { headers });
      setSubmissions(res.data);
    } catch (error) {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await axios.put(`${API}/submissions/${id}/read`, {}, { headers });
      setSubmissions(submissions.map(s => 
        s.id === id ? { ...s, is_read: true } : s
      ));
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this submission?')) return;
    try {
      await axios.delete(`${API}/submissions/${id}`, { headers });
      setSubmissions(submissions.filter(s => s.id !== id));
      setSelectedSubmission(null);
      toast.success('Submission deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[date.getMonth()];
    
    return `${day} ${monthName} ${year}, ${hours}:${minutes}`;
  };

  const filteredSubmissions = activeTab === 'all' 
    ? submissions 
    : submissions.filter(s => s.type === activeTab);

  const unreadCount = submissions.filter(s => !s.is_read).length;
  const contactCount = submissions.filter(s => s.type === 'contact').length;
  const applicationCount = submissions.filter(s => s.type === 'application').length;

  return (
    <div data-testid="admin-submissions" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Submissions</h1>
        <p className="text-slate-600">View contact form and course application submissions</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="all" className="data-[state=active]:bg-white">
            All ({submissions.length})
          </TabsTrigger>
          <TabsTrigger value="contact" className="data-[state=active]:bg-white">
            Contact ({contactCount})
          </TabsTrigger>
          <TabsTrigger value="application" className="data-[state=active]:bg-white">
            Applications ({applicationCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-5 bg-slate-200 rounded w-1/4 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No submissions yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map(submission => (
            <Card 
              key={submission.id} 
              className={`border cursor-pointer hover:shadow-md transition-shadow ${
                !submission.is_read ? 'border-[#5B5BF7] bg-[#5B5BF7]/5' : 'border-slate-100'
              }`}
              onClick={() => {
                setSelectedSubmission(submission);
                if (!submission.is_read) handleMarkRead(submission.id);
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      submission.type === 'application' ? 'bg-[#00C9A7]/10' : 'bg-[#5B5BF7]/10'
                    }`}>
                      {submission.type === 'application' ? (
                        <BookOpen className="w-5 h-5 text-[#00C9A7]" />
                      ) : (
                        <Mail className="w-5 h-5 text-[#5B5BF7]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{submission.data.name}</h3>
                        {!submission.is_read && (
                          <Badge className="bg-[#5B5BF7]">New</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {submission.type === 'application' ? 'Application' : 'Contact'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">{submission.data.email}</p>
                      {submission.type === 'application' && submission.data.course_name && (
                        <p className="text-sm text-[#00C9A7] font-medium mt-1">
                          Course: {submission.data.course_name}
                        </p>
                      )}
                      {submission.data.message && (
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2">{submission.data.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(submission.created_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedSubmission?.type === 'application' ? (
                <>
                  <BookOpen className="w-5 h-5 text-[#00C9A7]" />
                  Course Application
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 text-[#5B5BF7]" />
                  Contact Message
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission && formatDate(selectedSubmission.created_at)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Name</p>
                  <p className="font-medium">{selectedSubmission.data.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <a href={`mailto:${selectedSubmission.data.email}`} className="font-medium text-[#5B5BF7] hover:underline">
                    {selectedSubmission.data.email}
                  </a>
                </div>
                {selectedSubmission.data.phone && (
                  <div>
                    <p className="text-sm text-slate-500">Phone</p>
                    <a href={`tel:${selectedSubmission.data.phone}`} className="font-medium text-[#5B5BF7] hover:underline">
                      {selectedSubmission.data.phone}
                    </a>
                  </div>
                )}
                {selectedSubmission.data.course_name && (
                  <div>
                    <p className="text-sm text-slate-500">Course</p>
                    <p className="font-medium text-[#00C9A7]">{selectedSubmission.data.course_name}</p>
                  </div>
                )}
              </div>
              
              {selectedSubmission.data.message && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Message</p>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-700 whitespace-pre-wrap">{selectedSubmission.data.message}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline"
                  onClick={() => handleDelete(selectedSubmission.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <a href={`mailto:${selectedSubmission.data.email}`}>
                  <Button className="bg-[#5B5BF7] hover:bg-[#4A4AE0]">
                    <Mail className="w-4 h-4 mr-2" />
                    Reply
                  </Button>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
