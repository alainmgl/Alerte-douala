import { useTranslation } from 'react-i18next';
import { timeSinceISO } from '@/utils/dates';
import styles from '../AdminDashboard.module.css';

const ACTION_TKEY = {
  validate: 'admin.activity.actionValidate',
  reject: 'admin.activity.actionReject',
  auto_validate: 'admin.activity.actionAutoValidate',
  delete: 'admin.activity.actionDelete',
  create_sensor: 'admin.activity.actionCreateSensor',
  update_sensor: 'admin.activity.actionUpdateSensor',
  delete_sensor: 'admin.activity.actionDeleteSensor',
};

export default function RecentActivity({ activity }) {
  const { t } = useTranslation();
  if (!activity || activity.length === 0) {
    return (
      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>{t('admin.dashboard.activityTitle')}</h2>
        </header>
        <div className={styles.empty}>
          <p>{t('admin.pending.empty')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>{t('admin.dashboard.activityTitle')}</h2>
        <span className={styles.panelHint}>{t('admin.dashboard.activityHint')}</span>
      </header>
      <ol className={styles.timeline}>
        {activity.map((it) => {
          const actionLabel = ACTION_TKEY[it.action] ? t(ACTION_TKEY[it.action]) : it.action;
          return (
            <li key={it.id} className={styles.timelineRow}>
              <span className={styles.timelineDot} aria-hidden="true" />
              <div className={styles.timelineBody}>
                <p className={styles.timelineMain}>
                  <strong>{it.actorName || it.actorUid}</strong> · {actionLabel}
                  {it.targetTitle && (
                    <span className={styles.timelineTarget}> « {it.targetTitle} »</span>
                  )}
                </p>
                <p className={styles.timelineMeta}>{timeSinceISO(it.createdAt)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
