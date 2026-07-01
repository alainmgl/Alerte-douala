import { useTranslation } from 'react-i18next';
import { DISASTER_TYPE_LIST } from '@/constants/disasterTypes';
import { SEVERITY_LIST } from '@/constants/severityLevels';
import { disasterLabel, severityInfo } from '@/utils/labels';
import styles from './AdminMap.module.css';

function Group({ title, options, selected, onToggle, getColor, getLabel }) {
  return (
    <div className={styles.filterGroup}>
      <p className={styles.filterTitle}>{title}</p>
      <div className={styles.chipRow}>
        {options.map((opt) => {
          const isOn = selected.has(opt.id);
          const accent = getColor ? getColor(opt) : null;
          const label = getLabel ? getLabel(opt) : opt.label;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggle(opt.id)}
              className={`${styles.chip} ${isOn ? styles.chipOn : ''}`}
              style={isOn && accent ? { background: accent, borderColor: 'var(--ink)', color: 'var(--paper)' } : undefined}
              aria-pressed={isOn}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FilterPanel({
  disasters,
  severities,
  statuses,
  onToggleDisaster,
  onToggleSeverity,
  onToggleStatus,
  onReset,
}) {
  const { t } = useTranslation();

  const STATUS_OPTIONS = [
    { id: 'pending', label: t('domain.disasterStatus.pending') },
    { id: 'validated', label: t('domain.disasterStatus.validated') },
    { id: 'rejected', label: t('domain.disasterStatus.rejected') },
  ];

  return (
    <section className={styles.filters} aria-label={t('admin.map.filterTitle')}>
      <header className={styles.filtersHead}>
        <div>
          <p className="text-eyebrow">{t('alertFilters.title')}</p>
          <h2 className={styles.filtersTitle}>{t('admin.map.filterTitle')}</h2>
        </div>
        <button type="button" onClick={onReset} className={styles.resetBtn}>
          {t('alertFilters.clear')}
        </button>
      </header>

      <div className={styles.filtersGrid}>
        <Group
          title={t('admin.map.filterType')}
          options={DISASTER_TYPE_LIST}
          selected={disasters}
          onToggle={onToggleDisaster}
          getLabel={(o) => disasterLabel(o.id)}
        />
        <Group
          title={t('admin.pending.filterBySeverity')}
          options={SEVERITY_LIST}
          selected={severities}
          onToggle={onToggleSeverity}
          getColor={(opt) => opt.color}
          getLabel={(o) => severityInfo(o.id).label}
        />
        <Group
          title={t('admin.map.filterStatus')}
          options={STATUS_OPTIONS}
          selected={statuses}
          onToggle={onToggleStatus}
        />
      </div>
    </section>
  );
}
