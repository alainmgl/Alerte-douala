import { useTranslation } from 'react-i18next';
import Modal from '@/components/common/Modal/Modal';
import { disasterLabel, severityInfo, zoneName } from '@/utils/labels';
import { formatDateTime, timeSinceISO } from '@/utils/dates';
import { SEVERITY_LABEL } from '@/constants/severityLevels';
import styles from '../AdminPending.module.css';

export default function PendingDetailModal({ alert, onClose, onValidate, onReject }) {
  const { t } = useTranslation();
  const open = Boolean(alert);
  if (!open) {
    return <Modal open={false} onClose={onClose} title="" size="lg" />;
  }

  const sev = severityInfo(alert.severity);

  return (
    <Modal open={open} onClose={onClose} title={alert.title} size="lg">
      <div>
        <div className={styles.detailHead}>
          <span
            className={styles.detailSeverity}
            style={{ backgroundColor: sev.color }}
          >
            {SEVERITY_LABEL[alert.severity] ?? sev.label}
          </span>
          <span className={styles.detailTime}>
            {timeSinceISO(alert.createdAt)} · {formatDateTime(alert.createdAt)}
          </span>
        </div>

        <div className={styles.detailMetaGrid}>
          <div className={styles.detailMetaItem}>
            <span className={styles.detailMetaLabel}>{t('admin.pending.detail.type')}</span>
            <span className={styles.detailMetaValue}>{disasterLabel(alert.type)}</span>
          </div>
          <div className={styles.detailMetaItem}>
            <span className={styles.detailMetaLabel}>{t('admin.pending.detail.zone')}</span>
            <span className={styles.detailMetaValue}>{zoneName(alert.quartierId)}</span>
          </div>
          <div className={styles.detailMetaItem}>
            <span className={styles.detailMetaLabel}>{t('admin.pending.detail.reporter')}</span>
            <span className={styles.detailMetaValue}>{alert.reporterName ?? '—'}</span>
          </div>
          <div className={styles.detailMetaItem}>
            <span className={styles.detailMetaLabel}>ID</span>
            <span className={styles.detailMetaValue}>#{alert.id}</span>
          </div>
          {alert.address && (
            <div className={styles.detailMetaItem}>
              <span className={styles.detailMetaLabel}>{t('admin.pending.detail.address')}</span>
              <span className={styles.detailMetaValue}>{alert.address}</span>
            </div>
          )}
        </div>

        {alert.description ? (
          <p className={styles.detailDescription}>{alert.description}</p>
        ) : null}

        {alert.photoDataUrl && (
          <div className={styles.detailImages}>
            <img
              src={alert.photoDataUrl}
              alt={alert.title}
              className={styles.detailImage}
              loading="lazy"
            />
          </div>
        )}

        <div className={styles.detailFooter}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnDetail}`}
            onClick={onClose}
          >
            {t('common.close')}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnReject}`}
            onClick={() => onReject(alert)}
          >
            {t('admin.pending.reject')}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnValidate}`}
            onClick={() => onValidate(alert)}
          >
            {t('admin.pending.validate')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
