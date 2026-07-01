import { useTranslation } from 'react-i18next';
import styles from '../AdminAlerts.module.css';

export default function AlertsKpisAdmin({ kpis }) {
  const { t } = useTranslation();
  return (
    <section className={styles.kpiGrid}>
      <div className={`${styles.kpi} ${styles.kpi_pending}`}>
        <p className={styles.kpiValue}>{kpis.pending}</p>
        <p className={styles.kpiLabel}>{t('admin.alerts.tabPending')}</p>
      </div>
      <div className={`${styles.kpi} ${styles.kpi_validated}`}>
        <p className={styles.kpiValue}>{kpis.validatedToday}</p>
        <p className={styles.kpiLabel}>{t('admin.dashboard.kpiValidatedToday')}</p>
      </div>
      <div className={`${styles.kpi} ${styles.kpi_sensors}`}>
        <p className={styles.kpiValue}>{kpis.sensorsLive}</p>
        <p className={styles.kpiLabel}>{t('admin.alerts.kpiSensorsLive')}</p>
      </div>
      <div className={`${styles.kpi} ${styles.kpi_critical}`}>
        <p className={styles.kpiValue}>{kpis.critical}</p>
        <p className={styles.kpiLabel}>{t('admin.alerts.kpiCritical')}</p>
      </div>
    </section>
  );
}
