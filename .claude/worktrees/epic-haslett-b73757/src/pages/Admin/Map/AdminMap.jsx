import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import RiskMap from '@/components/map/RiskMap/RiskMap';
import { useAuth } from '@/hooks/useAuth';
import { DISASTER_TYPES } from '@/constants/disasterTypes';
import { SEVERITY_LEVELS } from '@/constants/severityLevels';
import { listDisasters, listSensors } from '@/services/api';
import { getAllZonesWithRisk, countZonesByRisk, RISK_LEVELS } from '@/utils/riskZones';
import { useAdminNavItems } from '../adminNav';
import FilterPanel from './FilterPanel';
import styles from './AdminMap.module.css';

const DEFAULT_DISASTERS = new Set(Object.keys(DISASTER_TYPES));
const DEFAULT_SEVERITIES = new Set(Object.keys(SEVERITY_LEVELS));
const DEFAULT_STATUSES = new Set(['pending', 'validated']);

function toggleSet(set, id) {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export default function AdminMap() {
  const { t } = useTranslation();
  const navItems = useAdminNavItems();
  const { profile } = useAuth();
  const firstName = (profile?.displayName || 'admin').split(/\s+/)[0];

  const [disasters, setDisasters] = useState(DEFAULT_DISASTERS);
  const [severities, setSeverities] = useState(DEFAULT_SEVERITIES);
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES);

  const [sensors, setSensors] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listSensors(),
      listDisasters({ status: 'pending,validated', limit: 500 }),
    ])
      .then(([s, r]) => {
        if (cancelled) return;
        setSensors(s);
        setReports(r);
      })
      .catch(() => {
        if (cancelled) return;
        setSensors([]);
        setReports([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredReports = useMemo(
    () =>
      reports.filter(
        (r) =>
          disasters.has(r.type) &&
          severities.has(r.severity) &&
          statuses.has(r.status),
      ),
    [reports, disasters, severities, statuses],
  );

  const zonesWithRisk = useMemo(
    () =>
      getAllZonesWithRisk({
        sensors,
        reports: filteredReports,
        alerts: [],
      }),
    [sensors, filteredReports],
  );

  const counts = useMemo(() => countZonesByRisk(zonesWithRisk), [zonesWithRisk]);
  const sensorAlerts = sensors.filter((s) => !s.offline && s.alertLevel !== 'normal').length;
  const offlineSensors = sensors.filter((s) => s.offline).length;

  function handleReset() {
    setDisasters(DEFAULT_DISASTERS);
    setSeverities(DEFAULT_SEVERITIES);
    setStatuses(DEFAULT_STATUSES);
  }

  return (
    <DashboardLayout
      navItems={navItems}
      eyebrow={t('admin.map.eyebrow')}
      title={t('admin.map.title')}
      tone="admin"
    >
      <section className={styles.intro}>
        <p className={styles.lead}>{t('admin.map.lead')}</p>
      </section>

      <section className={styles.kpiGrid}>
        <Kpi value={counts.high} label={RISK_LEVELS.high.label} color={RISK_LEVELS.high.color} />
        <Kpi value={counts.medium} label={RISK_LEVELS.medium.label} color={RISK_LEVELS.medium.color} />
        <Kpi value={counts.low} label={RISK_LEVELS.low.label} color={RISK_LEVELS.low.color} />
        <Kpi value={sensorAlerts} label={t('admin.dashboard.kpiSensorsAlert')} tone="ink" />
        <Kpi value={offlineSensors} label={t('admin.dashboard.kpiSensorsOffline')} tone="muted" />
      </section>

      <FilterPanel
        disasters={disasters}
        severities={severities}
        statuses={statuses}
        onToggleDisaster={(id) => setDisasters((s) => toggleSet(s, id))}
        onToggleSeverity={(id) => setSeverities((s) => toggleSet(s, id))}
        onToggleStatus={(id) => setStatuses((s) => toggleSet(s, id))}
        onReset={handleReset}
      />

      <section className={styles.mapSection} aria-label={t('map.title')}>
        <header className={styles.mapHead}>
          <span className={styles.live} aria-hidden="true" />
          <span>{t('map.liveBadge')} · OpenStreetMap</span>
          <span className={styles.coords}>4°03'N · 9°46'E</span>
        </header>
        <RiskMap
          zones={zonesWithRisk}
          sensors={sensors}
          height="clamp(480px, 70vh, 680px)"
        />
      </section>
    </DashboardLayout>
  );
}

function Kpi({ value, label, color, tone }) {
  const style = color ? { background: color, color: '#1A1A1A' } : undefined;
  return (
    <article
      className={`${styles.kpi} ${tone ? styles[`kpi_${tone}`] : ''}`}
      style={style}
    >
      <p className={styles.kpiValue}>{value}</p>
      <p className={styles.kpiLabel}>{label}</p>
    </article>
  );
}
