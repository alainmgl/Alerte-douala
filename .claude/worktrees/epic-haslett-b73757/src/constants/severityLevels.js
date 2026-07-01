import i18n from '@/i18n';

export const SEVERITY_LEVELS = {
  low: { id: 'low', label: 'Faible', color: '#6B7166' },
  medium: { id: 'medium', label: 'Modérée', color: '#B8860B' },
  high: { id: 'high', label: 'Élevée', color: '#E5572E' },
  critical: { id: 'critical', label: 'Critique', color: '#C8102E' },
};

export const SEVERITY_LIST = Object.values(SEVERITY_LEVELS);

// SEVERITY_LABEL est une vue localisée — chaque accès `SEVERITY_LABEL[id]`
// résout la chaîne via i18n.t() dans la langue courante.
export const SEVERITY_LABEL = new Proxy(
  {},
  {
    get(_target, id) {
      const fallback = SEVERITY_LEVELS[id]?.label ?? id;
      return i18n.t(`domain.severity.${String(id)}`, { defaultValue: fallback });
    },
  },
);

export const SEVERITY_RANK = { low: 1, medium: 2, high: 3, critical: 4 };
