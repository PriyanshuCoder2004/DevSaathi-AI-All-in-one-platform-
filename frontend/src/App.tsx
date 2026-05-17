import { Routes, Route } from 'react-router-dom';
import { ROUTES } from './constants/routes';

// Auth & Protection
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Layout
import AppLayout from './components/layout/AppLayout';

// Pages
import {
  LandingPage,
  DashboardPage,
  LoginPage,
  RegisterPage,
  VerifyEmailPage,
  ResetPasswordPage,
  LearnPage,
  CodePage,
  DocsPage,
  DocSummaryPage,
  NotesPage,
  NoteEditorPage,
  ProgressPage,
  QuizPage,
  QuizResultsPage,
  ActivityPage,
  QuizHistoryPage,
  SettingsPage,
  NotFoundPage,
} from './pages';

import { ToastProvider } from './components/ui/ToastProvider';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes (No Layout) */}
            <Route path={ROUTES.HOME} element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path={ROUTES.LOGIN} element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path={ROUTES.REGISTER} element={<PublicRoute><RegisterPage /></PublicRoute>} />
            
            {/* Auth Pages (No Layout, but no PublicRoute redirect needed) */}
            <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
            <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

            {/* Protected Routes (With AppLayout) */}
            <Route path={ROUTES.DASHBOARD} element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
            <Route path={ROUTES.LEARN} element={<ProtectedRoute><AppLayout><LearnPage /></AppLayout></ProtectedRoute>} />
            <Route path={ROUTES.CODE} element={<ProtectedRoute><AppLayout><CodePage /></AppLayout></ProtectedRoute>} />
            <Route path={ROUTES.DOCS} element={<ProtectedRoute><AppLayout><DocsPage /></AppLayout></ProtectedRoute>} />
            <Route path={ROUTES.DOCS_SUMMARY} element={<ProtectedRoute><AppLayout><DocSummaryPage /></AppLayout></ProtectedRoute>} />
            <Route path={ROUTES.NOTES} element={<ProtectedRoute><AppLayout><NotesPage /></AppLayout></ProtectedRoute>} />
            <Route path={ROUTES.NOTE_NEW} element={<ProtectedRoute><NoteEditorPage /></ProtectedRoute>} />
            <Route path={ROUTES.NOTE_EDITOR} element={<ProtectedRoute><NoteEditorPage /></ProtectedRoute>} />
            <Route path={ROUTES.PROGRESS} element={<ProtectedRoute><AppLayout><ProgressPage /></AppLayout></ProtectedRoute>} />
            <Route path={ROUTES.QUIZ} element={<ProtectedRoute><AppLayout><QuizPage /></AppLayout></ProtectedRoute>} />
            <Route path={ROUTES.QUIZ_RESULTS} element={<ProtectedRoute><AppLayout><QuizResultsPage /></AppLayout></ProtectedRoute>} />
            <Route path={ROUTES.QUIZ_HISTORY} element={<ProtectedRoute><AppLayout><QuizHistoryPage /></AppLayout></ProtectedRoute>} />
            <Route path={ROUTES.ACTIVITY} element={<ProtectedRoute><AppLayout><ActivityPage /></AppLayout></ProtectedRoute>} />
            <Route path={ROUTES.SETTINGS} element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
