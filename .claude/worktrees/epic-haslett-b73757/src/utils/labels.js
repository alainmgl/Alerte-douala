import i18n from '@/i18n';
import { DISASTER_TYPES } from '@/constants/disasterTypes';
import { DOUALA_ZONES } from '@/constants/doualaZones';
import { SEVERITY_LEVELS } from '@/constants/severityLevels';

const ZONES_BY_ID = Object.fromEntries(DOUALA_ZONES.map((z) => [z.id, z]));

// Les noms de quartiers de Douala sont des toponymes — on les laisse tels quels
// dans les deux langues. La carte garde "Akwa", "Bonabéri", etc.
export function zoneName(quartierId) {
  return ZONES_BY_ID[quartierId]?.name ?? quartierId;
}

export function zoneById(quartierId) {
  return ZONES_BY_ID[quartierId] ?? null;
}

// Label localisé d'un type de catastrophe. Fallback : le label fr du constant
// (qui reste la source de vérité côté backend et seed).
export function disasterLabel(typeId) {
  const fallback = DISASTER_TYPES[typeId]?.label ?? typeId;
  return i18n.t(`domain.disasterType.${typeId}`, { defaultValue: fallback });
}

export function disasterDescription(typeId) {
  const fallback = DISASTER_TYPES[typeId]?.description ?? '';
  return i18n.t(`domain.disasterTypeDesc.${typeId}`, { defaultValue: fallback });
}

// Renvoie { id, color, label localisé } pour un niveau de gravité.
export function severityInfo(severityId) {
  const base = SEVERITY_LEVELS[severityId] ?? SEVERITY_LEVELS.low;
  return {
    ...base,
    label: i18n.t(`domain.severity.${base.id}`, { defaultValue: base.label }),
  };
}

export function severityFromAlertLevel(level) {
  if (level === 'critical') return 'critical';
  if (level === 'warning') return 'medium';
  return 'low';
}

export function inferDisasterTypeFromSensor() {
  // Tous les capteurs actuels mesurent le risque inondation.
  return 'flood';
}

// Helpers supplémentaires pour les autres taxonomies du domaine.
export function sensorTypeLabel(id) {
  return i18n.t(`domain.sensorType.${id}`, { defaultValue: id });
}
export function sensorTypeShort(id) {
  return i18n.t(`domain.sensorTypeShort.${id}`, { defaultValue: id });
}
export function sensorTypeDescription(id) {
  return i18n.t(`domain.sensorTypeDesc.${id}`, { defaultValue: '' });
}
export function sensorStatusLabel(id) {
  return i18n.t(`domain.sensorStatus.${id}`, { defaultValue: id });
}
export function alertLevelLabel(id) {
  return i18n.t(`domain.alertLevel.${id}`, { defaultValue: id });
}
export function disasterStatusLabel(id) {
  return i18n.t(`domain.disasterStatus.${id}`, { defaultValue: id });
}
export function riskLevelLabel(id) {
  return i18n.t(`domain.riskLevel.${id}`, { defaultValue: id });
}
export function sourceLabel(id) {
  return i18n.t(`domain.source.${id}`, { defaultValue: id });
}
