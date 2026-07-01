import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Input from '@/components/common/Input/Input';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { register } from '@/services/auth';
import { isEmail, isNonEmpty, isStrongPassword } from '@/utils/validators';
import { ROUTES } from '@/constants/routes';
import AuthLayout from './AuthLayout';
import { authErrorMessage } from './firebaseAuthErrors';
import formStyles from './AuthForm.module.css';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const { notify } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const target = isAdmin ? ROUTES.ADMIN : ROUTES.DASHBOARD;
      navigate(target, { replace: true });
    }
  }, [user, loading, isAdmin, navigate]);

  function validate() {
    const next = {};
    if (!isNonEmpty(displayName) || displayName.trim().length < 2) {
      next.displayName = t('auth.register.errorName');
    }
    if (!isEmail(email)) next.email = t('auth.register.errorEmail');
    if (!isStrongPassword(password)) {
      next.password = t('auth.register.errorPassword');
    }
    if (password !== confirm) {
      next.confirm = t('auth.register.errorConfirm');
    }
    if (!acceptTerms) {
      next.terms = t('auth.register.errorTerms');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const newUser = await register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
      });
      notify({
        tone: 'success',
        title: t('auth.register.welcomeTitle'),
        body: t('auth.register.welcomeBody'),
      });
      const target = newUser?.role === 'admin' ? ROUTES.ADMIN : ROUTES.DASHBOARD;
      navigate(target, { replace: true });
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const BULLETS = [
    t('auth.register.bullet1'),
    t('auth.register.bullet2'),
    t('auth.register.bullet3'),
  ];

  return (
    <AuthLayout
      eyebrow={t('auth.register.eyebrow')}
      headline={
        <>
          {t('auth.register.headline1')}
          <em>{t('auth.register.headlineEm')}</em>
          {t('auth.register.headline2')}
        </>
      }
      manifesto={t('auth.register.manifesto')}
      bullets={BULLETS}
    >
      <header className={formStyles.head}>
        <p className={formStyles.eyebrow}>{t('auth.register.formEyebrow')}</p>
        <h2 className={formStyles.title}>
          {t('auth.register.formTitle1')}
          <em>{t('auth.register.formTitleEm')}</em>
          {t('auth.register.formTitle2')}
        </h2>
        <p className={formStyles.subtitle}>{t('auth.register.formSubtitle')}</p>
      </header>

      <form className={formStyles.form} onSubmit={onSubmit} noValidate>
        {formError && (
          <div className={formStyles.formError} role="alert">
            {formError}
          </div>
        )}

        <p className={formStyles.adminNote}>
          {t('auth.register.adminNoteBefore')}
          <strong>{t('auth.register.adminNoteEm')}</strong>
          {t('auth.register.adminNoteAfter')}
        </p>

        <Input
          label={t('auth.register.nameLabel')}
          type="text"
          autoComplete="name"
          placeholder={t('auth.register.namePlaceholder')}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={errors.displayName}
          required
          disabled={submitting}
        />

        <Input
          label={t('auth.login.emailLabel')}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={t('auth.login.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
          disabled={submitting}
        />

        <div className={formStyles.row}>
          <Input
            label={t('auth.login.passwordLabel')}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            hint={t('auth.register.passwordHint')}
            required
            disabled={submitting}
          />
          <Input
            label={t('auth.register.confirmLabel')}
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
            required
            disabled={submitting}
          />
        </div>

        <Terms
          checked={acceptTerms}
          onChange={setAcceptTerms}
          error={errors.terms}
          disabled={submitting}
          label={t('auth.register.termsText')}
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
              <Spinner size={18} label="" /> {t('auth.register.submitting')}
            </>
          ) : (
            <>{t('auth.register.submit')}</>
          )}
        </Button>
      </form>

      <div className={formStyles.foot}>
        <span className={formStyles.footLabel}>{t('auth.register.haveAccount')}</span>
        <Link to={ROUTES.LOGIN} className={formStyles.linkInline}>
          {t('auth.register.signIn')}
        </Link>
      </div>
    </AuthLayout>
  );
}

function Terms({ checked, onChange, error, disabled, label }) {
  return (
    <label className="termsBox" style={{ display: 'block' }}>
      <span
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.65rem',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--fs-xs)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--ink-soft)',
          lineHeight: 1.55,
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '0.85rem 1rem',
          border: '2px solid var(--ink)',
          background: 'var(--paper)',
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          style={{
            marginTop: '2px',
            width: '16px',
            height: '16px',
            accentColor: 'var(--clay)',
            flexShrink: 0,
          }}
        />
        <span>{label}</span>
      </span>
      {error && (
        <span
          role="alert"
          style={{
            display: 'block',
            marginTop: '0.4rem',
            fontSize: 'var(--fs-xs)',
            color: 'var(--alert)',
            fontWeight: 'var(--weight-medium)',
          }}
        >
          {error}
        </span>
      )}
    </label>
  );
}
