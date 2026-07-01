import { useTranslation } from 'react-i18next';
import Badge from '@/components/common/Badge/Badge';

const CONFIG = {
  user: { tone: 'clay', icon: '◇' },
  sensor: { tone: 'validated', icon: '⏚' },
  'sensor-live': { tone: 'live', icon: '⏚' },
};

export default function SourceBadge({ source, className }) {
  const { t } = useTranslation();
  const cfg = CONFIG[source] ?? CONFIG.user;
  const label = t(`domain.source.${source}`, { defaultValue: t('domain.source.user') });
  return (
    <Badge tone={cfg.tone} dot={source === 'sensor-live'} className={className}>
      <span aria-hidden="true">{cfg.icon}</span>
      {label}
    </Badge>
  );
}
