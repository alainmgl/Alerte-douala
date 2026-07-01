import { useTranslation } from 'react-i18next';
import Badge from '@/components/common/Badge/Badge';
import styles from '../AdminDashboard.module.css';

function formatDate(value, lng) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    const locale = lng === 'en' ? 'en-US' : 'fr-FR';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}

export default function UsersOverview({ users }) {
  const { t, i18n } = useTranslation();
  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>{t('admin.dashboard.usersTitle')}</h2>
        <span className={styles.panelHint}>{users.length}</span>
      </header>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('admin.users.tableName')}</th>
              <th>{t('admin.users.tableEmail')}</th>
              <th>{t('admin.users.tableRole')}</th>
              <th className={styles.cellNum}>{t('admin.users.tableReports')}</th>
              <th>{t('admin.users.tableJoined')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid}>
                <td className={styles.cellStrong}>{u.displayName || '—'}</td>
                <td>
                  <code className={styles.code}>{u.email}</code>
                </td>
                <td>
                  <Badge tone={u.role === 'admin' ? 'clay' : 'neutral'} dot>
                    {u.role === 'admin' ? t('profile.roleAdmin') : t('profile.roleUser')}
                  </Badge>
                </td>
                <td className={styles.cellNum}>{u.reportsCount ?? 0}</td>
                <td className={styles.cellMuted}>{formatDate(u.createdAt, i18n.language)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
