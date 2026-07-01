import { useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '@/components/common/Button/Button';
import Input from '@/components/common/Input/Input';
import Spinner from '@/components/common/Spinner/Spinner';
import DashboardLayout from '@/components/layout/DashboardLayout/DashboardLayout';
import useCamera from '@/hooks/useCamera';
import { useToast } from '@/contexts/ToastContext';
import { ROUTES } from '@/constants/routes';
import { DOUALA_ZONES } from '@/constants/doualaZones';
import { DISASTER_TYPE_LIST } from '@/constants/disasterTypes';
import { SEVERITY_LIST } from '@/constants/severityLevels';
import { createDisaster } from '@/services/api';
import { classNames } from '@/utils/formatters';
import { shrinkDataUrl } from '@/utils/image';
import { DISASTER_TITLE_MAX, DISASTER_DESCRIPTION_MAX } from '@/constants/formLimits';
import { disasterLabel, disasterDescription, severityInfo } from '@/utils/labels';
import styles from './Report.module.css';

const TITLE_MAX = DISASTER_TITLE_MAX;
const DESC_MAX = DISASTER_DESCRIPTION_MAX;

export default function Report() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const navigate = useNavigate();

  const NAV_ITEMS = [
    { to: ROUTES.DASHBOARD, label: t('dashboard.navHome'), icon: '◆', end: true },
    { to: ROUTES.ALERTS, label: t('dashboard.navAlerts'), icon: '!' },
    { to: ROUTES.MAP, label: t('dashboard.navMap'), icon: '◉' },
    { to: ROUTES.REPORT, label: t('dashboard.navReport'), icon: '+' },
    { to: ROUTES.PROFILE, label: t('dashboard.navProfile'), icon: '·' },
  ];
  const camera = useCamera({ facingMode: 'environment' });
  const fallbackInputId = useId();

  const [type, setType] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formRef = useRef(null);

  // When the camera is denied/unsupported the user falls back to a file picker.
  function onFallbackFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') camera.setExternalPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function validate() {
    const next = {};
    if (!type) next.type = t('reportForm.selectType');
    if (!zoneId) next.zone = t('reportForm.selectZone');
    if (!severity) next.severity = t('reportForm.selectSeverity');
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 4) next.title = t('reportForm.titleTooShort');
    else if (trimmedTitle.length > TITLE_MAX)
      next.title = t('reportForm.titleTooLong', { max: TITLE_MAX });
    const d = description.trim();
    if (d.length < 10) next.description = t('reportForm.descriptionTooShort');
    else if (d.length > DESC_MAX)
      next.description = t('reportForm.descriptionTooLong', { max: DESC_MAX });
    if (!camera.photoDataUrl) next.photo = t('reportForm.photoRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) {
      setFormError(t('reportForm.checkFields'));
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setSubmitting(true);
    try {
      const photoDataUrl = await shrinkDataUrl(camera.photoDataUrl, {
        maxWidth: 1280,
        quality: 0.75,
      });
      await createDisaster({
        type,
        quartierId: zoneId,
        severity,
        title: title.trim(),
        description: description.trim(),
        address: address.trim() || null,
        photoDataUrl,
      });
      camera.reset();
      notify({
        tone: 'success',
        title: t('report.successTitle'),
        body: t('report.successBody'),
      });
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setFormError(err?.message || t('report.errorGeneric'));
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout
      navItems={NAV_ITEMS}
      eyebrow={t('report.eyebrow')}
      title={t('report.title')}
      tone="user"
    >
      <section className={styles.intro}>
        <p className={styles.lead}>{t('report.lead')}</p>
      </section>

      <form ref={formRef} className={styles.form} onSubmit={onSubmit} noValidate>
        {/* Étape 1 — Photo */}
        <section className={styles.panel} aria-labelledby="step-photo-title">
          <header className={styles.panelHead}>
            <h2 id="step-photo-title" className={styles.panelTitle}>
              {t('reportForm.step1Title')}
            </h2>
            <span className={styles.panelHint}>{t('common.required')}</span>
          </header>

          <div className={styles.panelBody}>
            <div className={styles.cameraStage} aria-live="polite">
              {camera.status === 'streaming' && (
                <video
                  ref={camera.videoRef}
                  className={styles.video}
                  autoPlay
                  playsInline
                  muted
                />
              )}
              {camera.status === 'captured' && camera.photoDataUrl && (
                <img
                  src={camera.photoDataUrl}
                  alt={t('reportForm.previewAlt')}
                  className={styles.preview}
                />
              )}
              {(camera.status === 'idle' || camera.status === 'requesting') && (
                <div className={styles.placeholder}>
                  <span className={styles.placeholderGlyph} aria-hidden="true">◉</span>
                  <span>
                    {camera.status === 'requesting'
                      ? t('common.loading')
                      : t('reportForm.openCamera')}
                  </span>
                </div>
              )}
              {(camera.status === 'denied' || camera.status === 'error') && (
                <div className={styles.placeholder}>
                  <span className={styles.placeholderGlyph} aria-hidden="true">⚠</span>
                  <span>{t('reportForm.permissionTitle')}</span>
                </div>
              )}
              {camera.status === 'unsupported' && (
                <div className={styles.placeholder}>
                  <span className={styles.placeholderGlyph} aria-hidden="true">📷</span>
                  <span>{t('reportForm.permissionDefault')}</span>
                </div>
              )}
              <canvas ref={camera.canvasRef} className={styles.canvas} aria-hidden="true" />
            </div>

            {/* Camera controls */}
            <div className={styles.cameraActions}>
              {camera.status === 'idle' && (
                <Button type="button" variant="primary" onClick={camera.start}>
                  {t('reportForm.openCamera')}
                </Button>
              )}
              {camera.status === 'requesting' && (
                <span className={styles.requesting}>
                  <Spinner size={18} /> {t('common.loading')}
                </span>
              )}
              {camera.status === 'streaming' && (
                <>
                  <Button type="button" variant="primary" onClick={camera.capture}>
                    {t('reportForm.capture')}
                  </Button>
                  <Button type="button" variant="ghost" onClick={camera.reset}>
                    {t('reportForm.cancel')}
                  </Button>
                </>
              )}
              {camera.status === 'captured' && (
                <Button type="button" variant="outline" onClick={camera.retake}>
                  {t('reportForm.retake')}
                </Button>
              )}
              {(camera.status === 'denied' || camera.status === 'error') && (
                <Button type="button" variant="primary" onClick={camera.start}>
                  {t('common.refresh')}
                </Button>
              )}
            </div>

            {(camera.status === 'denied' ||
              camera.status === 'error' ||
              camera.status === 'unsupported') && (
              <div className={styles.permError} role="alert">
                <p className={styles.permErrorEyebrow}>{t('reportForm.permissionTitle')}</p>
                <p className={styles.permErrorBody}>
                  {camera.error || t('reportForm.permissionDefault')}
                </p>
                <label htmlFor={fallbackInputId} className={styles.fallbackLabel}>
                  {t('reportForm.fallbackLabel')}
                </label>
                <input
                  id={fallbackInputId}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onFallbackFile}
                  className={styles.fallbackInput}
                />
              </div>
            )}

            {errors.photo && (
              <p className={styles.fieldError} role="alert">
                {errors.photo}
              </p>
            )}
          </div>
        </section>

        {/* Étape 2 — Détails */}
        <section className={styles.panel} aria-labelledby="step-details-title">
          <header className={styles.panelHead}>
            <h2 id="step-details-title" className={styles.panelTitle}>
              {t('reportForm.step2Title')}
            </h2>
          </header>

          <div className={styles.panelBody}>
            {/* Type de catastrophe */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.fieldLabel}>{t('reportForm.labelType')}</legend>
              <div
                className={styles.pillGrid}
                role="radiogroup"
                aria-label={t('reportForm.labelType')}
              >
                {DISASTER_TYPE_LIST.map((dt) => {
                  const selected = type === dt.id;
                  return (
                    <label
                      key={dt.id}
                      className={classNames(styles.pill, selected && styles.pillSelected)}
                    >
                      <input
                        type="radio"
                        name="disasterType"
                        value={dt.id}
                        checked={selected}
                        onChange={() => setType(dt.id)}
                        className={styles.pillInput}
                      />
                      <span className={styles.pillTitle}>{disasterLabel(dt.id)}</span>
                      <span className={styles.pillDesc}>{disasterDescription(dt.id)}</span>
                    </label>
                  );
                })}
              </div>
              {errors.type && (
                <p className={styles.fieldError} role="alert">
                  {errors.type}
                </p>
              )}
            </fieldset>

            {/* Quartier */}
            <div className={styles.field}>
              <label htmlFor="zoneSelect" className={styles.fieldLabel}>
                {t('reportForm.labelZone')}
              </label>
              <select
                id="zoneSelect"
                className={classNames(styles.select, errors.zone && styles.selectError)}
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
              >
                <option value="">— {t('reportForm.labelZone')} —</option>
                {DOUALA_ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} — {z.arrondissement}
                  </option>
                ))}
              </select>
              {errors.zone && (
                <p className={styles.fieldError} role="alert">
                  {errors.zone}
                </p>
              )}
            </div>

            {/* Sévérité */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.fieldLabel}>{t('reportForm.labelSeverity')}</legend>
              <div
                className={styles.severityGrid}
                role="radiogroup"
                aria-label={t('reportForm.labelSeverity')}
              >
                {SEVERITY_LIST.map((s) => {
                  const selected = severity === s.id;
                  const info = severityInfo(s.id);
                  return (
                    <label
                      key={s.id}
                      className={classNames(
                        styles.severityPill,
                        selected && styles.severityPillSelected,
                      )}
                      style={selected ? { background: s.color, borderColor: s.color } : undefined}
                    >
                      <input
                        type="radio"
                        name="severity"
                        value={s.id}
                        checked={selected}
                        onChange={() => setSeverity(s.id)}
                        className={styles.pillInput}
                      />
                      <span>{info.label}</span>
                    </label>
                  );
                })}
              </div>
              {errors.severity && (
                <p className={styles.fieldError} role="alert">
                  {errors.severity}
                </p>
              )}
            </fieldset>

            {/* Titre */}
            <Input
              label={t('reportForm.labelTitle')}
              placeholder={t('reportForm.titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
              error={errors.title}
              maxLength={TITLE_MAX}
            />

            {/* Description */}
            <div className={classNames(styles.field, errors.description && styles.fieldErrored)}>
              <label htmlFor="descTextarea" className={styles.fieldLabel}>
                {t('reportForm.labelDescription')}
              </label>
              <textarea
                id="descTextarea"
                className={styles.textarea}
                placeholder={t('reportForm.descriptionPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
                rows={6}
              />
              <div className={styles.counterRow}>
                {errors.description ? (
                  <p className={styles.fieldError} role="alert">
                    {errors.description}
                  </p>
                ) : (
                  <span className={styles.counterHint}>{t('reportForm.descriptionPlaceholder')}</span>
                )}
                <span className={styles.counter}>
                  {t('reportForm.charsCounter', { count: description.length, max: DESC_MAX })}
                </span>
              </div>
            </div>

            {/* Adresse */}
            <Input
              label={t('reportForm.labelAddress')}
              placeholder={t('reportForm.addressPlaceholder')}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </section>

        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}

        <div className={styles.submitRow}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            disabled={submitting}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" size="lg" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner size={18} /> {t('reportForm.submitting')}
              </>
            ) : (
              <>{t('reportForm.submit')} →</>
            )}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
