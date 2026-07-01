import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Input from '@/components/common/Input/Input';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { signIn } from '@/services/auth';
import { isEmail, isNonEmpty } from '@/utils/validators';
import { ROUTES } from '@/constants/routes';
import AuthLayout from './AuthLayout';
import { authErrorMessage } from './firebaseAuthErrors';
import formStyles from './AuthForm.module.css';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, isAdmin } = useAuth();
  const { notify } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const fallback = isAdmin ? ROUTES.ADMIN : ROUTES.DASHBOARD;
      const redirectTo = location.state?.from ?? fallback;
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, isAdmin, navigate, location.state]);

  function validate() {
    const next = {};
    if (!isEmail(email)) next.email = t('auth.login.errorEmail');
    if (!isNonEmpty(password)) next.password = t('auth.login.errorPassword');
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const signedInUser = await signIn({ email: email.trim(), password });
      notify({
        tone: 'success',
        title: t('auth.login.welcomeTitle'),
        body: t('auth.login.welcomeBody'),
      });
      const fallback = signedInUser?.role === 'admin' ? ROUTES.ADMIN : ROUTES.DASHBOARD;
      const redirectTo = location.state?.from ?? fallback;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setFormError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const BULLETS = [
    t('auth.login.bullet1'),
    t('auth.login.bullet2'),
    t('auth.login.bullet3'),
  ];

  return (
    <AuthLayout
      eyebrow={t('auth.login.eyebrow')}
      headline={
        <>
          {t('auth.login.headline1')}
          <em>{t('auth.login.headlineEm')}</em>
          {t('auth.login.headline2')}
        </>
      }
      manifesto={t('auth.login.manifesto')}
      bullets={BULLETS}
    >
      <header className={formStyles.head}>
        <p className={formStyles.eyebrow}>{t('auth.login.formEyebrow')}</p>
        <h2 className={formStyles.title}>
          {t('auth.login.formTitle1')}
          <em>{t('auth.login.formTitleEm')}</em>
          {t('auth.login.formTitle2')}
        </h2>
        <p className={formStyles.subtitle}>{t('auth.login.formSubtitle')}</p>
      </header>

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
          error={errors.email}
          required
          disabled={submitting}
        />

        <Input
          label={t('auth.login.passwordLabel')}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
          disabled={submitting}
        />

        <div className={formStyles.aside}>
          <span className={formStyles.helper}>{t('auth.login.forgotPassword')}</span>
          <Link to={ROUTES.FORGOT_PASSWORD} className={formStyles.linkInline}>
            {t('auth.login.forgotPasswordCta')}
          </Link>
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
              <Spinner size={18} label="" /> {t('auth.login.submitting')}
            </>
          ) : (
            <>{t('auth.login.submit')}</>
          )}
        </Button>
      </form>

      <div className={formStyles.foot}>
        <span className={formStyles.footLabel}>{t('auth.login.noAccount')}</span>
        <Link to={ROUTES.REGISTER} className={formStyles.linkInline}>
          {t('auth.login.createAccount')}
        </Link>
      </div>
    </AuthLayout>
  );
}
