import { useTranslation } from 'react-i18next';
import styles from '../UserAlerts.module.css';

export default function AlertsKpis({ kpis }) {
  const { t } = useTranslation();
  return (
    <section className={styles.kpiGrid}>
      <div className={styles.kpi}>
        <p className={styles.kpiValue}>{kpis.active}</p>
        <p className={styles.kpiLabel}>{t('alerts.kpiActive')}</p>
      </div>
      <div className={`${styles.kpi} ${styles.kpi_critical}`}>
        <p className={styles.kpiValue}>{kpis.critical}</p>
        <p className={styles.kpiLabel}>{t('alerts.kpiCritical')}</p>
      </div>
      <div className={`${styles.kpi} ${styles.kpi_sensors}`}>
        <p className={styles.kpiValue}>{kpis.sensorsLive}</p>
        <p className={styles.kpiLabel}>{t('alerts.kpiSensorsLive')}</p>
      </div>
      <div className={`${styles.kpi} ${styles.kpi_zones}`}>
        <p className={styles.kpiValue}>{kpis.zones}</p>
        <p className={styles.kpiLabel}>{t('alerts.kpiZones')}</p>
      </div>
    </section>
  );
}
