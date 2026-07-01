import { useTranslation } from 'react-i18next';
import { DISASTER_TYPE_LIST } from '@/constants/disasterTypes';
import { SEVERITY_LIST } from '@/constants/severityLevels';
import { DOUALA_ZONES } from '@/constants/doualaZones';
import { disasterLabel, severityInfo } from '@/utils/labels';
import styles from '../AdminPending.module.css';

export default function PendingFilters({
  severity,
  type,
  zone,
  sort,
  onSeverityChange,
  onTypeChange,
  onZoneChange,
  onSortChange,
  onReset,
  totalCount,
  filteredCount,
}) {
  const { t } = useTranslation();
  const isFiltered =
    severity !== 'all' || type !== 'all' || zone !== 'all' || sort !== 'recent';

  const SORT_OPTIONS = [
    { id: 'recent', label: t('admin.pending.sortNewest') },
    { id: 'oldest', label: t('admin.pending.sortOldest') },
    { id: 'severity', label: t('admin.pending.sortSeverity') },
  ];

  return (
    <section className={styles.filters}>
      <header className={styles.filtersHead}>
        <h2 className={styles.filtersTitle}>{t('alertFilters.title')}</h2>
        <span className={styles.filtersCount}>
          {filteredCount} / {totalCount}
        </span>
      </header>

      <div className={styles.filterRow}>
        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="filter-severity">
            {t('admin.pending.filterBySeverity')}
          </label>
          <select
            id="filter-severity"
            className={styles.filterSelect}
            value={severity}
            onChange={(e) => onSeverityChange(e.target.value)}
          >
            <option value="all">{t('admin.pending.filterAllSeverities')}</option>
            {SEVERITY_LIST.map((s) => (
              <option key={s.id} value={s.id}>
                {severityInfo(s.id).label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="filter-type">
            {t('admin.pending.filterByType')}
          </label>
          <select
            id="filter-type"
            className={styles.filterSelect}
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
          >
            <option value="all">{t('admin.pending.filterAllTypes')}</option>
            {DISASTER_TYPE_LIST.map((dt) => (
              <option key={dt.id} value={dt.id}>
                {disasterLabel(dt.id)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="filter-zone">
            {t('admin.pending.filterByZone')}
          </label>
          <select
            id="filter-zone"
            className={styles.filterSelect}
            value={zone}
            onChange={(e) => onZoneChange(e.target.value)}
          >
            <option value="all">{t('admin.pending.filterAllZones')}</option>
            {DOUALA_ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterField}>
          <label className={styles.filterLabel} htmlFor="filter-sort">
            {t('alertFilters.typeLabel')}
          </label>
          <select
            id="filter-sort"
            className={styles.filterSelect}
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className={styles.resetBtn}
          onClick={onReset}
          disabled={!isFiltered}
        >
          {t('alertFilters.clear')}
        </button>
      </div>
    </section>
  );
}
