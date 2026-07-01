import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SensorCard from '@/components/sensors/SensorCard/SensorCard';
import Spinner from '@/components/common/Spinner/Spinner';
import { ROUTES } from '@/constants/routes';
import { listSensors } from '@/services/api';
import styles from '../Dashboard.module.css';

export default function SensorsPanel() {
  const { t } = useTranslation();
  const [sensors, setSensors] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listSensors()
      .then((data) => {
        if (!cancelled) setSensors(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (sensors == null) {
    return (
      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>{t('dashboard.sensorsTitle')}</h2>
        </header>
        <div className={styles.empty}>
          {error ? (
            <p>{t('dashboard.errorBody')}</p>
          ) : (
            <span className={styles.requesting}>
              <Spinner size={18} /> {t('common.loading')}
            </span>
          )}
        </div>
      </section>
    );
  }

  const inAlert = sensors.filter((s) => !s.offline && s.alertLevel !== 'normal');
  const sample = (inAlert.length ? inAlert : sensors).slice(0, 3);

  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <h2 className={styles.panelTitle}>{t('dashboard.sensorsTitle')}</h2>
        <Link to={ROUTES.MAP} className={styles.panelHint}>
          {t('dashboard.sensorsCta')}
        </Link>
      </header>
      {sample.length === 0 ? (
        <div className={styles.empty}>
          <p>{t('admin.sensors.empty')}</p>
        </div>
      ) : (
        <div className={styles.sensorsGrid}>
          {sample.map((s) => (
            <SensorCard key={s.id} sensor={s} />
          ))}
        </div>
      )}
    </section>
  );
}
