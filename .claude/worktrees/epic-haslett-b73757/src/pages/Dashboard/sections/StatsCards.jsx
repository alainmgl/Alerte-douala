import { useTranslation } from 'react-i18next';
import styles from '../Dashboard.module.css';

export default function StatsCards({ stats }) {
  const { t } = useTranslation();
  const items = [
    { label: t('dashboard.statsTotal'), value: stats.total, tone: 'ink' },
    { label: t('dashboard.statsPending'), value: stats.pending, tone: 'pending' },
    { label: t('dashboard.statsValidated'), value: stats.validated, tone: 'validated' },
  ];
  return (
    <section className={styles.statsGrid} aria-label={t('dashboard.statsTotal')}>
      {items.map((it) => (
        <article key={it.label} className={`${styles.statCard} ${styles[`stat_${it.tone}`]}`}>
          <p className={styles.statValue}>{it.value}</p>
          <p className={styles.statLabel}>{it.label}</p>
        </article>
      ))}
    </section>
  );
}
