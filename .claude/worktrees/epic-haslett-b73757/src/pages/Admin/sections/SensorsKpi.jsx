import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import { listSensors } from '@/services/api';
import { zoneName, alertLevelLabel } from '@/utils/labels';
import { ALERT_LEVELS } from '@/constants/sensorTypes';
import styles from '../AdminDashboard.module.css';

function deriveStats(sensors) {
  const active = sensors.filter((s) => s.status === 'active' && !s.offline);
  const inAlert = sensors.filter((s) => !s.offline && s.alertLevel !== 'normal');
  const offline = sensors.filter((s) => s.offline);
  return {
    total: sensors.length,
    active: active.length,
    inAlert: inAlert.length,
    offline: offline.length,
  };
}

const EMPTY = { total: 0, active: 0, inAlert: 0, offline: 0 };

export default function SensorsKpi() {
  const { t } = useTranslation();
  const [sensors, setSensors] = useState([]);

  useEffect(() => {
    let cancelled = false;
    listSensors()
      .then((data) => {
        if (!cancelled) setSensors(data);
      })
      .catch(() => {
        if (!cancelled) setSensors([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = sensors.length ? deriveStats(sensors) : EMPTY;
  const inAlert = sensors.filter((s) => !s.offline && s.alertLevel !== 'normal');

  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>{t('admin.dashboard.sensorsKpiTitle')}</h2>
        <Link to={ROUTES.ADMIN_SENSORS} className={styles.panelHint}>
          {t('admin.navSensors')} →
        </Link>
      </header>

      <div className={styles.sensorsKpiGrid}>
        <div className={styles.sensorsKpi}>
          <p className={styles.sensorsKpiValue}>{stats.total}</p>
          <p className={styles.sensorsKpiLabel}>{t('admin.navSensors')}</p>
        </div>
        <div className={`${styles.sensorsKpi} ${styles.sensorsKpi_ok}`}>
          <p className={styles.sensorsKpiValue}>{stats.active}</p>
          <p className={styles.sensorsKpiLabel}>{t('domain.sensorStatus.active')}</p>
        </div>
        <div className={`${styles.sensorsKpi} ${styles.sensorsKpi_alert}`}>
          <p className={styles.sensorsKpiValue}>{stats.inAlert}</p>
          <p className={styles.sensorsKpiLabel}>{t('admin.dashboard.kpiSensorsAlert')}</p>
        </div>
        <div className={`${styles.sensorsKpi} ${styles.sensorsKpi_offline}`}>
          <p className={styles.sensorsKpiValue}>{stats.offline}</p>
          <p className={styles.sensorsKpiLabel}>{t('admin.dashboard.kpiSensorsOffline')}</p>
        </div>
      </div>

      {inAlert.length > 0 && (
        <div className={styles.sensorsAlertList}>
          <p className={styles.sensorsAlertTitle}>{t('admin.dashboard.kpiSensorsAlert')} :</p>
          <ul>
            {inAlert.map((s) => (
              <li key={s.id} className={styles.sensorsAlertItem}>
                <span
                  className={styles.sensorsAlertDot}
                  style={{ background: ALERT_LEVELS[s.alertLevel].color }}
                />
                <span className={styles.sensorsAlertName}>{s.name}</span>
                <span className={styles.sensorsAlertZone}>{zoneName(s.zoneId)}</span>
                <span className={styles.sensorsAlertLevel}>
                  {alertLevelLabel(s.alertLevel)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
