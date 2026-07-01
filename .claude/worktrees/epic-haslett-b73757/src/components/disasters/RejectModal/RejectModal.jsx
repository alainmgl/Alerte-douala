import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/common/Modal/Modal';
import Button from '@/components/common/Button/Button';
import styles from './RejectModal.module.css';

export default function RejectModal({ open, alert, onClose, onConfirm }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason('');
      setTouched(false);
    }
  }, [open]);

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    const trimmed = reason.trim();
    if (trimmed.length < 3) return;
    onConfirm(trimmed);
  }

  return (
    <Modal open={open} onClose={onClose} title={t('admin.pending.rejectTitle')} size="sm">
      <form onSubmit={handleSubmit} className={styles.form}>
        {alert && (
          <div className={styles.context}>
            <strong className={styles.contextTitle}>{alert.title}</strong>
            <span className={styles.contextSub}>#{alert.id}</span>
          </div>
        )}
        <label className={styles.label} htmlFor="reject-reason">
          {t('admin.pending.rejectReasonLabel')}
        </label>
        <textarea
          id="reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className={styles.textarea}
          placeholder={t('admin.pending.rejectReasonPlaceholder')}
        />
        {touched && reason.trim().length < 3 && (
          <p className={styles.error}>{t('admin.pending.rejectReasonLabel')}</p>
        )}
        <div className={styles.actions}>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="clay">
            {t('admin.pending.rejectConfirm')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
