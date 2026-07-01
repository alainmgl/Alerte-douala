import { useTranslation } from 'react-i18next';
import AlertCard from '@/components/disasters/AlertCard/AlertCard';
import styles from '../AdminAlerts.module.css';

export default function PendingTab({ items, onValidate, onReject }) {
  const { t } = useTranslation();
  if (!items.length) {
    return (
      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>{t('admin.pending.empty')}</h2>
        </header>
        <div className={styles.empty}>
          <p>{t('admin.alerts.empty')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>{t('admin.pending.title')}</h2>
        <span className={styles.panelHint}>{items.length}</span>
      </header>
      <div className={styles.grid}>
        {items.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            variant="full"
            actions={
              <>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnValidate}`}
                  onClick={() => onValidate(alert)}
                >
                  {t('admin.pending.validate')}
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnReject}`}
                  onClick={() => onReject(alert)}
                >
                  {t('admin.pending.reject')}
                </button>
              </>
            }
          />
        ))}
      </div>
    </section>
  );
}
