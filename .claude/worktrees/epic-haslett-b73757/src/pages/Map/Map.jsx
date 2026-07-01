import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Container from '@/components/common/Container/Container';
import Badge from '@/components/common/Badge/Badge';
import RiskMap from '@/components/map/RiskMap/RiskMap';
import { ROUTES } from '@/constants/routes';
import { getPublicFeed, listPublicSensors } from '@/services/api';
import {
  getAllZonesWithRisk,
  countZonesByRisk,
  compareByRisk,
  RISK_LEVELS,
} from '@/utils/riskZones';
import styles from './Map.module.css';

export default function Map() {
  const { t } = useTranslation();
  const [sensors, setSensors] = useState([]);
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listPublicSensors(), getPublicFeed(100)])
      .then(([s, f]) => {
        if (cancelled) return;
        setSensors(s);
        setFeed(f);
      })
      .catch(() => {
        if (cancelled) return;
        setSensors([]);
        setFeed([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const zonesWithRisk = useMemo(
    () =>
      getAllZonesWithRisk({
        sensors,
        reports: feed.filter((f) => f.source !== 'sensor-live'),
        alerts: feed.filter((f) => f.source === 'sensor-live'),
      }),
    [sensors, feed],
  );
  const counts = useMemo(() => countZonesByRisk(zonesWithRisk), [zonesWithRisk]);
  const sensorsInAlert = sensors.filter((s) => !s.offline && s.alertLevel !== 'normal').length;
  const activeAlerts = feed.length;

  const topZones = useMemo(
    () =>
      [...zonesWithRisk]
        .filter((z) => z.risk.level !== 'none')
        .sort(compareByRisk)
        .slice(0, 6),
    [zonesWithRisk],
  );

  const zonesAtRisk = counts.high + counts.medium + counts.low;

  return (
    <main className={styles.page}>
      <Container size="xl" className={styles.head}>
        <div>
          <p className="text-eyebrow">{t('map.eyebrow')}</p>
          <h1 className={styles.title}>{t('map.title')}</h1>
          <p className={styles.lede}>{t('map.lead')}</p>
        </div>
        <div className={styles.kpis}>
          <KpiPill label={t('map.kpiZones')} value={zonesAtRisk} tone="alert" />
          <KpiPill label={t('map.kpiActive')} value={activeAlerts} tone="ok" />
          <KpiPill label={t('map.kpiSensorsLive')} value={sensorsInAlert} tone="muted" />
        </div>
      </Container>

      <Container size="xl" className={styles.layout}>
        <section className={styles.mapWrap} aria-label={t('map.ariaMap')}>
          <div className={styles.mapHead}>
            <Badge tone="live" dot>
              {t('map.liveBadge')}
            </Badge>
            <span className={styles.coords}>4°03'N · 9°46'E</span>
          </div>
          <div className={styles.mapBody}>
            <RiskMap zones={zonesWithRisk} height="100%" />
          </div>
        </section>

        <aside className={styles.side}>
          <div className={styles.sidePanel}>
            <h2 className={styles.sideTitle}>{t('map.sideTitle')}</h2>
            <p className={styles.sideLede}>{t('map.sideLead')}</p>
            {topZones.length === 0 ? (
              <p className={styles.sideEmpty}>{t('map.sideEmpty')}</p>
            ) : (
              <ul className={styles.zoneList}>
                {topZones.map((zone) => {
                  const meta = [
                    t('map.zoneMetaSensors', { count: zone.risk.sensorCount }),
                    t('map.zoneMetaReports', { count: zone.risk.reportCount }),
                    zone.risk.alertCount > 0
                      ? t('map.zoneMetaAlerts', { count: zone.risk.alertCount })
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <li key={zone.id} className={styles.zoneItem}>
                      <div className={styles.zoneItemHead}>
                        <span
                          className={styles.zoneItemDot}
                          style={{ backgroundColor: zone.risk.color }}
                          aria-hidden="true"
                        />
                        <div className={styles.zoneItemMain}>
                          <p className={styles.zoneItemName}>{zone.name}</p>
                          <p className={styles.zoneItemArr}>{zone.arrondissement}</p>
                        </div>
                        <span
                          className={styles.zoneItemRiskPill}
                          style={{ backgroundColor: zone.risk.color, color: zone.risk.textColor }}
                        >
                          {zone.risk.label}
                        </span>
                      </div>
                      <p className={styles.zoneItemMeta}>{meta}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className={styles.legend}>
            <p className={styles.legendTitle}>{t('map.legendTitle')}</p>
            <ul className={styles.legendList}>
              {[RISK_LEVELS.high, RISK_LEVELS.medium, RISK_LEVELS.low].map((lvl) => (
                <li key={lvl.id} className={styles.legendRow}>
                  <span
                    className={styles.legendSwatch}
                    style={{ backgroundColor: lvl.color }}
                    aria-hidden="true"
                  />
                  <span>
                    <strong>{lvl.label}</strong> — {t(`map.legendHint${lvl.id[0].toUpperCase() + lvl.id.slice(1)}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </Container>

      <Container size="xl" className={styles.bottomNav}>
        <Link to={ROUTES.HOME}>{t('map.backHome')}</Link>
      </Container>
    </main>
  );
}

function KpiPill({ label, value, tone }) {
  return (
    <div className={`${styles.kpiPill} ${styles[`kpi_${tone}`]}`}>
      <span className={styles.kpiValue}>{value}</span>
      <span className={styles.kpiLabel}>{label}</span>
    </div>
  );
}
