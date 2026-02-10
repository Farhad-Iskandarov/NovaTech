import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./lib/LanguageContext";
import { ThemeProvider } from "./lib/ThemeContext";
import { SettingsProvider } from "./lib/SettingsContext";
import { Toaster } from "./components/ui/sonner";
import { InitialLoader } from "./components/InitialLoader";
import { ScrollToTop } from "./components/ScrollToTop";

// Layout Components
import { PublicLayout } from "./components/PublicLayout";
import { AdminLayout } from "./components/AdminLayout";

// Public Pages
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { CoursesPage } from "./pages/CoursesPage";
import { CourseDetailPage } from "./pages/CourseDetailPage";
import { BlogPage, BlogDetailPage } from "./pages/BlogPage";
import { ContactPage } from "./pages/ContactPage";
import { VacanciesPage } from "./pages/VacanciesPage";
import { InternshipsPage } from "./pages/InternshipsPage";

// Admin Pages
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminCourses } from "./pages/AdminCourses";
import { AdminBlogs } from "./pages/AdminBlogs";
import { AdminTestimonials } from "./pages/AdminTestimonials";
import { AdminTeachers } from "./pages/AdminTeachers";
import { AdminSubmissions } from "./pages/AdminSubmissions";
import { AdminSlides } from "./pages/AdminSlides";
import { AdminSettings } from "./pages/AdminSettings";
import { AdminTrialLessons } from "./pages/AdminTrialLessons";
import { AdminVacancies } from "./pages/AdminVacancies";
import { AdminInternships } from "./pages/AdminInternships";

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SettingsProvider>
          <InitialLoader />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogDetailPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/vacancies" element={<VacanciesPage />} />
                <Route path="/internships" element={<InternshipsPage />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/nova-admin" element={<AdminLoginPage />} />
              <Route path="/nova-admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="courses" element={<AdminCourses />} />
                <Route path="blogs" element={<AdminBlogs />} />
                <Route path="testimonials" element={<AdminTestimonials />} />
                <Route path="teachers" element={<AdminTeachers />} />
                <Route path="submissions" element={<AdminSubmissions />} />
                <Route path="trial-lessons" element={<AdminTrialLessons />} />
                <Route path="vacancies" element={<AdminVacancies />} />
                <Route path="internships" element={<AdminInternships />} />
                <Route path="slides" element={<AdminSlides />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </SettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
