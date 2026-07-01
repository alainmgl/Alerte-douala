import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/contexts/ToastContext';
import { disasterLabel, severityInfo, zoneName } from '@/utils/labels';
import { timeSinceISO } from '@/utils/dates';
import { rejectDisaster, validateDisaster } from '@/services/api';
import { SEVERITY_LABEL } from '@/constants/severityLevels';
import styles from '../AdminDashboard.module.css';

export default function PendingQueue({ pending, onChanged }) {
  const { t } = useTranslation();
  const { notify } = useToast();
  const [pendingIds, setPendingIds] = useState(() => new Set());

  async function handle(id, action, title) {
    setPendingIds((curr) => new Set([...curr, id]));
    try {
      if (action === 'validate') {
        await validateDisaster(id);
        notify({ tone: 'success', title: t('notifications.tagDisasterValidated'), body: title });
      } else {
        const reason = window.prompt(t('admin.pending.rejectReasonLabel'), '');
        if (!reason) {
          setPendingIds((curr) => {
            const next = new Set(curr);
            next.delete(id);
            return next;
          });
          return;
        }
        await rejectDisaster(id, reason);
        notify({ tone: 'info', title: t('notifications.tagDisasterRejected'), body: title });
      }
      onChanged?.();
    } catch (err) {
      notify({
        tone: 'danger',
        title: t('errors.generic'),
        body: err?.message || t('errors.generic'),
      });
      setPendingIds((curr) => {
        const next = new Set(curr);
        next.delete(id);
        return next;
      });
    }
  }

  const visible = pending;

  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>{t('admin.dashboard.pendingTitle')}</h2>
        <span className={styles.panelHint}>{visible.length}</span>
      </header>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <p>{t('admin.pending.empty')}</p>
        </div>
      ) : (
        <ul className={styles.queueList}>
          {visible.map((r) => {
            const sev = severityInfo(r.severity);
            const busy = pendingIds.has(r.id);
            return (
              <li key={r.id} className={styles.queueRow}>
                <div className={styles.queueMain}>
                  <div className={styles.queueHead}>
                    <span
                      className={styles.severityPill}
                      style={{ backgroundColor: sev.color }}
                    >
                      {SEVERITY_LABEL[r.severity]}
                    </span>
                    <span className={styles.queueTime}>{timeSinceISO(r.createdAt)}</span>
                  </div>
                  <p className={styles.queueTitle}>{r.title}</p>
                  <p className={styles.queueMeta}>
                    <span>{disasterLabel(r.type)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{zoneName(r.quartierId)}</span>
                  </p>
                </div>
                <div className={styles.queueActions}>
                  <button
                    type="button"
                    onClick={() => handle(r.id, 'validate', r.title)}
                    disabled={busy}
                    className={`${styles.btn} ${styles.btnValidate}`}
                  >
                    {t('admin.pending.validate')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handle(r.id, 'reject', r.title)}
                    disabled={busy}
                    className={`${styles.btn} ${styles.btnReject}`}
                  >
                    {t('admin.pending.reject')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
