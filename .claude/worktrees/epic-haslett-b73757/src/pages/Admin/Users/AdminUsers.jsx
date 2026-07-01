import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import Spinner from '@/components/common/Spinner/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import {
  listUsers,
  createUserByAdmin,
  deleteUser,
} from '@/services/auth';
import { isEmail, isStrongPassword } from '@/utils/validators';
import { authErrorMessage } from '@/pages/Auth/firebaseAuthErrors';
import { useAdminNavItems } from '../adminNav';
import styles from './AdminUsers.module.css';

export default function AdminUsers() {
  const { t } = useTranslation();
  const navItems = useAdminNavItems();
  const { profile } = useAuth();
  const { notify } = useToast();

  const ROLE_FILTERS = [
    { value: 'all', label: t('admin.users.filterAll') },
    { value: 'admin', label: t('admin.users.roleAdmin') },
    { value: 'user', label: t('admin.users.roleUser') },
  ];
  const firstName = (profile?.displayName || 'admin').split(/\s+/)[0];

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pendingDelete, setPendingDelete] = useState(null);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listUsers();
      setUsers(list);
    } catch (err) {
      notify({
        tone: 'error',
        title: t('errors.generic'),
        body: authErrorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    if (filter === 'all') return users;
    return users.filter((u) => u.role === filter);
  }, [users, filter]);

  const adminCount = useMemo(() => users.filter((u) => u.role === 'admin').length, [users]);

  function resetForm() {
    setDisplayName('');
    setEmail('');
    setPassword('');
    setConfirm('');
    setFormErrors({});
    setFormError('');
  }

  function validate() {
    const next = {};
    if (displayName.trim().length < 2) {
      next.displayName = t('auth.register.errorName');
    }
    if (!isEmail(email)) next.email = t('auth.register.errorEmail');
    if (!isStrongPassword(password)) {
      next.password = t('auth.register.errorPassword');
    }
    if (password !== confirm) {
      next.confirm = t('auth.register.errorConfirm');
    }
    setFormErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onCreateAdmin(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const newUser = await createUserByAdmin({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        role: 'admin',
      });
      notify({
        tone: 'success',
        title: t('admin.users.form.createdToast'),
        body: newUser.displayName,
      });
      resetForm();
      await refresh();
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteUser(target.uid);
      notify({
        tone: 'success',
        title: t('admin.users.form.deletedToast'),
        body: target.displayName,
      });
      await refresh();
    } catch (err) {
      notify({
        tone: 'error',
        title: t('errors.generic'),
        body: authErrorMessage(err),
      });
    }
  }

  return (
    <DashboardLayout
      navItems={navItems}
      eyebrow={t('admin.users.eyebrow')}
      title={t('admin.users.title')}
      tone="admin"
    >
      <section className={styles.intro}>
        <p className={styles.lead}>{t('admin.users.lead')}</p>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHead}>
          <p className={styles.eyebrow}>{t('admin.users.form.createTitle')}</p>
          <h2 className={styles.cardTitle}>{t('admin.users.addNew')}</h2>
        </header>

        <form className={styles.form} onSubmit={onCreateAdmin} noValidate>
          {formError && (
            <div className={styles.formError} role="alert">
              {formError}
            </div>
          )}
          <div className={styles.formRow}>
            <Input
              label={t('admin.users.form.name')}
              type="text"
              placeholder={t('auth.register.namePlaceholder')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={formErrors.displayName}
              required
              disabled={submitting}
            />
            <Input
              label={t('admin.users.form.email')}
              type="email"
              inputMode="email"
              placeholder={t('auth.login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={formErrors.email}
              required
              disabled={submitting}
            />
          </div>
          <div className={styles.formRow}>
            <Input
              label={t('admin.users.form.password')}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={formErrors.password}
              hint={t('auth.register.passwordHint')}
              required
              disabled={submitting}
            />
            <Input
              label={t('auth.register.confirmLabel')}
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={formErrors.confirm}
              required
              disabled={submitting}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={submitting}
            className={styles.submit}
          >
            {submitting ? (
              <>
                <Spinner size={16} label="" /> {t('auth.register.submitting')}
              </>
            ) : (
              <>{t('admin.users.form.submit')} →</>
            )}
          </Button>
        </form>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHead}>
          <p className={styles.eyebrow}>{t('admin.users.eyebrow')}</p>
          <h2 className={styles.cardTitle}>
            {loading ? t('common.loading') : `${users.length}`}
          </h2>
          <div className={styles.filters}>
            {ROLE_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`${styles.filterBtn} ${filter === f.value ? styles.filterBtnActive : ''}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className={styles.loader}>
            <Spinner size={28} label={t('common.loading')} />
          </div>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>{t('admin.pending.empty')}</p>
        ) : (
          <ul className={styles.list}>
            {filtered.map((u) => {
              const isSelf = u.uid === profile?.uid;
              const isLastAdmin = u.role === 'admin' && adminCount <= 1;
              const cannotDelete = isSelf || isLastAdmin;
              return (
                <li key={u.uid} className={styles.row}>
                  <div className={styles.identity}>
                    <span className={styles.avatar}>
                      {u.displayName?.slice(0, 2).toUpperCase() || '??'}
                    </span>
                    <div>
                      <p className={styles.name}>{u.displayName}</p>
                      <p className={styles.email}>{u.email}</p>
                    </div>
                  </div>
                  <span
                    className={`${styles.badge} ${
                      u.role === 'admin' ? styles.badgeAdmin : styles.badgeUser
                    }`}
                  >
                    {u.role === 'admin' ? t('profile.roleAdmin') : t('profile.roleUser')}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingDelete(u)}
                    disabled={cannotDelete}
                    title={t('admin.sensors.delete')}
                  >
                    {t('admin.sensors.delete')}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {pendingDelete && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>{t('admin.users.deleteConfirm')}</h3>
            <p className={styles.modalBody}>
              <strong>{pendingDelete.displayName}</strong> ({pendingDelete.email})
            </p>
            <div className={styles.modalActions}>
              <Button variant="ghost" size="md" onClick={() => setPendingDelete(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" size="md" onClick={confirmDelete}>
                {t('admin.sensors.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
