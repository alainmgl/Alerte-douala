import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { ALERT_LEVELS, SENSOR_STATUSES, SENSOR_TYPES } from '@/constants/sensorTypes';
import {
  createSensor,
  deleteSensor,
  listSensors,
  updateSensor,
} from '@/services/api';
import { zoneName, sensorStatusLabel, alertLevelLabel } from '@/utils/labels';
import { minutesAgo, formatRelativeMinutes } from '@/utils/dates';
import { useAdminNavItems } from '../adminNav';
import SensorForm from './SensorForm';
import styles from './SensorsAdmin.module.css';

function deriveStats(sensors) {
  const active = sensors.filter((s) => s.status === 'active' && !s.offline).length;
  const inAlert = sensors.filter((s) => !s.offline && s.alertLevel !== 'normal').length;
  const offline = sensors.filter((s) => s.offline).length;
  return { total: sensors.length, active, inAlert, offline };
}

const EMPTY_STATS = { total: 0, active: 0, inAlert: 0, offline: 0 };

export default function SensorsAdmin() {
  const { t } = useTranslation();
  const navItems = useAdminNavItems();
  const { profile } = useAuth();
  const { notify } = useToast();
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const firstName = (profile?.displayName || 'admin').split(/\s+/)[0];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listSensors()
      .then((data) => {
        if (!cancelled) setSensors(data);
      })
      .catch(() => {
        if (!cancelled) setSensors([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const stats = sensors.length ? deriveStats(sensors) : EMPTY_STATS;

  async function handleSave(data) {
    try {
      const payload = {
        name: data.name,
        deviceId: data.deviceId,
        zoneId: data.zoneId,
        address: data.address || null,
        lat: Number(data.lat),
        lng: Number(data.lng),
        status: data.status,
        thresholds: data.thresholds,
      };
      if (editing) {
        await updateSensor(editing.id, payload);
      } else {
        await createSensor(payload);
      }
      notify({
        tone: 'success',
        title: editing
          ? t('admin.sensors.form.updatedToast')
          : t('admin.sensors.form.createdToast'),
        body: data.name,
      });
      setEditing(null);
      setCreating(false);
      setRefreshTick((n) => n + 1);
    } catch (err) {
      notify({
        tone: 'danger',
        title: t('errors.generic'),
        body: err?.message || t('errors.generic'),
      });
    }
  }

  async function handleDelete(sensor) {
    if (!window.confirm(t('admin.sensors.deleteConfirm'))) return;
    try {
      await deleteSensor(sensor.id);
      notify({
        tone: 'success',
        title: t('admin.sensors.form.deletedToast'),
        body: sensor.name,
      });
      setRefreshTick((n) => n + 1);
    } catch (err) {
      notify({
        tone: 'danger',
        title: t('errors.generic'),
        body: err?.message || t('errors.generic'),
      });
    }
  }

  return (
    <DashboardLayout
      navItems={navItems}
      eyebrow={t('admin.sensors.eyebrow')}
      title={t('admin.sensors.title')}
      tone="admin"
    >
      <section className={styles.intro}>
        <div>
          <p className={styles.lead}>{t('admin.sensors.lead')}</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setCreating(true)}>
          + {t('admin.sensors.addNew')}
        </Button>
      </section>

      <section className={styles.kpiGrid}>
        <Kpi value={stats.total} label={t('admin.navSensors')} tone="ink" />
        <Kpi value={stats.active} label={t('domain.sensorStatus.active')} tone="ok" />
        <Kpi value={stats.inAlert} label={t('admin.dashboard.kpiSensorsAlert')} tone="alert" />
        <Kpi value={stats.offline} label={t('admin.dashboard.kpiSensorsOffline')} tone="warn" />
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHead}>
          <h2 className={styles.panelTitle}>{t('admin.sensors.title')}</h2>
          <span className={styles.panelHint}>{t('notifications.bell.statusRealtime')}</span>
        </header>
        {loading ? (
          <div className={styles.empty}>
            <Spinner size={18} /> {t('common.loading')}
          </div>
        ) : sensors.length === 0 ? (
          <div className={styles.empty}>
            <p>{t('admin.sensors.empty')}</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('admin.sensors.form.name')}</th>
                  <th>{t('admin.sensors.form.zone')}</th>
                  <th>{t('domain.sensorType.water_level')}</th>
                  <th>{t('domain.sensorTypeShort.rainfall')}</th>
                  <th>{t('domain.sensorTypeShort.soil_moisture')}</th>
                  <th>{t('admin.sensors.card.battery')}</th>
                  <th>{t('admin.sensors.form.status')}</th>
                  <th>{t('admin.sensors.card.lastSeen')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sensors.map((s) => {
                  const level = s.offline ? 'offline' : s.alertLevel;
                  return (
                    <tr key={s.id} className={styles[`row_${level}`]}>
                      <td>
                        <p className={styles.cellStrong}>{s.name}</p>
                        <p className={styles.cellMuted}>{s.deviceId}</p>
                      </td>
                      <td>{zoneName(s.zoneId)}</td>
                      <Reading
                        value={s.lastReading?.water_level}
                        threshold={s.thresholds.water_level}
                        type="water_level"
                      />
                      <Reading
                        value={s.lastReading?.rainfall}
                        threshold={s.thresholds.rainfall}
                        type="rainfall"
                      />
                      <Reading
                        value={s.lastReading?.soil_moisture}
                        threshold={s.thresholds.soil_moisture}
                        type="soil_moisture"
                      />
                      <td className={styles.cellNum}>{s.lastReading?.batteryLevel ?? '—'}%</td>
                      <td>
                        <StatusPill status={s.status} offline={s.offline} alertLevel={s.alertLevel} />
                      </td>
                      <td className={styles.cellMuted}>
                        {s.offline
                          ? t('admin.sensors.card.offline')
                          : formatRelativeMinutes(
                              minutesAgo(new Date(s.lastSeenAtMs).toISOString()),
                            )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.btnEdit}
                          onClick={() => setEditing(s)}
                        >
                          {t('admin.sensors.edit')}
                        </button>
                        <button
                          type="button"
                          className={styles.btnEdit}
                          onClick={() => handleDelete(s)}
                        >
                          {t('admin.sensors.delete')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <SensorForm
        open={creating || editing != null}
        sensor={editing}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        onSave={handleSave}
      />
    </DashboardLayout>
  );
}

function Kpi({ value, label, tone }) {
  return (
    <article className={`${styles.kpi} ${styles[`kpi_${tone}`]}`}>
      <p className={styles.kpiValue}>{value}</p>
      <p className={styles.kpiLabel}>{label}</p>
    </article>
  );
}

function Reading({ value, threshold, type }) {
  const v = value ?? null;
  const meta = SENSOR_TYPES[type];
  let level = 'normal';
  if (v != null && threshold) {
    if (v >= threshold.critical) level = 'critical';
    else if (v >= threshold.warning) level = 'warning';
  }
  return (
    <td className={`${styles.cellReading} ${styles[`reading_${level}`]}`}>
      {v == null ? (
        '—'
      ) : (
        <>
          {v}
          <span className={styles.unit}>{meta.unit}</span>
        </>
      )}
    </td>
  );
}

function StatusPill({ status, offline, alertLevel }) {
  if (offline) {
    return <span className={styles.pillOffline}>{i18n.t('admin.sensors.card.offline')}</span>;
  }
  if (status !== 'active') {
    const meta = SENSOR_STATUSES[status];
    return (
      <span className={styles.pill} style={{ backgroundColor: meta.color }}>
        {sensorStatusLabel(status)}
      </span>
    );
  }
  const lvl = ALERT_LEVELS[alertLevel];
  return (
    <span className={styles.pill} style={{ backgroundColor: lvl.color }}>
      {alertLevelLabel(alertLevel)}
    </span>
  );
}
