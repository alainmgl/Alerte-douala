import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Input from '@/components/common/Input/Input';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { useToast } from '@/contexts/ToastContext';
import { confirmPasswordReset } from '@/services/auth';
import { isStrongPassword } from '@/utils/validators';
import { USER_PASSWORD_MIN } from '@/constants/formLimits';
import { ROUTES } from '@/constants/routes';
import AuthLayout from './AuthLayout';
import { authErrorMessage } from './firebaseAuthErrors';
import formStyles from './AuthForm.module.css';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useToast();

  const initialToken = useMemo(() => (params.get('token') || '').trim(), [params]);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};
    if (!token || token.length < 16) {
      next.token = t('auth.reset.errorToken');
    }
    if (!isStrongPassword(password)) {
      next.password = t('auth.reset.errorPasswordWeak', { min: USER_PASSWORD_MIN });
    }
    if (password !== confirm) {
      next.confirm = t('auth.reset.errorMismatch');
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
      await confirmPasswordReset({ token, password });
      notify({
        tone: 'success',
        title: t('auth.reset.successTitle'),
        body: t('auth.reset.successBody'),
      });
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const BULLETS = [
    t('auth.reset.bullet1'),
    t('auth.reset.bullet2'),
    t('auth.reset.bullet3'),
  ];

  return (
    <AuthLayout
      eyebrow={t('auth.reset.eyebrow')}
      headline={
        <>
          {t('auth.reset.headline1')}
          <em>{t('auth.reset.headlineEm')}</em>
          {t('auth.reset.headline2')}
        </>
      }
      manifesto={t('auth.reset.manifesto')}
      bullets={BULLETS}
    >
      <header className={formStyles.head}>
        <p className={formStyles.eyebrow}>{t('auth.reset.formEyebrow')}</p>
        <h2 className={formStyles.title}>
          {t('auth.reset.formTitle1')}
          <em>{t('auth.reset.formTitleEm')}</em>
          {t('auth.reset.formTitle2')}
        </h2>
        <p className={formStyles.subtitle}>{t('auth.reset.formSubtitle')}</p>
      </header>

      <form className={formStyles.form} onSubmit={onSubmit} noValidate>
        {formError && (
          <div className={formStyles.formError} role="alert">
            {formError}
          </div>
        )}

        {!initialToken && (
          <Input
            label={t('auth.reset.tokenLabel')}
            type="text"
            autoComplete="off"
            placeholder={t('auth.reset.tokenPlaceholder')}
            value={token}
            onChange={(e) => setToken(e.target.value.trim())}
            error={errors.token}
            required
            disabled={submitting}
          />
        )}

        <div className={formStyles.row}>
          <Input
            label={t('auth.reset.newPasswordLabel')}
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
              <Spinner size={18} label="" /> {t('auth.reset.submitting')}
            </>
          ) : (
            <>{t('auth.reset.submit')}</>
          )}
        </Button>
      </form>

      <div className={formStyles.foot}>
        <span className={formStyles.footLabel}>{t('auth.forgot.rememberPrompt')}</span>
        <Link to={ROUTES.LOGIN} className={formStyles.linkInline}>
          {t('auth.forgot.backToLogin')}
        </Link>
      </div>
    </AuthLayout>
  );
}
