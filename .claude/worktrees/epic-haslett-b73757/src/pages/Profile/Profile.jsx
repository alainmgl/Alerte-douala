import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import Badge from '@/components/common/Badge/Badge';
import Spinner from '@/components/common/Spinner/Spinner';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { updateUserProfile } from '@/services/auth';
import { ROUTES } from '@/constants/routes';
import {
  FEEDBACK_MAX,
  USER_DISPLAY_NAME_MIN,
  USER_DISPLAY_NAME_MAX,
} from '@/constants/formLimits';
import PushToggle from '@/components/notifications/PushToggle/PushToggle';
import { classNames } from '@/utils/formatters';
import styles from './Profile.module.css';

const LANG_KEY = 'alerteDouala.lang';
const FEEDBACK_KEY = 'alerteDouala.feedback';
const NAME_MIN = USER_DISPLAY_NAME_MIN;
const NAME_MAX = USER_DISPLAY_NAME_MAX;

const LANG_OPTIONS = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'English' },
];

function computeInitials(displayName, email) {
  return (displayName || email || '?')
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || '·';
}

function formatJoinDate(iso, lng) {
  if (!iso) return '—';
  try {
    const locale = lng === 'en' ? 'en-US' : 'fr-FR';
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { profile, loading, isAdmin, refreshProfile } = useAuth();

  const NAV_ITEMS = [
    { to: ROUTES.DASHBOARD, label: t('dashboard.navHome'), icon: '◆', end: true },
    { to: ROUTES.ALERTS, label: t('dashboard.navAlerts'), icon: '!' },
    { to: ROUTES.MAP, label: t('dashboard.navMap'), icon: '◉' },
    { to: ROUTES.REPORT, label: t('dashboard.navReport'), icon: '+' },
    { to: ROUTES.PROFILE, label: t('dashboard.navProfile'), icon: '·' },
  ];

  const FAQ_KEYS = ['1', '2', '3', '4'];
  const { notify } = useToast();

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  const [lang, setLang] = useState('fr');
  const [feedback, setFeedback] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  // Init language from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved === 'fr' || saved === 'en') setLang(saved);
  }, []);

  // Reset draft name whenever profile changes
  useEffect(() => {
    if (profile?.displayName !== undefined) setDraftName(profile.displayName ?? '');
  }, [profile?.displayName]);

  if (loading) {
    return (
      <DashboardLayout
        navItems={NAV_ITEMS}
        eyebrow="Espace personnel"
        title="Mon profil"
        tone="user"
      >
        <div className={styles.loadingWrap}>
          <Spinner size={32} />
        </div>
      </DashboardLayout>
    );
  }

  const initials = computeInitials(profile?.displayName, profile?.email);

  function startEdit() {
    setNameError('');
    setDraftName(profile?.displayName ?? '');
    setEditingName(true);
  }

  function cancelEdit() {
    setNameError('');
    setDraftName(profile?.displayName ?? '');
    setEditingName(false);
  }

  async function saveName(e) {
    e?.preventDefault();
    const next = draftName.trim();
    if (next.length < NAME_MIN) {
      setNameError(`Au moins ${NAME_MIN} caractères.`);
      return;
    }
    if (next.length > NAME_MAX) {
      setNameError(`${NAME_MAX} caractères maximum.`);
      return;
    }
    setSavingName(true);
    setNameError('');
    try {
      await updateUserProfile(profile.uid, { displayName: next });
      await refreshProfile();
      setEditingName(false);
      notify({
        tone: 'success',
        title: t('profile.updatedTitle'),
        body: t('profile.updatedBody'),
      });
    } catch (err) {
      setNameError(err?.message || t('profile.saveError'));
    } finally {
      setSavingName(false);
    }
  }

  function changeLang(next) {
    if (next === lang) return;
    setLang(next);
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {
      // quota — ignore
    }
    i18n.changeLanguage(next);
    notify({
      tone: 'info',
      title: next === 'fr' ? t('profile.langSavedFrTitle') : t('profile.langSavedEnTitle'),
      body: next === 'fr' ? t('profile.langSavedFrBody') : t('profile.langSavedEnBody'),
    });
  }

  async function sendFeedback() {
    const body = feedback.trim();
    if (body.length < 5) return;
    setSendingFeedback(true);
    try {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `fb-${Date.now().toString(36)}`;
      const entry = {
        id,
        uid: profile?.uid ?? 'anonymous',
        email: profile?.email ?? null,
        body,
        createdAt: new Date().toISOString(),
      };
      const raw = window.localStorage.getItem(FEEDBACK_KEY);
      let list = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) list = parsed;
        } catch {
          // donnée corrompue : on repart d'une liste vide plutôt que de planter
        }
      }
      list.push(entry);
      window.localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list));
      setFeedback('');
      notify({
        tone: 'success',
        title: t('profile.feedbackThanks'),
        body: t('profile.feedbackThanksBody'),
      });
    } catch {
      notify({
        tone: 'error',
        title: t('profile.feedbackThanks'),
        body: t('profile.feedbackSendError'),
      });
    } finally {
      setSendingFeedback(false);
    }
  }

  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      eyebrow={t('profile.eyebrow')}
      title={t('profile.title')}
      tone="user"
    >
      {/* ============ Identity card ============ */}
      <section className={styles.headerCard}>
        <span className={styles.avatarLg} aria-hidden="true">
          {initials}
        </span>

        <div className={styles.identity}>
          {!editingName ? (
            <>
              <h2 className={styles.name}>{profile?.displayName || '—'}</h2>
              <p className={styles.email}>{profile?.email}</p>
              <div className={styles.metaRow}>
                <Badge tone={isAdmin ? 'live' : 'validated'}>
                  {isAdmin ? t('profile.roleAdmin') : t('profile.roleUser')}
                </Badge>
                <span>· {t('profile.memberSince', { date: formatJoinDate(profile?.createdAt, i18n.language) })}</span>
                <span>
                  ·{' '}
                  {t('profile.reportsCount', {
                    count: profile?.reportsCount ?? 0,
                  })}
                </span>
              </div>
            </>
          ) : (
            <form className={styles.editForm} onSubmit={saveName}>
              <Input
                label={t('profile.nameLabel')}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value.slice(0, NAME_MAX))}
                error={nameError}
                maxLength={NAME_MAX}
                autoFocus
              />
              <div className={styles.editActions}>
                <Button type="submit" variant="primary" size="sm" disabled={savingName}>
                  {savingName ? (
                    <>
                      <Spinner size={14} /> {t('common.saving')}
                    </>
                  ) : (
                    t('common.save')
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cancelEdit}
                  disabled={savingName}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          )}
        </div>

        {!editingName && (
          <div className={styles.headerActions}>
            <Button variant="outline" size="sm" onClick={startEdit}>
              {t('profile.editName')}
            </Button>
          </div>
        )}
      </section>

      {/* ============ Settings — Notifications push ============ */}
      <section className={styles.panel} aria-labelledby="push-title">
        <header className={styles.panelHead}>
          <h2 id="push-title" className={styles.panelTitle}>{t('profile.pushPanelTitle')}</h2>
          <span className={styles.panelHint}>{t('profile.pushPanelHint')}</span>
        </header>
        <div className={styles.panelBody}>
          <PushToggle />
        </div>
      </section>

      {/* ============ Settings — Langue ============ */}
      <section className={styles.panel} aria-labelledby="lang-title">
        <header className={styles.panelHead}>
          <h2 id="lang-title" className={styles.panelTitle}>{t('profile.langPanelTitle')}</h2>
          <span className={styles.panelHint}>{t('profile.langPanelHint')}</span>
        </header>
        <div className={styles.panelBody}>
          <div className={styles.langPills} role="radiogroup" aria-label={t('profile.langPanelTitle')}>
            {LANG_OPTIONS.map((opt) => {
              const selected = lang === opt.id;
              return (
                <label
                  key={opt.id}
                  className={classNames(styles.langPill, selected && styles.langPillSelected)}
                >
                  <input
                    type="radio"
                    name="lang"
                    value={opt.id}
                    checked={selected}
                    onChange={() => changeLang(opt.id)}
                    className={styles.hiddenInput}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ Settings — Aide ============ */}
      <section className={styles.panel} aria-labelledby="help-title">
        <header className={styles.panelHead}>
          <h2 id="help-title" className={styles.panelTitle}>{t('profile.helpTitle')}</h2>
          <span className={styles.panelHint}>{t('profile.helpHint')}</span>
        </header>
        <div className={styles.panelBody}>
          <div className={styles.faq}>
            {FAQ_KEYS.map((k) => (
              <details key={k} className={styles.faqItem}>
                <summary className={styles.faqSummary}>{t(`profile.faq.q${k}`)}</summary>
                <p className={styles.faqAnswer}>{t(`profile.faq.a${k}`)}</p>
              </details>
            ))}
          </div>
          <div className={styles.contactRow}>
            <span className={styles.contactLabel}>{t('profile.helpContactLabel')}</span>
            <Button
              as="a"
              href="mailto:contact@alerte-douala.cm"
              variant="ghost"
              size="sm"
            >
              {t('profile.helpContactCta')}
            </Button>
          </div>
        </div>
      </section>

      {/* ============ Settings — Commentaires ============ */}
      <section className={styles.panel} aria-labelledby="feedback-title">
        <header className={styles.panelHead}>
          <h2 id="feedback-title" className={styles.panelTitle}>{t('profile.feedbackTitle')}</h2>
          <span className={styles.panelHint}>{t('profile.feedbackHint')}</span>
        </header>
        <div className={styles.panelBody}>
          <textarea
            className={styles.feedbackTextarea}
            placeholder={t('profile.feedbackPlaceholder')}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value.slice(0, FEEDBACK_MAX))}
            rows={5}
          />
          <div className={styles.feedbackRow}>
            <span className={styles.counter}>
              {feedback.length} / {FEEDBACK_MAX}
            </span>
            <Button
              variant="clay"
              onClick={sendFeedback}
              disabled={sendingFeedback || feedback.trim().length < 5}
            >
              {sendingFeedback ? (
                <>
                  <Spinner size={16} /> {t('common.sending')}
                </>
              ) : (
                t('common.send')
              )}
            </Button>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
