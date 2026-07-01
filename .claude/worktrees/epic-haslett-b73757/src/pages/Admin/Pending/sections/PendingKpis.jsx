import { useTranslation } from 'react-i18next';
import styles from '../AdminPending.module.css';

export default function PendingKpis({ kpis }) {
  const { t } = useTranslation();
  return (
    <section className={styles.kpiGrid}>
      <div className={`${styles.kpi} ${styles.kpi_pending}`}>
        <p className={styles.kpiValue}>{kpis.pending}</p>
        <p className={styles.kpiLabel}>{t('admin.pending.kpiPending')}</p>
      </div>
      <div className={`${styles.kpi} ${styles.kpi_critical}`}>
        <p className={styles.kpiValue}>{kpis.critical}</p>
        <p className={styles.kpiLabel}>{t('admin.pending.kpiCritical')}</p>
      </div>
      <div className={`${styles.kpi} ${styles.kpi_recent}`}>
        <p className={styles.kpiValue}>{kpis.last24h}</p>
        <p className={styles.kpiLabel}>{t('admin.alerts.kpiToday')}</p>
      </div>
      <div className={`${styles.kpi} ${styles.kpi_oldest}`}>
        <p className={styles.kpiValue}>{kpis.oldestDays}</p>
        <p className={styles.kpiLabel}>{t('admin.pending.kpiUnique')}</p>
      </div>
    </section>
  );
}
