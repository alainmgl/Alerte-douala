import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/common/Button/Button';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { ROUTES } from '@/constants/routes';
import { getPublicFeed } from '@/services/api';
import AlertsKpis from './sections/AlertsKpis';
import AlertsFeed from './sections/AlertsFeed';
import AlertFilters from '@/components/disasters/AlertFilters/AlertFilters';
import styles from './UserAlerts.module.css';

const EMPTY_FILTERS = { types: [], zones: [], sources: [] };

function applyFilters(feed, filters) {
  const { types, zones, sources } = filters;
  return feed.filter((a) => {
    if (types.length && !types.includes(a.type)) return false;
    if (zones.length && !zones.includes(a.quartierId)) return false;
    if (sources.length && !sources.includes(a.source)) return false;
    return true;
  });
}

function deriveKpis(feed) {
  const critical = feed.filter((a) => a.severity === 'critical').length;
  const sensorsLive = feed.filter((a) => a.source === 'sensor-live').length;
  const zones = new Set(feed.map((a) => a.quartierId)).size;
  return {
    active: feed.length,
    critical,
    sensorsLive,
    zones,
  };
}

export default function UserAlerts() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { notify } = useToast();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [feed, setFeed] = useState([]);

  const NAV_ITEMS = [
    { to: ROUTES.DASHBOARD, label: t('dashboard.navHome'), icon: '◆' },
    { to: ROUTES.ALERTS, label: t('dashboard.navAlerts'), icon: '!', end: true },
    { to: ROUTES.MAP, label: t('dashboard.navMap'), icon: '◉' },
    { to: ROUTES.REPORT, label: t('dashboard.navReport'), icon: '+' },
    { to: ROUTES.PROFILE, label: t('dashboard.navProfile'), icon: '·' },
  ];

  useEffect(() => {
    let cancelled = false;
    getPublicFeed(50)
      .then((rows) => {
        if (!cancelled) setFeed(rows);
      })
      .catch((err) => {
        if (cancelled) return;
        setFeed([]);
        console.error('[UserAlerts] échec chargement feed :', err);
        notify({
          tone: 'error',
          title: t('alerts.errorTitle'),
          body: t('alerts.errorBody'),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [notify, t]);

  const filteredFeed = useMemo(() => applyFilters(feed, filters), [feed, filters]);
  const kpis = useMemo(() => deriveKpis(filteredFeed), [filteredFeed]);

  const firstName = (profile?.displayName || profile?.email || 'sentinelle').split(/\s+/)[0];

  const hasFilters =
    filteredFeed.length === 0 &&
    (filters.types.length || filters.zones.length || filters.sources.length);

  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      eyebrow={t('alerts.eyebrow')}
      title={t('alerts.title')}
      tone="user"
    >
      <section className={styles.intro}>
        <div>
          <p className={styles.lead}>
            {t('alerts.leadBefore')}<strong>{firstName}</strong>{t('alerts.leadAfter')}
          </p>
        </div>
        <Button as="link" to={ROUTES.REPORT} variant="primary" size="md">
          {t('alerts.ctaReport')}
        </Button>
      </section>

      <AlertsKpis kpis={kpis} />

      <AlertFilters value={filters} onChange={setFilters} />

      <AlertsFeed feed={filteredFeed} hasFilters={hasFilters} />
    </DashboardLayout>
  );
}
