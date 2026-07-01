import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import Button from '@/components/common/Button/Button';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/contexts/NotificationsContext';
import { ROUTES } from '@/constants/routes';
import { ADMIN_NAV_ITEMS } from '@/pages/Admin/adminNav';
import { timeSinceISO, formatDateTime } from '@/utils/dates';
import { classNames } from '@/utils/formatters';
import styles from './Notifications.module.css';

const TYPE_TONE = {
  'disaster.validated': 'mangrove',
  'disaster.rejected': 'alert',
  'sensor.critical': 'clay',
};

const TYPE_TKEY = {
  'disaster.validated': 'notifications.tagDisasterValidated',
  'disaster.rejected': 'notifications.tagDisasterRejected',
  'sensor.critical': 'notifications.tagSensorCritical',
};

export default function Notifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { items, unreadCount, connected, loading, markRead, markAllRead, refresh } =
    useNotifications();

  const USER_NAV_ITEMS = [
    { to: ROUTES.DASHBOARD, label: t('dashboard.navHome'), icon: '◆', end: true },
    { to: ROUTES.ALERTS, label: t('dashboard.navAlerts'), icon: '!' },
    { to: ROUTES.MAP, label: t('dashboard.navMap'), icon: '◉' },
    { to: ROUTES.REPORT, label: t('dashboard.navReport'), icon: '+' },
    { to: ROUTES.PROFILE, label: t('dashboard.navProfile'), icon: '·' },
  ];

  async function handleClick(notif) {
    if (!notif.readAt) await markRead(notif.id);
    if (notif.link) navigate(notif.link);
  }

  return (
    <DashboardLayout
      navItems={isAdmin ? ADMIN_NAV_ITEMS : USER_NAV_ITEMS}
      eyebrow={t('notifications.eyebrow')}
      title={t('notifications.title')}
      tone={isAdmin ? 'admin' : 'user'}
    >
      <section className={styles.intro}>
        <div>
          <p className={styles.lead}>{t('notifications.lead')}</p>
          <p className={styles.status}>
            {connected ? (
              <>
                <span className={styles.dot} aria-hidden="true" />
                {t('notifications.statusRealtime', { count: unreadCount })}
              </>
            ) : (
              <>{t('notifications.statusOffline')}</>
            )}
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            {t('notifications.refresh')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => markAllRead()}
            disabled={unreadCount === 0}
          >
            {t('notifications.markAllRead')}
          </Button>
        </div>
      </section>

      {loading && items.length === 0 ? (
        <p className={styles.muted}>{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{t('notifications.emptyTitle')}</p>
          <p className={styles.emptyBody}>{t('notifications.emptyBody')}</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((n) => (
            <li
              key={n.id}
              className={classNames(styles.item, !n.readAt && styles.itemUnread)}
            >
              <button
                type="button"
                className={styles.itemButton}
                onClick={() => handleClick(n)}
              >
                <span
                  className={classNames(
                    styles.tag,
                    styles[`tag_${TYPE_TONE[n.type] || 'ink'}`],
                  )}
                >
                  {TYPE_TKEY[n.type] ? t(TYPE_TKEY[n.type]) : t('notifications.tagDefault')}
                </span>
                <span className={styles.titleLine}>{n.title}</span>
                <span className={styles.bodyLine}>{n.body}</span>
                <span className={styles.timeLine} title={formatDateTime(n.createdAt)}>
                  {timeSinceISO(n.createdAt)}
                  {n.readAt ? t('notifications.readMark') : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}
