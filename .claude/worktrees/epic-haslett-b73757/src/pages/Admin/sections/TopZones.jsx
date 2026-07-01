import { useTranslation } from 'react-i18next';
import { zoneName } from '@/utils/labels';
import styles from '../AdminDashboard.module.css';

export default function TopZones({ zones }) {
  const { t } = useTranslation();
  if (!zones || zones.length === 0) {
    return (
      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>{t('admin.dashboard.topZonesTitle')}</h2>
        </header>
        <div className={styles.empty}>
          <p>{t('admin.pending.empty')}</p>
        </div>
      </section>
    );
  }
  const max = Math.max(...zones.map((z) => z.count), 1);
  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>{t('admin.dashboard.topZonesTitle')}</h2>
        <span className={styles.panelHint}>{t('admin.dashboard.topZonesHint')}</span>
      </header>
      <ul className={styles.barList}>
        {zones.map((z) => {
          const pct = Math.round((z.count / max) * 100);
          return (
            <li key={z.quartierId} className={styles.barRow}>
              <div className={styles.barHead}>
                <span className={styles.barLabel}>{zoneName(z.quartierId)}</span>
                <span className={styles.barCount}>{z.count}</span>
              </div>
              <div className={styles.barTrack} aria-hidden="true">
                <div className={styles.barFill} style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
