import { useTranslation } from 'react-i18next';
import AlertCard from '@/components/disasters/AlertCard/AlertCard';
import styles from '../AdminPending.module.css';

export default function PendingList({
  items,
  totalPending,
  onValidate,
  onReject,
  onOpenDetail,
}) {
  const { t } = useTranslation();
  if (totalPending === 0) {
    return (
      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>{t('admin.pending.empty')}</h2>
        </header>
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{t('admin.pending.empty')}</p>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>{t('alertsFeed.empty')}</h2>
          <span className={styles.panelHint}>{totalPending}</span>
        </header>
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{t('alertsFeed.empty')}</p>
          <p className={styles.emptyHint}>{t('alertsFeed.emptyHint')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>{t('admin.pending.title')}</h2>
        <span className={styles.panelHint}>
          {items.length}
          {items.length !== totalPending ? ` / ${totalPending}` : ''}
        </span>
      </header>
      <div className={styles.grid}>
        {items.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            variant="full"
            onClick={() => onOpenDetail(alert)}
            actions={
              <>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnValidate}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onValidate(alert);
                  }}
                >
                  {t('admin.pending.validate')}
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnReject}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject(alert);
                  }}
                >
                  {t('admin.pending.reject')}
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnDetail}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetail(alert);
                  }}
                >
                  {t('admin.pending.openDetail')}
                </button>
              </>
            }
          />
        ))}
      </div>
    </section>
  );
}
