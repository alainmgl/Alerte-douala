import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Container from '@/components/common/Container/Container';
import { getPublicStats } from '@/services/api';
import styles from './ProblemStats.module.css';

const STAT_KEYS = {
  floodIncrease: { tKey: 'stat1', format: (s) => `+${s.value}${s.unit || '%'}` },
  highRiskZones: { tKey: 'stat2', format: (s) => `${s.value}` },
  exposedInhabitants: { tKey: 'stat3', format: (s) => `${Math.round(s.value / 1000)}K${s.unit || '+'}` },
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
};

export default function ProblemStats() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPublicStats()
      .then((stats) => {
        if (!cancelled) setData(stats);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = data
    ? Object.entries(STAT_KEYS)
        .filter(([key]) => data[key])
        .map(([key, meta]) => ({
          key,
          value: meta.format(data[key]),
          label: t(`home.problem.${meta.tKey}Title`),
          detail: t(`home.problem.${meta.tKey}Body`),
        }))
    : [];

  return (
    <section className={`${styles.section} section`} aria-labelledby="problem-title">
      <Container size="xl">
        <div className="section-eyebrow">
          <span className="section-eyebrow__num">01</span>
          <span className="section-eyebrow__label">{t('home.problem.eyebrow')}</span>
        </div>

        <motion.h2
          id="problem-title"
          className={styles.title}
          {...fadeUp}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {t('home.problem.title1')}<em>{t('home.problem.titleEm')}</em>{t('home.problem.title2')}
        </motion.h2>

        <p className={styles.lede}>{t('home.problem.lead')}</p>

        {items.length > 0 && (
          <ul className={styles.grid}>
            {items.map((stat, i) => (
              <motion.li
                key={stat.key}
                className={styles.card}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <span className={styles.value}>{stat.value}</span>
                <p className={styles.label}>{stat.label}</p>
                <p className={styles.detail}>{stat.detail}</p>
              </motion.li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
