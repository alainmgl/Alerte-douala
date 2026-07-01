import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Spinner from '@/components/common/Spinner/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { ROUTES } from '@/constants/routes';
import styles from './ProtectedRoute.module.css';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { t } = useTranslation();
  const { user, loading, isAdmin } = useAuth();
  const { notify } = useToast();
  const location = useLocation();

  const denied = requireAdmin && !loading && user && !isAdmin;

  useEffect(() => {
    if (denied) {
      notify({
        tone: 'error',
        title: t('errors.forbidden'),
        body: t('errors.forbidden'),
      });
    }
  }, [denied, notify, t]);

  if (loading) {
    return (
      <div className={styles.loader}>
        <Spinner size={32} label={t('common.loading')} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />;
  }

  if (denied) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return children;
}
