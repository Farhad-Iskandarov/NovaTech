import React, { useState, useEffect } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useSettings } from '../lib/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Plus,
  Trash2,
  Save,
  Loader2,
  MessageSquare,
  Settings,
  Clock,
  Lock,
  User,
  Eye,
  EyeOff,
  KeyRound,
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// TikTok icon (not in lucide-react)
const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const socialPlatforms = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/...' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/...' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/company/...' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@...' },
  { key: 'tiktok', label: 'TikTok', icon: TikTokIcon, placeholder: 'https://tiktok.com/@...' }
];

export function AdminSettings() {
  const { refreshSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Page SEO state
  const [pageSeoData, setPageSeoData] = useState({});
  const [pageSeoSaving, setPageSeoSaving] = useState({});

  // Admin 2 account state
  const [isAdmin2, setIsAdmin2] = useState(false);
  const [isAdmin1, setIsAdmin1] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showAdmin2ResetPassword, setShowAdmin2ResetPassword] = useState(false);
  const [accountForm, setAccountForm] = useState({
    new_email: '',
    new_password: '',
    confirm_password: '',
    current_password: ''
  });

  // Admin 1 master control state
  const [admin2Info, setAdmin2Info] = useState(null);
  const [admin2ResetPassword, setAdmin2ResetPassword] = useState('');
  const [admin2ResetConfirm, setAdmin2ResetConfirm] = useState('');
  const [admin1Loading, setAdmin1Loading] = useState(false);

  // Form state
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [contact, setContact] = useState({
    phones: [''],
    email: '',
    address: { en: '', az: '', ru: '' },
    google_map_embed: ''
  });
  const [socialMedia, setSocialMedia] = useState([]);
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '17:00' });
  const [adminSecurityEnabled, setAdminSecurityEnabled] = useState(true);

  const token = localStorage.getItem('novatech-token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchSettings();
    checkAdmin2Access();
    fetchPageSeo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emptyLocalized = { en: '', az: '', ru: '' };

  const staticPages = [
    { key: 'home', label: 'Home' },
    { key: 'about', label: 'About Us' },
    { key: 'courses', label: 'Courses' },
    { key: 'careers', label: 'Careers' },
    { key: 'blog', label: 'Blog' },
    { key: 'contact', label: 'Contact' }
  ];

  const fetchPageSeo = async () => {
    try {
      const res = await axios.get(`${API}/page-seo`, { headers });
      const map = {};
      res.data.forEach(item => {
        map[item.page_key] = {
          meta_title: item.meta_title || { ...emptyLocalized },
          meta_description: item.meta_description || { ...emptyLocalized }
        };
      });
      setPageSeoData(map);
    } catch (error) {
      console.error('Failed to load page SEO data');
    }
  };

  const handlePageSeoSave = async (pageKey) => {
    setPageSeoSaving(prev => ({ ...prev, [pageKey]: true }));
    try {
      const data = pageSeoData[pageKey] || { meta_title: { ...emptyLocalized }, meta_description: { ...emptyLocalized } };
      await axios.put(`${API}/page-seo/${pageKey}`, data, { headers });
      toast.success(`SEO updated for ${staticPages.find(p => p.key === pageKey)?.label || pageKey}`);
    } catch (error) {
      toast.error('Failed to save page SEO');
    } finally {
      setPageSeoSaving(prev => ({ ...prev, [pageKey]: false }));
    }
  };

  const updatePageSeoField = (pageKey, field, lang, value) => {
    setPageSeoData(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        [field]: { ...(prev[pageKey]?.[field] || emptyLocalized), [lang]: value }
      }
    }));
  };

  const checkAdmin2Access = async () => {
    try {
      const res = await axios.get(`${API}/auth/admin2/check`, { headers });
      setIsAdmin2(res.data.is_admin2);
      setIsAdmin1(res.data.is_admin1);
      if (res.data.is_admin2) {
        setAccountForm(prev => ({ ...prev, new_email: res.data.email }));
      }
      // If Admin 1, fetch Admin 2 info
      if (res.data.is_admin1) {
        fetchAdmin2Info();
      }
    } catch (error) {
      setIsAdmin2(false);
      setIsAdmin1(false);
    }
  };

  const fetchAdmin2Info = async () => {
    try {
      const res = await axios.get(`${API}/auth/admin2/info`, { headers });
      setAdmin2Info(res.data);
    } catch (error) {
      console.error('Failed to fetch Admin 2 info');
    }
  };

  // Admin 1 master reset Admin 2 password
  const handleAdmin1ResetAdmin2 = async (e) => {
    e.preventDefault();

    if (!admin2ResetPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (admin2ResetPassword !== admin2ResetConfirm) {
      toast.error('Passwords do not match');
      return;
    }

    if (admin2ResetPassword.length < 8) {
      toast.error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      return;
    }

    setAdmin1Loading(true);
    try {
      await axios.put(`${API}/auth/admin1/reset-admin2`, {
        new_password: admin2ResetPassword
      }, { headers });

      toast.success('Admin 2 password has been reset successfully!');
      setAdmin2ResetPassword('');
      setAdmin2ResetConfirm('');
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to reset Admin 2 password';
      toast.error(message);
    } finally {
      setAdmin1Loading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/settings`, { headers });
      const data = res.data;

      setWhatsappNumber(data.whatsapp_number || '');
      setContact({
        phones: data.contact?.phones?.length > 0 ? data.contact.phones : [''],
        email: data.contact?.email || '',
        address: data.contact?.address || { en: '', az: '', ru: '' },
        google_map_embed: data.contact?.google_map_embed || ''
      });
      setSocialMedia(data.social_media || []);
      setWorkingHours(data.working_hours || { start: '09:00', end: '17:00' });
      setAdminSecurityEnabled(data.admin_security_enabled !== false);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Filter out empty phones
      const filteredPhones = contact.phones.filter(p => p.trim() !== '');

      await axios.put(`${API}/settings`, {
        whatsapp_number: whatsappNumber,
        contact: {
          ...contact,
          phones: filteredPhones.length > 0 ? filteredPhones : [whatsappNumber]
        },
        social_media: socialMedia,
        working_hours: workingHours,
        admin_security_enabled: adminSecurityEnabled
      }, { headers });

      toast.success('Settings saved successfully');
      refreshSettings(); // Refresh context
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Handle Admin 2 account update
  const handleAccountUpdate = async (e) => {
    e.preventDefault();

    if (!accountForm.current_password) {
      toast.error('Current password is required');
      return;
    }

    if (accountForm.new_password && accountForm.new_password !== accountForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (accountForm.new_password && accountForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      return;
    }

    setAccountLoading(true);
    try {
      const payload = {
        current_password: accountForm.current_password
      };

      if (accountForm.new_email) {
        payload.new_email = accountForm.new_email;
      }
      if (accountForm.new_password) {
        payload.new_password = accountForm.new_password;
      }

      const res = await axios.put(`${API}/auth/admin2/credentials`, payload, { headers });

      // Update token if email changed
      if (res.data.access_token) {
        localStorage.setItem('novatech-token', res.data.access_token);
      }

      toast.success('Account credentials updated successfully!');
      setAccountForm(prev => ({
        ...prev,
        new_email: res.data.email,
        new_password: '',
        confirm_password: '',
        current_password: ''
      }));
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to update credentials';
      toast.error(message);
    } finally {
      setAccountLoading(false);
    }
  };

  const addPhone = () => {
    setContact({ ...contact, phones: [...contact.phones, ''] });
  };

  const removePhone = (index) => {
    if (contact.phones.length <= 1) return;
    const newPhones = contact.phones.filter((_, i) => i !== index);
    setContact({ ...contact, phones: newPhones });
  };

  const updatePhone = (index, value) => {
    const newPhones = [...contact.phones];
    newPhones[index] = value;
    setContact({ ...contact, phones: newPhones });
  };

  const updateSocialMedia = (platform, field, value) => {
    const existing = socialMedia.find(s => s.platform === platform);
    if (existing) {
      setSocialMedia(socialMedia.map(s =>
        s.platform === platform ? { ...s, [field]: value } : s
      ));
    } else {
      setSocialMedia([...socialMedia, { platform, url: '', is_active: false, [field]: value }]);
    }
  };

  const getSocialValue = (platform, field) => {
    const social = socialMedia.find(s => s.platform === platform);
    return social?.[field] ?? (field === 'is_active' ? false : '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#5B5BF7]" />
      </div>
    );
  }

  return (
    <div data-testid="admin-settings" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Site Settings</h1>
          <p className="text-slate-600">Manage global website configuration</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          data-testid="save-settings-btn"
          className="bg-[#5B5BF7] hover:bg-[#4A4AE0]"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save All Changes
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${isAdmin2 || isAdmin1 ? 'grid-cols-6' : 'grid-cols-5'}`}>
          <TabsTrigger value="general" data-testid="tab-general">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="contact" data-testid="tab-contact">
            <Phone className="w-4 h-4 mr-2" />
            Contact Info
          </TabsTrigger>
          <TabsTrigger value="social" data-testid="tab-social">
            <Globe className="w-4 h-4 mr-2" />
            Social Media
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            <Lock className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="page-seo" data-testid="tab-page-seo">
            <Search className="w-4 h-4 mr-2" />
            Page SEO
          </TabsTrigger>
          {isAdmin2 && (
            <TabsTrigger value="account" data-testid="tab-account">
              <User className="w-4 h-4 mr-2" />
              My Account
            </TabsTrigger>
          )}
          {isAdmin1 && (
            <TabsTrigger value="manage-admins" data-testid="tab-manage-admins">
              <KeyRound className="w-4 h-4 mr-2" />
              Manage Admins
            </TabsTrigger>
          )}
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                WhatsApp Number
              </CardTitle>
              <CardDescription>
                This number is used for the floating WhatsApp button and all CTA buttons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">Phone Number (with country code)</Label>
                  <Input
                    id="whatsapp"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+994501234567"
                    data-testid="whatsapp-number-input"
                  />
                  <p className="text-xs text-slate-500">
                    Include country code (e.g., +994 for Azerbaijan)
                  </p>
                </div>

                {whatsappNumber && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      <strong>Preview:</strong> Users will be directed to{' '}
                      <a
                        href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        wa.me/{whatsappNumber.replace(/[^0-9]/g, '')}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Info Tab */}
        <TabsContent value="contact" className="space-y-6">
          {/* Phone Numbers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                Phone Numbers
              </CardTitle>
              <CardDescription>
                Contact phone numbers displayed on the website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contact.phones.map((phone, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={phone}
                    onChange={(e) => updatePhone(index, e.target.value)}
                    placeholder="+994501234567"
                    data-testid={`phone-${index}`}
                  />
                  {contact.phones.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePhone(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addPhone} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Phone Number
              </Button>
            </CardContent>
          </Card>

          {/* Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-600" />
                Email Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                placeholder="info@novatech.az"
                data-testid="email-input"
              />
            </CardContent>
          </Card>

          {/* Address - Multi-language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-600" />
                Address
              </CardTitle>
              <CardDescription>
                Physical location displayed on Contact page and Footer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {['en', 'az', 'ru'].map(lang => (
                <div key={lang} className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase">
                    {lang === 'en' ? 'English' : lang === 'az' ? 'Azerbaijani' : 'Russian'}
                  </Label>
                  <Input
                    value={contact.address[lang]}
                    onChange={(e) => setContact({
                      ...contact,
                      address: { ...contact.address, [lang]: e.target.value }
                    })}
                    placeholder={`Address in ${lang === 'en' ? 'English' : lang === 'az' ? 'Azerbaijani' : 'Russian'}`}
                    data-testid={`address-${lang}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Google Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Google Map Embed
              </CardTitle>
              <CardDescription>
                Embed URL for the Google Maps iframe on Contact page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={contact.google_map_embed}
                onChange={(e) => setContact({ ...contact, google_map_embed: e.target.value })}
                placeholder="https://www.google.com/maps/embed?pb=..."
                rows={3}
                data-testid="map-embed-input"
              />
              {contact.google_map_embed && (
                <div className="rounded-lg overflow-hidden h-48 bg-slate-100">
                  <iframe
                    src={contact.google_map_embed}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    title="Map Preview"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Working Hours
              </CardTitle>
              <CardDescription>
                Business hours displayed on Contact page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={workingHours.start}
                    onChange={(e) => setWorkingHours({ ...workingHours, start: e.target.value })}
                    data-testid="working-hours-start"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={workingHours.end}
                    onChange={(e) => setWorkingHours({ ...workingHours, end: e.target.value })}
                    data-testid="working-hours-end"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Example: {workingHours.start} - {workingHours.end}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>
                Configure your social media profiles. Toggle to enable/disable each platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {socialPlatforms.map((platform) => {
                const IconComponent = platform.icon;
                const isActive = getSocialValue(platform.key, 'is_active');
                const url = getSocialValue(platform.key, 'url');

                return (
                  <div
                    key={platform.key}
                    className={`p-4 rounded-lg border transition-colors ${isActive ? 'border-[#5B5BF7] bg-[#5B5BF7]/5' : 'border-slate-200 bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-[#5B5BF7] text-white' : 'bg-slate-200 text-slate-500'}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-slate-900">{platform.label}</span>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={(checked) => updateSocialMedia(platform.key, 'is_active', checked)}
                        data-testid={`social-toggle-${platform.key}`}
                      />
                    </div>
                    <Input
                      value={url}
                      onChange={(e) => updateSocialMedia(platform.key, 'url', e.target.value)}
                      placeholder={platform.placeholder}
                      disabled={!isActive}
                      className={!isActive ? 'opacity-50' : ''}
                      data-testid={`social-url-${platform.key}`}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-600" />
                Admin Login Security
              </CardTitle>
              <CardDescription>
                Control the advanced security system for admin panel login
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    Enable Advanced Security System
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    When enabled, the admin login will have:
                  </p>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 ml-4 list-disc">
                    <li>10 failed attempts threshold</li>
                    <li>Master password recovery mode</li>
                    <li>3-day lockout for incorrect master passwords</li>
                    <li>Real-time countdown timer during lockout</li>
                  </ul>
                  {!adminSecurityEnabled && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                        ⚠️ Security system is currently disabled. The admin login will use standard authentication only.
                      </p>
                    </div>
                  )}
                  {adminSecurityEnabled && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-xs text-green-700 dark:text-green-300 font-semibold">
                        ✓ Security system is active. Advanced protection is enabled.
                      </p>
                    </div>
                  )}
                </div>
                <Switch
                  checked={adminSecurityEnabled}
                  onCheckedChange={setAdminSecurityEnabled}
                  className="ml-4"
                />
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  Master Passwords (when security is enabled)
                </h4>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <p>• Master Password 2: <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded">Asif.?Yek.?NZS.?Baku69!</code></p>
                  <p>• Master Password 3: <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded">Farhad.?Yek.?NZS.?Polsa69!</code></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page SEO Tab */}
        <TabsContent value="page-seo" className="space-y-6">
          {staticPages.map(page => {
            const seo = pageSeoData[page.key] || { meta_title: { ...emptyLocalized }, meta_description: { ...emptyLocalized } };
            return (
              <Card key={page.key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Search className="w-4 h-4 text-[#5B5BF7]" />
                    {page.label}
                  </CardTitle>
                  <CardDescription>Meta title and description for the {page.label} page</CardDescription>
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
                        <div className="space-y-2">
                          <Label>Meta Title ({lang.toUpperCase()})</Label>
                          <Input
                            value={seo.meta_title?.[lang] || ''}
                            onChange={(e) => updatePageSeoField(page.key, 'meta_title', lang, e.target.value)}
                            placeholder={`Meta title for ${page.label} (${lang.toUpperCase()})`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Meta Description ({lang.toUpperCase()})</Label>
                          <Textarea
                            value={seo.meta_description?.[lang] || ''}
                            onChange={(e) => updatePageSeoField(page.key, 'meta_description', lang, e.target.value)}
                            rows={2}
                            placeholder={`Meta description for ${page.label} (${lang.toUpperCase()})`}
                          />
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                  <Button
                    onClick={() => handlePageSeoSave(page.key)}
                    disabled={pageSeoSaving[page.key]}
                    size="sm"
                    className="bg-[#5B5BF7] hover:bg-[#4A4AE0]"
                  >
                    {pageSeoSaving[page.key] ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="w-4 h-4 mr-2" /> Save {page.label} SEO</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Admin 2 Account Settings Tab - Only visible for Admin 2 */}
        {isAdmin2 && (
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#5B5BF7]" />
                  My Account Credentials
                </CardTitle>
                <CardDescription>
                  Update your email address and password securely
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAccountUpdate} className="space-y-6">
                  {/* Current Email Display */}
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">Current Account</span>
                    </div>
                    <p className="text-slate-900 font-semibold">{accountForm.new_email}</p>
                  </div>

                  {/* New Email */}
                  <div className="space-y-2">
                    <Label htmlFor="new_email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      New Email Address
                    </Label>
                    <Input
                      id="new_email"
                      type="email"
                      value={accountForm.new_email}
                      onChange={(e) => setAccountForm({ ...accountForm, new_email: e.target.value })}
                      placeholder="Enter new email address"
                      data-testid="admin2-new-email"
                    />
                    <p className="text-xs text-slate-500">Leave unchanged to keep current email</p>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="new_password" className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4" />
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type={showNewPassword ? "text" : "password"}
                        value={accountForm.new_password}
                        onChange={(e) => setAccountForm({ ...accountForm, new_password: e.target.value })}
                        placeholder="Enter new password"
                        data-testid="admin2-new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">Leave empty to keep current password</p>
                  </div>

                  {/* Confirm New Password */}
                  {accountForm.new_password && (
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirm New Password</Label>
                      <Input
                        id="confirm_password"
                        type={showNewPassword ? "text" : "password"}
                        value={accountForm.confirm_password}
                        onChange={(e) => setAccountForm({ ...accountForm, confirm_password: e.target.value })}
                        placeholder="Confirm new password"
                        data-testid="admin2-confirm-password"
                      />
                      {accountForm.new_password !== accountForm.confirm_password && accountForm.confirm_password && (
                        <p className="text-xs text-red-500">Passwords do not match</p>
                      )}
                    </div>
                  )}

                  {/* Current Password - Required */}
                  <div className="space-y-2 pt-4 border-t border-slate-200">
                    <Label htmlFor="current_password" className="flex items-center gap-2 text-slate-900">
                      <Lock className="w-4 h-4 text-red-500" />
                      Current Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={accountForm.current_password}
                        onChange={(e) => setAccountForm({ ...accountForm, current_password: e.target.value })}
                        placeholder="Enter your current password to confirm changes"
                        required
                        data-testid="admin2-current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-amber-600 font-medium">Required to verify your identity</p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={accountLoading || !accountForm.current_password}
                    className="w-full bg-[#5B5BF7] hover:bg-[#4A4AE0]"
                    data-testid="admin2-save-credentials"
                  >
                    {accountLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Update Credentials
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Security Note */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-1">Security Notice</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Only Admin 2 can access and modify these credentials</li>
                      <li>• Password must contain: uppercase, lowercase, number, and special character</li>
                      <li>• After changing email, you will be logged in with the new credentials</li>
                      <li>• Keep your credentials secure and do not share them</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Admin 1 - Manage Admins Tab (Master Privilege) */}
        {isAdmin1 && (
          <TabsContent value="manage-admins" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#5B5BF7]" />
                  Master Admin Control
                </CardTitle>
                <CardDescription>
                  As Admin 1, you have master privileges to manage Admin 2 credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Admin 2 Info Card */}
                {admin2Info && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#5B5BF7] rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">Admin 2</h4>
                        <p className="text-sm text-slate-500">{admin2Info.email}</p>
                      </div>
                      <span className={`ml-auto px-2 py-1 text-xs font-medium rounded-full ${admin2Info.exists ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {admin2Info.exists ? 'Active' : 'Not Found'}
                      </span>
                    </div>
                    {admin2Info.created_at && (
                      <p className="text-xs text-slate-500">
                        Created: {new Date(admin2Info.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Reset Admin 2 Password Form */}
                <form onSubmit={handleAdmin1ResetAdmin2} className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <KeyRound className="w-4 h-4" />
                      Reset Admin 2 Password
                    </h4>
                    <p className="text-sm text-blue-700 mb-4">
                      Set a new password for Admin 2 without requiring their current password.
                    </p>

                    <div className="space-y-4">
                      {/* New Password */}
                      <div className="space-y-2">
                        <Label htmlFor="admin2_new_password">New Password for Admin 2</Label>
                        <div className="relative">
                          <Input
                            id="admin2_new_password"
                            type={showAdmin2ResetPassword ? "text" : "password"}
                            value={admin2ResetPassword}
                            onChange={(e) => setAdmin2ResetPassword(e.target.value)}
                            placeholder="Enter new password for Admin 2"
                            className="pr-10"
                            data-testid="admin1-reset-admin2-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdmin2ResetPassword(!showAdmin2ResetPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showAdmin2ResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm New Password */}
                      <div className="space-y-2">
                        <Label htmlFor="admin2_confirm_password">Confirm New Password</Label>
                        <Input
                          id="admin2_confirm_password"
                          type={showAdmin2ResetPassword ? "text" : "password"}
                          value={admin2ResetConfirm}
                          onChange={(e) => setAdmin2ResetConfirm(e.target.value)}
                          placeholder="Confirm new password"
                          data-testid="admin1-reset-admin2-confirm"
                        />
                        {admin2ResetPassword && admin2ResetConfirm && admin2ResetPassword !== admin2ResetConfirm && (
                          <p className="text-xs text-red-500">Passwords do not match</p>
                        )}
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={admin1Loading || !admin2ResetPassword || admin2ResetPassword !== admin2ResetConfirm}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        data-testid="admin1-reset-admin2-submit"
                      >
                        {admin1Loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4 mr-2" />
                            Reset Admin 2 Password
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Master Privilege Notice */}
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <KeyRound className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-1">Master Privilege</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Only Admin 1 has access to this panel</li>
                      <li>• You can reset Admin 2's password without their current password</li>
                      <li>• Use this for recovery access when Admin 2 forgets their password</li>
                      <li>• Admin 2 will need to use the new password on next login</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
