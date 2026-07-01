import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { ROUTES } from '@/constants/routes';

// Hook React — renvoie la nav admin localisée et réactive aux changements de langue.
export function useAdminNavItems() {
  const { t } = useTranslation();
  return useMemo(
    () => [
      { to: ROUTES.ADMIN, label: t('admin.navOverview'), icon: '◆', end: true },
      { to: ROUTES.ADMIN_PENDING, label: t('admin.navPending'), icon: '!' },
      { to: ROUTES.ADMIN_ALERTS, label: t('admin.navAlerts'), icon: '◉' },
      { to: ROUTES.ADMIN_SENSORS, label: t('admin.navSensors'), icon: '⏚' },
      { to: ROUTES.ADMIN_MAP, label: t('admin.navMap'), icon: '⌖' },
      { to: ROUTES.ADMIN_USERS, label: t('admin.navUsers'), icon: '◫' },
      { to: ROUTES.HOME, label: t('admin.navPublic'), icon: '↗' },
    ],
    [t],
  );
}

// Compat : certains imports historiques utilisent encore ADMIN_NAV_ITEMS comme
// constante. On le calcule dynamiquement via i18n.t() pour suivre la langue
// (relus à chaque accès grâce au Proxy de propriété).
export const ADMIN_NAV_ITEMS = [
  { to: ROUTES.ADMIN, key: 'admin.navOverview', icon: '◆', end: true },
  { to: ROUTES.ADMIN_PENDING, key: 'admin.navPending', icon: '!' },
  { to: ROUTES.ADMIN_ALERTS, key: 'admin.navAlerts', icon: '◉' },
  { to: ROUTES.ADMIN_SENSORS, key: 'admin.navSensors', icon: '⏚' },
  { to: ROUTES.ADMIN_MAP, key: 'admin.navMap', icon: '⌖' },
  { to: ROUTES.ADMIN_USERS, key: 'admin.navUsers', icon: '◫' },
  { to: ROUTES.HOME, key: 'admin.navPublic', icon: '↗' },
].map((item) =>
  new Proxy(item, {
    get(target, prop) {
      if (prop === 'label') return i18n.t(target.key);
      return target[prop];
    },
  }),
);
