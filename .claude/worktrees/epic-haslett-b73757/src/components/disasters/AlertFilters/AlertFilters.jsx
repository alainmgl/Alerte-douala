import { useTranslation } from 'react-i18next';
import { DISASTER_TYPE_LIST } from '@/constants/disasterTypes';
import { DOUALA_ZONES } from '@/constants/doualaZones';
import { disasterLabel } from '@/utils/labels';
import { classNames } from '@/utils/formatters';
import styles from './AlertFilters.module.css';

export default function AlertFilters({ value, onChange, options = {} }) {
  const { t } = useTranslation();

  const types = (options.types ?? DISASTER_TYPE_LIST).map((d) => ({
    id: d.id,
    label: disasterLabel(d.id),
  }));
  const zones = options.zones ?? DOUALA_ZONES;
  const sources =
    options.sources ?? [
      { id: 'user', label: t('domain.source.user') },
      { id: 'sensor', label: t('domain.source.sensor') },
      { id: 'sensor-live', label: t('domain.source.sensor-live') },
    ];

  function toggle(key, id) {
    const current = value[key] ?? [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    onChange({ ...value, [key]: next });
  }

  function reset() {
    onChange({ types: [], zones: [], sources: [] });
  }

  const totalSelected =
    (value.types?.length || 0) +
    (value.zones?.length || 0) +
    (value.sources?.length || 0);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span className={styles.title}>{t('alertFilters.title')}</span>
        {totalSelected > 0 && (
          <button type="button" onClick={reset} className={styles.reset}>
            {t('alertFilters.clear')} ({totalSelected})
          </button>
        )}
      </div>
      <FilterGroup
        label={t('alertFilters.typeLabel')}
        items={types}
        active={value.types}
        onToggle={(id) => toggle('types', id)}
      />
      <FilterGroup
        label={t('alertFilters.zoneLabel')}
        items={zones}
        active={value.zones}
        onToggle={(id) => toggle('zones', id)}
        labelKey="name"
      />
      <FilterGroup
        label={t('alertFilters.sourceLabel')}
        items={sources}
        active={value.sources}
        onToggle={(id) => toggle('sources', id)}
      />
    </div>
  );
}

function FilterGroup({ label, items, active = [], onToggle, labelKey = 'label' }) {
  return (
    <div className={styles.group}>
      <span className={styles.groupLabel}>{label}</span>
      <div className={styles.chipsRow}>
        {items.map((item) => {
          const isActive = active.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              className={classNames(styles.chip, isActive && styles.chipActive)}
              aria-pressed={isActive}
            >
              {item[labelKey] ?? item.label ?? item.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
