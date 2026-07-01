import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/common/Modal/Modal';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import { DOUALA_ZONES } from '@/constants/doualaZones';
import { DEFAULT_THRESHOLDS, SENSOR_TYPES } from '@/constants/sensorTypes';
import { sensorTypeLabel } from '@/utils/labels';
import styles from './SensorForm.module.css';

const TYPE_KEYS = ['water_level', 'rainfall', 'soil_moisture'];

function emptyForm() {
  return {
    name: '',
    deviceId: '',
    zoneId: 'akwa',
    address: '',
    lat: '',
    lng: '',
    status: 'active',
    thresholds: structuredClone(DEFAULT_THRESHOLDS),
  };
}

export default function SensorForm({ open, sensor, onClose, onSave }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    if (sensor) {
      setForm({
        name: sensor.name ?? '',
        deviceId: sensor.deviceId ?? '',
        zoneId: sensor.zoneId ?? 'akwa',
        address: sensor.address ?? '',
        lat: sensor.lat ?? '',
        lng: sensor.lng ?? '',
        status: sensor.status ?? 'active',
        thresholds: sensor.thresholds ?? structuredClone(DEFAULT_THRESHOLDS),
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, sensor]);

  function handleSubmit(e) {
    e.preventDefault();
    onSave?.(form);
  }

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function setThreshold(type, key, value) {
    setForm((f) => ({
      ...f,
      thresholds: {
        ...f.thresholds,
        [type]: { ...f.thresholds[type], [key]: Number(value) },
      },
    }));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={sensor ? t('admin.sensors.form.editTitle') : t('admin.sensors.form.createTitle')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid2}>
          <Input
            label={t('admin.sensors.form.name')}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            required
            placeholder={t('admin.sensors.form.namePlaceholder')}
          />
          <Input
            label={t('admin.sensors.form.deviceId')}
            value={form.deviceId}
            onChange={(e) => setField('deviceId', e.target.value)}
            required
            placeholder="ESP32-AKWA-001"
            hint={t('admin.sensors.form.deviceIdHint')}
          />
        </div>

        <div className={styles.grid2}>
          <div>
            <label className={styles.label}>{t('admin.sensors.form.zone')}</label>
            <select
              className={styles.select}
              value={form.zoneId}
              onChange={(e) => setField('zoneId', e.target.value)}
            >
              {DOUALA_ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} — {z.arrondissement}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={styles.label}>{t('admin.sensors.form.status')}</label>
            <select
              className={styles.select}
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
            >
              <option value="active">{t('domain.sensorStatus.active')}</option>
              <option value="inactive">{t('domain.sensorStatus.inactive')}</option>
              <option value="maintenance">{t('domain.sensorStatus.maintenance')}</option>
            </select>
          </div>
        </div>

        <Input
          label={t('admin.sensors.form.address')}
          value={form.address}
          onChange={(e) => setField('address', e.target.value)}
        />

        <div className={styles.grid2}>
          <Input
            type="number"
            step="0.0001"
            label={t('admin.sensors.form.lat')}
            value={form.lat}
            onChange={(e) => setField('lat', e.target.value)}
            placeholder="4.0469"
            required
          />
          <Input
            type="number"
            step="0.0001"
            label={t('admin.sensors.form.lng')}
            value={form.lng}
            onChange={(e) => setField('lng', e.target.value)}
            placeholder="9.7034"
            required
          />
        </div>

        <fieldset className={styles.fieldset}>
          <legend>{t('admin.sensors.form.thresholds')}</legend>
          <div className={styles.thresholdsGrid}>
            {TYPE_KEYS.map((typeKey) => {
              const meta = SENSOR_TYPES[typeKey];
              return (
                <div key={typeKey} className={styles.thresholdRow}>
                  <span className={styles.thresholdLabel}>
                    <span aria-hidden="true">{meta.icon}</span> {sensorTypeLabel(typeKey)}
                  </span>
                  <label>
                    {t('admin.sensors.form.warning')} ({meta.unit})
                    <input
                      className={styles.numInput}
                      type="number"
                      min="0"
                      max="200"
                      value={form.thresholds[typeKey].warning}
                      onChange={(e) => setThreshold(typeKey, 'warning', e.target.value)}
                    />
                  </label>
                  <label>
                    {t('admin.sensors.form.critical')} ({meta.unit})
                    <input
                      className={styles.numInput}
                      type="number"
                      min="0"
                      max="200"
                      value={form.thresholds[typeKey].critical}
                      onChange={(e) => setThreshold(typeKey, 'critical', e.target.value)}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>

        <div className={styles.actions}>
          <Button as="button" type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary">
            {sensor ? t('admin.sensors.form.submitUpdate') : t('admin.sensors.form.submitCreate')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
