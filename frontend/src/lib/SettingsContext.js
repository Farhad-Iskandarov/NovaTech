import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SettingsContext = createContext();

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API}/settings`);
        setSettings(res.data);
      } catch (error) {
        console.error('Error fetching settings:', error);
        // Set default settings on error
        setSettings({
          whatsapp_number: '+123456789',
          contact: {
            phones: ['+123456789'],
            email: 'info@novatech.az',
            address: { en: 'Sumgayit, Markaz Plaza, Azerbaijan', az: 'Sumqayıt, Markaz Plaza, Azərbaycan', ru: 'Сумгаит, Markaz Plaza, Азербайджан' },
            google_map_embed: ''
          },
          social_media: [
            { platform: 'instagram', url: 'https://instagram.com/novatech', is_active: true },
            { platform: 'facebook', url: 'https://facebook.com/novatech', is_active: true }
          ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const refreshSettings = async () => {
    try {
      const res = await axios.get(`${API}/settings`);
      setSettings(res.data);
    } catch (error) {
      console.error('Error refreshing settings:', error);
    }
  };

  const getWhatsAppUrl = () => {
    const number = settings?.whatsapp_number || '+123456789';
    return `https://wa.me/${number.replace(/[^0-9]/g, '')}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings, getWhatsAppUrl }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
