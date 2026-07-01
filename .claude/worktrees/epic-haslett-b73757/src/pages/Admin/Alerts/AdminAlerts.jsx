import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import { useToast } from '@/contexts/ToastContext';
import {
  getAlertsBuckets,
  rejectDisaster,
  validateDisaster,
} from '@/services/api';
import Tabs from '@/components/disasters/Tabs/Tabs';
import RejectModal from '@/components/disasters/RejectModal/RejectModal';
import { useAdminNavItems } from '../adminNav';
import AlertsKpisAdmin from './sections/AlertsKpisAdmin';
import PendingTab from './sections/PendingTab';
import ValidatedTab from './sections/ValidatedTab';
import SensorsLiveTab from './sections/SensorsLiveTab';
import AllTab from './sections/AllTab';
import styles from './AdminAlerts.module.css';

const EMPTY_BUCKETS = {
  pending: [],
  validated: [],
  rejected: [],
  sensorsLive: [],
  all: [],
};

function computeKpis(buckets) {
  const today = new Date().toISOString().slice(0, 10);
  const validatedToday = buckets.validated.filter(
    (r) => (r.validatedAt ?? '').slice(0, 10) === today,
  ).length;
  const critical =
    buckets.sensorsLive.filter((a) => a.severity === 'critical').length +
    buckets.validated.filter((a) => a.severity === 'critical').length;
  return {
    pending: buckets.pending.length,
    validatedToday,
    sensorsLive: buckets.sensorsLive.length,
    critical,
  };
}

export default function AdminAlerts() {
  const { t } = useTranslation();
  const navItems = useAdminNavItems();
  const { notify } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [rejectingAlert, setRejectingAlert] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [buckets, setBuckets] = useState(EMPTY_BUCKETS);

  useEffect(() => {
    let cancelled = false;
    getAlertsBuckets()
      .then((data) => {
        if (!cancelled) setBuckets(data);
      })
      .catch(() => {
        if (!cancelled) setBuckets(EMPTY_BUCKETS);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const kpis = useMemo(() => computeKpis(buckets), [buckets]);

  function refresh() {
    setRefreshTick((n) => n + 1);
  }

  async function handleValidate(alert) {
    try {
      await validateDisaster(alert.id);
      notify({ tone: 'success', title: t('notifications.tagDisasterValidated'), body: alert.title });
      refresh();
    } catch (err) {
      notify({
        tone: 'danger',
        title: t('errors.generic'),
        body: err?.message || t('errors.generic'),
      });
    }
  }

  function handleOpenReject(alert) {
    setRejectingAlert(alert);
  }

  async function handleConfirmReject(reason) {
    if (!rejectingAlert) return;
    try {
      await rejectDisaster(rejectingAlert.id, reason);
      notify({
        tone: 'info',
        title: t('notifications.tagDisasterRejected'),
        body: rejectingAlert.title,
      });
      setRejectingAlert(null);
      refresh();
    } catch (err) {
      notify({
        tone: 'danger',
        title: t('errors.generic'),
        body: err?.message || t('errors.generic'),
      });
    }
  }

  const tabs = [
    { id: 'pending', label: t('admin.alerts.tabPending'), count: buckets.pending.length },
    { id: 'validated', label: t('admin.alerts.tabValidated'), count: buckets.validated.length },
    { id: 'sensors', label: t('admin.alerts.tabSensors'), count: buckets.sensorsLive.length },
    { id: 'all', label: t('admin.alerts.tabAll'), count: buckets.all.length },
  ];

  return (
    <DashboardLayout
      navItems={navItems}
      eyebrow={t('admin.alerts.eyebrow')}
      title={t('admin.alerts.title')}
      tone="admin"
    >
      <section className={styles.intro}>
        <p className={styles.lead}>{t('admin.alerts.lead')}</p>
      </section>

      <AlertsKpisAdmin kpis={kpis} />

      <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />

      <div className={styles.tabContent}>
        {activeTab === 'pending' && (
          <PendingTab
            items={buckets.pending}
            onValidate={handleValidate}
            onReject={handleOpenReject}
          />
        )}
        {activeTab === 'validated' && <ValidatedTab items={buckets.validated} />}
        {activeTab === 'sensors' && <SensorsLiveTab items={buckets.sensorsLive} />}
        {activeTab === 'all' && <AllTab items={buckets.all} />}
      </div>

      <RejectModal
        open={Boolean(rejectingAlert)}
        alert={rejectingAlert}
        onClose={() => setRejectingAlert(null)}
        onConfirm={handleConfirmReject}
      />
    </DashboardLayout>
  );
}
