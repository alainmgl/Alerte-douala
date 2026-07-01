import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { useToast } from '@/contexts/ToastContext';
import {
  disablePush,
  enablePush,
  getPushStatus,
} from '@/services/api';
import styles from './PushToggle.module.css';

const PERMISSION_TKEY = {
  default: 'push.permDefault',
  granted: 'push.permGranted',
  denied: 'push.permDenied',
  unsupported: 'push.permUnsupported',
};

export default function PushToggle() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState({
    supported: false,
    permission: 'default',
    subscribed: false,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getPushStatus();
      setStatus(next);
    } catch (err) {
      console.error('[push] status error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleEnable() {
    setWorking(true);
    try {
      await enablePush();
      notify({
        tone: 'success',
        title: t('push.enabledTitle'),
        body: t('push.enabledBody'),
      });
      await refresh();
    } catch (err) {
      notify({
        tone: 'error',
        title: t('push.errorTitle'),
        body: err?.message || t('push.errorBody'),
      });
    } finally {
      setWorking(false);
    }
  }

  async function handleDisable() {
    setWorking(true);
    try {
      await disablePush();
      notify({
        tone: 'info',
        title: t('push.disabledTitle'),
        body: t('push.disabledBody'),
      });
      await refresh();
    } catch (err) {
      notify({
        tone: 'error',
        title: t('push.errorTitle'),
        body: err?.message || t('push.errorBody'),
      });
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingRow}>
        <Spinner size={16} /> {t('common.loading')}
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <dl className={styles.meta}>
        <div className={styles.metaRow}>
          <dt>{t('push.labelCompat')}</dt>
          <dd>{status.supported ? t('push.valYes') : t('push.valUnsupported')}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>{t('push.labelPermission')}</dt>
          <dd>{t(PERMISSION_TKEY[status.permission] || 'push.permDefault')}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>{t('push.labelSubscribed')}</dt>
          <dd>{status.subscribed ? t('push.valYes') : t('push.valNo')}</dd>
        </div>
      </dl>

      {!status.supported && <p className={styles.hint}>{t('push.iosHint')}</p>}

      {status.supported && status.permission === 'denied' && (
        <p className={styles.hint}>{t('push.deniedHint')}</p>
      )}

      {status.supported && (
        <div className={styles.actions}>
          {status.subscribed ? (
            <Button
              variant="outline"
              size="md"
              onClick={handleDisable}
              disabled={working}
            >
              {working ? (
                <>
                  <Spinner size={14} /> {t('push.disabling')}
                </>
              ) : (
                t('push.disable')
              )}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={handleEnable}
              disabled={working || status.permission === 'denied'}
            >
              {working ? (
                <>
                  <Spinner size={14} /> {t('push.enabling')}
                </>
              ) : (
                t('push.enable')
              )}
            </Button>
          )}
        </div>
      )}

      <p className={styles.devNote}>
        {t('push.devHintBefore')}
        <code>{t('push.devHintCode')}</code>
        {t('push.devHintAfter')}
      </p>
    </div>
  );
}
