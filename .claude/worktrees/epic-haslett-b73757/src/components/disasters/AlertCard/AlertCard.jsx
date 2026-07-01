import { Trans, useTranslation } from 'react-i18next';
import { disasterLabel, severityInfo, zoneName } from '@/utils/labels';
import { timeSinceISO } from '@/utils/dates';
import { classNames } from '@/utils/formatters';
import { SEVERITY_LABEL } from '@/constants/severityLevels';
import SourceBadge from '../SourceBadge/SourceBadge';
import styles from './AlertCard.module.css';

export default function AlertCard({ alert, variant = 'compact', actions, onClick }) {
  const { t } = useTranslation();
  const sev = severityInfo(alert.severity);
  const isClickable = Boolean(onClick);
  return (
    <article
      className={classNames(
        styles.card,
        styles[`v_${variant}`],
        isClickable && styles.clickable,
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <header className={styles.head}>
        <SourceBadge source={alert.source} />
        <span
          className={styles.severity}
          style={{ backgroundColor: sev.color }}
        >
          {SEVERITY_LABEL[alert.severity] ?? sev.label}
        </span>
      </header>
      <h3 className={styles.title}>{alert.title}</h3>
      <p className={styles.meta}>
        <span>{disasterLabel(alert.type)}</span>
        <span aria-hidden="true">·</span>
        <span>{zoneName(alert.quartierId)}</span>
        <span aria-hidden="true">·</span>
        <span>{timeSinceISO(alert.createdAt)}</span>
      </p>
      {alert.reporterName && variant === 'full' && (
        <p className={styles.reporter}>
          <Trans
            i18nKey="alertCard.reportedBy"
            values={{ name: alert.reporterName }}
            defaults="Reported by <1>{{name}}</1>"
            components={[<strong key="name" />]}
          />
        </p>
      )}
      {alert.rejectionReason && (
        <p className={styles.rejectionReason}>
          <span className={styles.rejectionLabel}>{t('alertCard.rejectionLabel')}</span>
          {alert.rejectionReason}
        </p>
      )}
      {actions && <footer className={styles.actions}>{actions}</footer>}
    </article>
  );
}
