import { useEffect, useMemo, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Container from '@/components/common/Container/Container';
import Button from '@/components/common/Button/Button';
import NotificationsBell from '@/components/notifications/NotificationsBell/NotificationsBell';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { signOut } from '@/services/auth';
import Logo from './Logo';
import styles from './Header.module.css';

export default function Header() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const NAV_ITEMS = useMemo(
    () => [
      { to: ROUTES.MAP, label: t('header.navMap') },
      { to: ROUTES.ALERTS, label: t('header.navAlerts') },
      { to: ROUTES.REPORT, label: t('header.navReport') },
    ],
    [t],
  );

  const dashboardTo = isAdmin ? ROUTES.ADMIN : ROUTES.DASHBOARD;

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleSignOut() {
    setMobileOpen(false);
    await signOut();
    notify({ tone: 'info', title: t('header.signOut'), body: 'À bientôt.' });
    navigate(ROUTES.HOME, { replace: true });
  }

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <Container size="xl" className={styles.bar}>
        <Logo />

        <nav className={styles.nav} aria-label={t('header.ariaPrimary')}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.linkActive : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          {user ? (
            <>
              <NotificationsBell />
              <Button as="link" to={dashboardTo} variant="outline" size="sm">
                {isAdmin ? t('header.adminConsole') : t('header.myDashboard')}
              </Button>
              <button
                type="button"
                onClick={handleSignOut}
                className={styles.link}
              >
                {t('header.signOut')}
              </button>
            </>
          ) : (
            <>
              <Link to={ROUTES.LOGIN} className={styles.link}>
                {t('header.signIn')}
              </Link>
              <Button as="link" to={ROUTES.REGISTER} variant="primary" size="sm">
                {t('header.signUp')}
              </Button>
            </>
          )}
        </div>

        <button
          className={styles.burger}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={t('header.openMenu')}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </Container>

      {mobileOpen && (
        <div id="mobile-menu" className={styles.mobile}>
          <nav className={styles.mobileNav}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={styles.mobileLink}
              >
                {item.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink
                  to={dashboardTo}
                  onClick={() => setMobileOpen(false)}
                  className={styles.mobileLink}
                >
                  {isAdmin ? t('header.adminConsole') : t('header.myDashboard')}
                </NavLink>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={styles.mobileLink}
                  style={{ textAlign: 'left', width: '100%', background: 'transparent' }}
                >
                  {t('header.signOut')}
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to={ROUTES.LOGIN}
                  onClick={() => setMobileOpen(false)}
                  className={styles.mobileLink}
                >
                  {t('header.signIn')}
                </NavLink>
                <NavLink
                  to={ROUTES.REGISTER}
                  onClick={() => setMobileOpen(false)}
                  className={`${styles.mobileLink} ${styles.mobileLinkPrimary}`}
                >
                  {t('header.signUp')}
                </NavLink>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
