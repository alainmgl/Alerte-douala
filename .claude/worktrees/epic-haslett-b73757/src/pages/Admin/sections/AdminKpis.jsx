import { useTranslation } from 'react-i18next';
import styles from '../AdminDashboard.module.css';

export default function AdminKpis({ stats }) {
  const { t } = useTranslation();
  const items = [
    { label: t('dashboard.statsTotal'), value: stats.totalReports, tone: 'ink' },
    { label: t('admin.dashboard.kpiPending'), value: stats.pending, tone: 'pending' },
    { label: t('admin.dashboard.kpiValidatedToday'), value: stats.validatedToday, tone: 'validated' },
    { label: t('admin.dashboard.kpiUsers'), value: stats.users, tone: 'clay' },
  ];
  return (
    <section className={styles.kpiGrid} aria-label={t('admin.dashboard.title')}>
      {items.map((it) => (
        <article key={it.label} className={`${styles.kpi} ${styles[`kpi_${it.tone}`]}`}>
          <p className={styles.kpiValue}>{it.value}</p>
          <p className={styles.kpiLabel}>{it.label}</p>
        </article>
      ))}
    </section>
  );
}
