import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Input from '@/components/common/Input/Input';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { requestPasswordReset } from '@/services/auth';
import { isEmail } from '@/utils/validators';
import { ROUTES } from '@/constants/routes';
import AuthLayout from './AuthLayout';
import { authErrorMessage } from './firebaseAuthErrors';
import formStyles from './AuthForm.module.css';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [devToken, setDevToken] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setFormError('');
    if (!isEmail(email)) {
      setError(t('auth.login.errorEmail'));
      return;
    }
    setSubmitting(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setDone(true);
      if (result?.devToken) setDevToken(result.devToken);
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const resetWithToken = devToken
    ? `${ROUTES.RESET_PASSWORD}?token=${encodeURIComponent(devToken)}`
    : null;

  const BULLETS = [
    t('auth.forgot.bullet1'),
    t('auth.forgot.bullet2'),
    t('auth.forgot.bullet3'),
  ];

  return (
    <AuthLayout
      eyebrow={t('auth.forgot.eyebrow')}
      headline={
        <>
          {t('auth.forgot.headline1')}
          <em>{t('auth.forgot.headlineEm')}</em>
          {t('auth.forgot.headline2')}
        </>
      }
      manifesto={t('auth.forgot.manifesto')}
      bullets={BULLETS}
    >
      <header className={formStyles.head}>
        <p className={formStyles.eyebrow}>{t('auth.forgot.formEyebrow')}</p>
        <h2 className={formStyles.title}>
          {t('auth.forgot.formTitle1')}
          <em>{t('auth.forgot.formTitleEm')}</em>
          {t('auth.forgot.formTitle2')}
        </h2>
        <p className={formStyles.subtitle}>{t('auth.forgot.formSubtitle')}</p>
      </header>

      {!done ? (
        <form className={formStyles.form} onSubmit={onSubmit} noValidate>
          {formError && (
            <div className={formStyles.formError} role="alert">
              {formError}
            </div>
          )}

          <Input
            label={t('auth.login.emailLabel')}
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={t('auth.login.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            required
            disabled={submitting}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={submitting}
            className={formStyles.submit}
          >
            {submitting ? (
              <>
                <Spinner size={18} label="" /> {t('auth.forgot.submitting')}
              </>
            ) : (
              <>{t('auth.forgot.submit')}</>
            )}
          </Button>
        </form>
      ) : (
        <div className={formStyles.form} role="status" aria-live="polite">
          <p
            style={{
              padding: '1rem 1.1rem',
              border: '2px solid var(--mangrove)',
              background: 'var(--paper)',
              fontSize: 'var(--fs-sm)',
              lineHeight: 1.6,
            }}
          >
            {t('auth.forgot.sentBody1')}
            <strong>{email.trim()}</strong>
            {t('auth.forgot.sentBody2')}
          </p>
          {resetWithToken && (
            <div
              style={{
                padding: '0.85rem 1rem',
                border: '2px dashed var(--clay)',
                background: '#FFF7F1',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--fs-xs)',
                lineHeight: 1.6,
              }}
            >
              <p
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: 'var(--clay)',
                  fontWeight: 'var(--weight-bold)',
                  marginBottom: '0.4rem',
                }}
              >
                {t('auth.forgot.devMode')}
              </p>
              <p>
                {t('auth.forgot.devModeBody')}{' '}
                <Link to={resetWithToken} className={formStyles.linkInline}>
                  {t('auth.forgot.devModeCta')}
                </Link>
              </p>
            </div>
          )}
        </div>
      )}

      <div className={formStyles.foot}>
        <span className={formStyles.footLabel}>{t('auth.forgot.rememberPrompt')}</span>
        <Link to={ROUTES.LOGIN} className={formStyles.linkInline}>
          {t('auth.forgot.backToLogin')}
        </Link>
      </div>
    </AuthLayout>
  );
}
