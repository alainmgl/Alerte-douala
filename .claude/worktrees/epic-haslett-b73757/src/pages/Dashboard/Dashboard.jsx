import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/common/Button/Button';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { ROUTES } from '@/constants/routes';
import {
  listMyDisasters,
  getPublicFeed,
} from '@/services/api';
import StatsCards from './sections/StatsCards';
import MyReportsList from './sections/MyReportsList';
import NearbyAlerts from './sections/NearbyAlerts';
import SensorsPanel from './sections/SensorsPanel';
import styles from './Dashboard.module.css';

const EMPTY_STATS = { total: 0, pending: 0, validated: 0, rejected: 0 };

function deriveStats(reports) {
  return {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'pending').length,
    validated: reports.filter((r) => r.status === 'validated').length,
    rejected: reports.filter((r) => r.status === 'rejected').length,
    list: reports,
  };
}

function todayLabel(lng) {
  const locale = lng === 'en' ? 'en-US' : 'fr-FR';
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return formatter.format(new Date());
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const { notify } = useToast();

  const NAV_ITEMS = [
    { to: ROUTES.DASHBOARD, label: t('dashboard.navHome'), icon: '◆', end: true },
    { to: ROUTES.ALERTS, label: t('dashboard.navAlerts'), icon: '!' },
    { to: ROUTES.MAP, label: t('dashboard.navMap'), icon: '◉' },
    { to: ROUTES.REPORT, label: t('dashboard.navReport'), icon: '+' },
    { to: ROUTES.PROFILE, label: t('dashboard.navProfile'), icon: '·' },
  ];
  const uid = profile?.uid;
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const firstName = (profile?.displayName || profile?.email || 'sentinelle').split(/\s+/)[0];

  useEffect(() => {
    if (!uid) return undefined;
    let cancelled = false;
    Promise.all([listMyDisasters(uid, 20), getPublicFeed(3)])
      .then(([myReports, feed]) => {
        if (cancelled) return;
        setReports(myReports);
        setAlerts(feed);
      })
      .catch((err) => {
        if (cancelled) return;
        setReports([]);
        setAlerts([]);
        console.error('[Dashboard] échec chargement données :', err);
        notify({
          tone: 'error',
          title: t('dashboard.errorTitle'),
          body: t('dashboard.errorBody'),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [uid, notify, t]);

  const stats = uid ? deriveStats(reports) : EMPTY_STATS;
  const lastReports = reports.slice(0, 5);

  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      eyebrow={todayLabel(i18n.language)}
      title={t('dashboard.greeting', { name: firstName })}
      tone="user"
    >
      <section className={styles.intro}>
        <p className={styles.lead}>{t('dashboard.lead')}</p>
        <Button as="link" to={ROUTES.REPORT} variant="primary" size="md">
          {t('dashboard.ctaReport')}
        </Button>
      </section>

      <StatsCards stats={stats} />

      <SensorsPanel />

      <div className={styles.split}>
        <MyReportsList reports={lastReports} />
        <NearbyAlerts alerts={alerts} />
      </div>
    </DashboardLayout>
  );
}
