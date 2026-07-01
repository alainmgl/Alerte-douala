import { useTranslation } from 'react-i18next';
import AlertCard from '@/components/disasters/AlertCard/AlertCard';
import styles from '../UserAlerts.module.css';

export default function AlertsFeed({ feed, hasFilters }) {
  const { t } = useTranslation();

  if (!feed.length) {
    return (
      <section className={styles.feedPanel}>
        <header className={styles.feedHead}>
          <h2 className={styles.feedTitle}>{t('alertsFeed.empty')}</h2>
        </header>
        <div className={styles.empty}>
          <p>
            {hasFilters ? t('alertsFeed.empty') : t('alerts.title')}
          </p>
          <p className={styles.emptyHint}>
            {hasFilters ? t('alertsFeed.emptyHint') : ''}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.feedPanel}>
      <header className={styles.feedHead}>
        <h2 className={styles.feedTitle}>{t('alerts.title')}</h2>
        <span className={styles.feedCount}>{feed.length}</span>
      </header>
      <div className={styles.grid}>
        {feed.map((alert) => (
          <AlertCard key={alert.id} alert={alert} variant="compact" />
        ))}
      </div>
    </section>
  );
}
