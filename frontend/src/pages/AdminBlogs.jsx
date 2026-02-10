import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, Image as ImageIcon, Type, MoveUp, MoveDown, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { ImageUploader } from '../components/ImageUploader';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyLocalizedContent = { en: '', az: '', ru: '' };

export function AdminBlogs() {
  const { getContent } = useLanguage();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    title: { ...emptyLocalizedContent },
    excerpt: { ...emptyLocalizedContent },
    slug: '',
    content_blocks: [],
    is_published: false,
    show_on_homepage: false,
    meta_title: { ...emptyLocalizedContent },
    meta_description: { ...emptyLocalizedContent }
  });

  const token = localStorage.getItem('novatech-token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await axios.get(`${API}/blogs?published_only=false`, { headers });
      setBlogs(res.data);
    } catch (error) {
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure content_blocks have proper order
      const orderedBlocks = formData.content_blocks.map((block, index) => ({
        ...block,
        order: index
      }));

      const dataToSubmit = {
        ...formData,
        content_blocks: orderedBlocks
      };

      if (editingBlog) {
        await axios.put(`${API}/blogs/${editingBlog.id}`, dataToSubmit, { headers });
        toast.success('Blog post updated successfully');
      } else {
        await axios.post(`${API}/blogs`, dataToSubmit, { headers });
        toast.success('Blog post created successfully');
      }
      setShowModal(false);
      setEditingBlog(null);
      resetForm();
      fetchBlogs();
    } catch (error) {
      toast.error('Failed to save blog post');
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || { ...emptyLocalizedContent },
      excerpt: blog.excerpt || { ...emptyLocalizedContent },
      slug: blog.slug || '',
      content_blocks: blog.content_blocks || [],
      is_published: blog.is_published || false,
      show_on_homepage: blog.show_on_homepage || false,
      meta_title: blog.meta_title || { ...emptyLocalizedContent },
      meta_description: blog.meta_description || { ...emptyLocalizedContent }
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await axios.delete(`${API}/blogs/${id}`, { headers });
      toast.success('Blog post deleted');
      fetchBlogs();
    } catch (error) {
      toast.error('Failed to delete blog post');
    }
  };

  const resetForm = () => {
    setFormData({
      title: { ...emptyLocalizedContent },
      excerpt: { ...emptyLocalizedContent },
      slug: '',
      content_blocks: [],
      is_published: false,
      show_on_homepage: false,
      meta_title: { ...emptyLocalizedContent },
      meta_description: { ...emptyLocalizedContent }
    });
  };

  // Content Block Management
  const addImageBlock = () => {
    setFormData({
      ...formData,
      content_blocks: [
        ...formData.content_blocks,
        { type: 'image', image_url: '', order: formData.content_blocks.length }
      ]
    });
  };

  const addTextBlock = () => {
    setFormData({
      ...formData,
      content_blocks: [
        ...formData.content_blocks,
        { type: 'text', text: { ...emptyLocalizedContent }, order: formData.content_blocks.length }
      ]
    });
  };

  const updateBlock = (index, updates) => {
    const newBlocks = [...formData.content_blocks];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    setFormData({ ...formData, content_blocks: newBlocks });
  };

  const removeBlock = (index) => {
    const newBlocks = formData.content_blocks.filter((_, i) => i !== index);
    setFormData({ ...formData, content_blocks: newBlocks });
  };

  const moveBlockUp = (index) => {
    if (index === 0) return;
    const newBlocks = [...formData.content_blocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    setFormData({ ...formData, content_blocks: newBlocks });
  };

  const moveBlockDown = (index) => {
    if (index === formData.content_blocks.length - 1) return;
    const newBlocks = [...formData.content_blocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    setFormData({ ...formData, content_blocks: newBlocks });
  };

  const filteredBlogs = blogs.filter(blog =>
    getContent(blog.title).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div data-testid="admin-blogs" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blog Management</h1>
          <p className="text-slate-600">Manage blog posts with multiple images and text blocks</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }} className="bg-[#5B5BF7] hover:bg-[#4A4AE0]">
          <Plus className="w-4 h-4 mr-2" />
          New Blog Post
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search blog posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Blog List */}
      <div className="grid gap-4">
        {loading ? (
          <Card><CardContent className="py-8 text-center">Loading...</CardContent></Card>
        ) : filteredBlogs.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-slate-500">No blog posts found</CardContent></Card>
        ) : (
          filteredBlogs.map(blog => (
            <Card key={blog.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{getContent(blog.title)}</h3>
                      {blog.is_published ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Published</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">Draft</span>
                      )}
                      {blog.show_on_homepage && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Homepage</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{getContent(blog.excerpt)}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Slug: /{blog.slug}</span>
                      <span>{blog.content_blocks?.length || 0} content blocks</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(blog)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(blog.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
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
                        <Label>Excerpt ({lang.toUpperCase()})</Label>
                        <Textarea
                          value={formData.excerpt[lang]}
                          onChange={(e) => setFormData({
                            ...formData,
                            excerpt: { ...formData.excerpt, [lang]: e.target.value }
                          })}
                          rows={2}
                        />
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <div>
                  <Label>Slug (URL)</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="blog-post-url"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Publish</Label>
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Show on Homepage</Label>
                  <Switch
                    checked={formData.show_on_homepage}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_on_homepage: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Blocks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Content Blocks</CardTitle>
                <p className="text-sm text-slate-600">Add images and text blocks in any order</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.content_blocks.map((block, index) => (
                  <Card key={index} className="border-2">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {block.type === 'image' ? '📷 Image Block' : '📝 Text Block'}
                        </span>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => moveBlockUp(index)} disabled={index === 0}>
                            <MoveUp className="w-4 h-4" />
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => moveBlockDown(index)} disabled={index === formData.content_blocks.length - 1}>
                            <MoveDown className="w-4 h-4" />
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => removeBlock(index)} className="text-red-600">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {block.type === 'image' ? (
                        <div>
                          <ImageUploader
                            label="Block Image"
                            value={block.image_url || ''}
                            onChange={(url) => updateBlock(index, { image_url: url })}
                            placeholder="https://images.unsplash.com/..."
                            testId={`blog-block-image-${index}`}
                          />
                        </div>
                      ) : (
                        <Tabs defaultValue="en">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="en">EN</TabsTrigger>
                            <TabsTrigger value="az">AZ</TabsTrigger>
                            <TabsTrigger value="ru">RU</TabsTrigger>
                          </TabsList>
                          {['en', 'az', 'ru'].map(lang => (
                            <TabsContent key={lang} value={lang}>
                              <Textarea
                                value={block.text?.[lang] || ''}
                                onChange={(e) => updateBlock(index, {
                                  text: { ...block.text, [lang]: e.target.value }
                                })}
                                rows={4}
                                placeholder={`Text content in ${lang.toUpperCase()}...`}
                              />
                            </TabsContent>
                          ))}
                        </Tabs>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={addImageBlock} className="flex-1">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add Image Block
                  </Button>
                  <Button type="button" variant="outline" onClick={addTextBlock} className="flex-1">
                    <Type className="w-4 h-4 mr-2" />
                    Add Text Block
                  </Button>
                </div>
              </CardContent>
            </Card>

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

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#5B5BF7] hover:bg-[#4A4AE0]">
                {editingBlog ? 'Update' : 'Create'} Blog Post
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
