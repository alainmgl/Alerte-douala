import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '@/contexts/NotificationsContext';
import { ROUTES } from '@/constants/routes';
import { timeSinceISO } from '@/utils/dates';
import { classNames } from '@/utils/formatters';
import styles from './NotificationsBell.module.css';

const TYPE_TKEY_SHORT = {
  'disaster.validated': 'notifications.tagDisasterValidated',
  'disaster.rejected': 'notifications.tagDisasterRejected',
  'sensor.critical': 'notifications.tagSensorCritical',
};

export default function NotificationsBell({ tone = 'light' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, unreadCount, connected, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onDoc(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const recent = items.slice(0, 6);

  async function handleItemClick(notif) {
    if (!notif.readAt) await markRead(notif.id);
    setOpen(false);
    if (notif.link) navigate(notif.link);
  }

  return (
    <div className={classNames(styles.root, styles[`tone_${tone}`])} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={
          unreadCount > 0
            ? t('notifications.bell.ariaLabelCount', { count: unreadCount })
            : t('notifications.bell.ariaLabel')
        }
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label={t('notifications.bell.panelTitle')}>
          <header className={styles.panelHead}>
            <div>
              <p className={styles.title}>{t('notifications.bell.panelTitle')}</p>
              <p className={styles.subtitle}>
                {connected ? (
                  <>
                    <span className={styles.dot} aria-hidden="true" />{' '}
                    {t('notifications.bell.statusRealtime')}
                  </>
                ) : (
                  t('notifications.bell.statusOffline')
                )}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.markAll}
                onClick={() => markAllRead()}
              >
                {t('notifications.bell.markAll')}
              </button>
            )}
          </header>

          {recent.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>{t('notifications.bell.emptyTitle')}</p>
              <p className={styles.emptyBody}>{t('notifications.bell.emptyBody')}</p>
            </div>
          ) : (
            <ul className={styles.list}>
              {recent.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={classNames(styles.item, !n.readAt && styles.itemUnread)}
                    onClick={() => handleItemClick(n)}
                  >
                    <span className={styles.itemTag}>
                      {TYPE_TKEY_SHORT[n.type] ? t(TYPE_TKEY_SHORT[n.type]) : t('notifications.tagDefault')}
                    </span>
                    <span className={styles.itemTitle}>{n.title}</span>
                    <span className={styles.itemBody}>{n.body}</span>
                    <span className={styles.itemTime}>{timeSinceISO(n.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <footer className={styles.panelFoot}>
            <button
              type="button"
              className={styles.seeAll}
              onClick={() => {
                setOpen(false);
                navigate(ROUTES.NOTIFICATIONS);
              }}
            >
              {t('notifications.bell.seeAll')}
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}
