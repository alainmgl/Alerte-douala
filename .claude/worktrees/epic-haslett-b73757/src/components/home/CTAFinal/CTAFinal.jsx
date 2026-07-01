import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Container from '@/components/common/Container/Container';
import Button from '@/components/common/Button/Button';
import { ROUTES } from '@/constants/routes';
import styles from './CTAFinal.module.css';

export default function CTAFinal() {
  const { t } = useTranslation();
  return (
    <section className={`${styles.section} section`} aria-labelledby="cta-title">
      <Container size="lg">
        <motion.div
          className={styles.box}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className={styles.eyebrow}>{t('home.ctaFinal.eyebrow')}</p>
          <h2 id="cta-title" className={styles.title}>
            {t('home.ctaFinal.title')}
          </h2>
          <p className={styles.lede}>{t('home.ctaFinal.body')}</p>
          <div className={styles.actions}>
            <Button as="link" to={ROUTES.REGISTER} variant="paper" size="lg">
              {t('home.ctaFinal.ctaPrimary')}
            </Button>
            <Button as="link" to={ROUTES.REPORT} variant="ghost" size="lg" className={styles.ghostInverted}>
              {t('home.ctaFinal.ctaSecondary')}
            </Button>
          </div>
        </motion.div>
      </Container>

      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.marqueeRow}>
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className={styles.marqueeItem}>
              ALERTE DOUALA <span className={styles.marqueeTri}>▲</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
