import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Container from '@/components/common/Container/Container';
import styles from './Testimonials.module.css';

const QUOTE_KEYS = ['1', '2', '3'];
const COUNTER_KEYS = ['1', '2', '3', '4'];

export default function Testimonials() {
  const { t } = useTranslation();

  const QUOTES = QUOTE_KEYS.map((k) => {
    const author = t(`home.testimonials.q${k}Author`);
    return {
      body: t(`home.testimonials.q${k}Body`),
      author,
      role: t(`home.testimonials.q${k}Role`),
      initials: author.split(/\s+/).map((s) => s[0]).join(''),
    };
  });

  const COUNTERS = COUNTER_KEYS.map((k) => ({
    value: t(`home.testimonials.counter${k}Value`),
    label: t(`home.testimonials.counter${k}Label`),
  }));

  return (
    <section className={`${styles.section} section`} aria-labelledby="testi-title">
      <Container size="xl">
        <div className="section-eyebrow">
          <span className="section-eyebrow__num">05</span>
          <span className="section-eyebrow__label">{t('home.testimonials.eyebrow')}</span>
        </div>

        <h2 id="testi-title" className={styles.title}>
          {t('home.testimonials.title1')}<em>{t('home.testimonials.titleEm')}</em>{t('home.testimonials.title2')}
        </h2>

        <ul className={styles.quotes}>
          {QUOTES.map((q, i) => (
            <motion.li
              key={q.author}
              className={styles.quote}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{
                duration: 0.65,
                delay: i * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span className={styles.mark} aria-hidden="true">
                «
              </span>
              <blockquote className={styles.body}>{q.body}</blockquote>
              <footer className={styles.who}>
                <span className={styles.avatar} aria-hidden="true">
                  {q.initials}
                </span>
                <div>
                  <p className={styles.author}>{q.author}</p>
                  <p className={styles.role}>{q.role}</p>
                </div>
              </footer>
            </motion.li>
          ))}
        </ul>

        <ul className={styles.counters}>
          {COUNTERS.map((c) => (
            <li key={c.label}>
              <span className={styles.counterValue}>{c.value}</span>
              <span className={styles.counterLabel}>{c.label}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
