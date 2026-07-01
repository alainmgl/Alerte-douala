import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Container from '@/components/common/Container/Container';
import Logo from '@/components/layout/Header/Logo';
import { ROUTES } from '@/constants/routes';
import styles from './Footer.module.css';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const EMERGENCY = [
    { label: t('footer.emergencyPolice'), number: '117' },
    { label: t('footer.emergencyFire'), number: '118' },
    { label: t('footer.emergencySamu'), number: '119' },
  ];

  return (
    <footer className={styles.footer}>
      <Container size="xl" className={styles.inner}>
        <div className={styles.brandCol}>
          <Logo inverted />
          <p className={styles.tagline}>{t('footer.tagline')}</p>
        </div>

        <nav className={styles.linksCol} aria-label={t('footer.colNavigate')}>
          <p className={styles.colTitle}>{t('footer.colNavigate')}</p>
          <Link to={ROUTES.MAP}>{t('header.navMap')}</Link>
          <Link to={ROUTES.ALERTS}>{t('header.navAlerts')}</Link>
          <Link to={ROUTES.REPORT}>{t('header.navReport')}</Link>
          <Link to={ROUTES.LOGIN}>{t('header.signIn')}</Link>
        </nav>

        <div className={styles.linksCol}>
          <p className={styles.colTitle}>{t('footer.colEmergency')}</p>
          <ul className={styles.emergency}>
            {EMERGENCY.map((e) => (
              <li key={e.number}>
                <span>{e.label}</span>
                <a href={`tel:${e.number}`} className={styles.tel}>
                  {e.number}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.linksCol}>
          <p className={styles.colTitle}>{t('footer.colProject')}</p>
          <p className={styles.about}>{t('footer.projectBlurb')}</p>
        </div>
      </Container>

      <div className={styles.bottom}>
        <Container size="xl" className={styles.bottomInner}>
          <p>{t('footer.copyright', { year })}</p>
          <p className={styles.coords}>4°03'N · 9°46'E</p>
        </Container>
      </div>
    </footer>
  );
}
