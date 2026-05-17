import React from 'react';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import VerifyEmailPage from './VerifyEmailPage';
import ResetPasswordPage from './ResetPasswordPage';
import LandingPage from './LandingPage';
import DashboardPage from './DashboardPage';
import LearnPage from './LearnPage';
import QuizPage from './QuizPage';
import QuizResultsPage from './QuizResultsPage';
import CodePage from './CodePage';
import DocsPage from './DocsPage';
import DocSummaryPage from './DocSummaryPage';
import ProgressPage from './ProgressPage';
import ActivityPage from './ActivityPage';
import QuizHistoryPage from './QuizHistoryPage';
import SettingsPage from './SettingsPage';

import NotesPage from './NotesPage';
import NoteEditorPage from './NoteEditorPage';

const NotFoundPage: React.FC = () => <div className="p-8 text-error font-bold text-center mt-20">404 - Page Not Found</div>;

export {
  LoginPage,
  RegisterPage,
  VerifyEmailPage,
  ResetPasswordPage,
  LandingPage,
  DashboardPage,
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
  NotFoundPage
};
