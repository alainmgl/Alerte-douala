/* eslint-disable */
// Génère docs/cahier-des-charges.docx à partir du contenu du cahier des charges Alerte Douala.
// Usage : node scripts/generate-cdc-docx.cjs

const fs = require('fs');
const path = require('path');

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, ExternalHyperlink,
  InternalHyperlink, Bookmark, TabStopType, TabStopPosition,
  TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, PageOrientation,
} = require('docx');

// ===== TOKENS DE STYLE =====
const COLOR = {
  green: '1E4D3B',       // vert mangrove
  greenLight: 'D4E4DC',
  cream: 'F4ECD8',
  terracotta: 'C46A3E',
  red: 'D7263D',
  ink: '0E0E0E',
  gray: '666666',
  grayLight: 'CCCCCC',
  grayBg: 'F2F2F2',
};

const FONT_HEAD = 'Calibri';
const FONT_BODY = 'Calibri';
const FONT_MONO = 'Consolas';

// ===== HELPERS =====
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 300 },
    ...opts,
    children: opts.children || [new TextRun({ text, font: FONT_BODY, size: 22, color: COLOR.ink })],
  });
}

function h1(text, bookmarkId) {
  const runs = [new TextRun({ text, font: FONT_HEAD, size: 44, bold: true, color: COLOR.green })];
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 240 },
    pageBreakBefore: false,
    children: bookmarkId
      ? [new Bookmark({ id: bookmarkId, children: runs })]
      : runs,
  });
}

function h2(text, bookmarkId) {
  const runs = [new TextRun({ text, font: FONT_HEAD, size: 30, bold: true, color: COLOR.green })];
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
    children: bookmarkId
      ? [new Bookmark({ id: bookmarkId, children: runs })]
      : runs,
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: FONT_HEAD, size: 24, bold: true, color: COLOR.terracotta })],
  });
}

function h4(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_4,
    spacing: { before: 180, after: 100 },
    children: [new TextRun({ text, font: FONT_HEAD, size: 22, bold: true, italics: true, color: COLOR.ink })],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { after: 80 },
    children: parseInline(text),
  });
}

function num(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'numbers', level },
    spacing: { after: 80 },
    children: parseInline(text),
  });
}

function quote(text) {
  return new Paragraph({
    spacing: { before: 180, after: 180 },
    indent: { left: 360 },
    border: { left: { style: BorderStyle.SINGLE, size: 24, color: COLOR.green, space: 12 } },
    children: [new TextRun({ text, font: FONT_BODY, size: 22, italics: true, color: COLOR.gray })],
  });
}

// Parse inline syntax: **bold**, `code`, [text](url)
function parseInline(text) {
  const runs = [];
  let remaining = text;
  const regex = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/;
  while (remaining.length > 0) {
    const match = remaining.match(regex);
    if (!match) {
      runs.push(new TextRun({ text: remaining, font: FONT_BODY, size: 22, color: COLOR.ink }));
      break;
    }
    if (match.index > 0) {
      runs.push(new TextRun({ text: remaining.slice(0, match.index), font: FONT_BODY, size: 22, color: COLOR.ink }));
    }
    if (match[2]) {
      runs.push(new TextRun({ text: match[2], font: FONT_BODY, size: 22, bold: true, color: COLOR.ink }));
    } else if (match[4]) {
      runs.push(new TextRun({ text: match[4], font: FONT_MONO, size: 20, color: COLOR.terracotta }));
    } else if (match[6]) {
      runs.push(new ExternalHyperlink({
        link: match[7],
        children: [new TextRun({ text: match[6], font: FONT_BODY, size: 22, color: '0563C1', underline: { type: 'single' } })],
      }));
    }
    remaining = remaining.slice(match.index + match[0].length);
  }
  return runs.length ? runs : [new TextRun({ text, font: FONT_BODY, size: 22 })];
}

function code(text) {
  const lines = text.split('\n');
  return lines.map((line, i) => new Paragraph({
    spacing: { after: i === lines.length - 1 ? 180 : 0, before: i === 0 ? 120 : 0 },
    shading: { fill: COLOR.grayBg, type: ShadingType.CLEAR },
    children: [new TextRun({ text: line || ' ', font: FONT_MONO, size: 18, color: COLOR.ink })],
  }));
}

// ===== TABLE HELPER =====
const BORDER = { style: BorderStyle.SINGLE, size: 4, color: COLOR.grayLight };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function tableCell(text, opts = {}) {
  return new TableCell({
    borders: BORDERS,
    width: { size: opts.width, type: WidthType.DXA },
    shading: opts.header
      ? { fill: COLOR.green, type: ShadingType.CLEAR }
      : opts.shade
      ? { fill: COLOR.greenLight, type: ShadingType.CLEAR }
      : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [new Paragraph({
      spacing: { after: 0 },
      children: parseInline(text).map((r) => {
        if (opts.header && r.constructor.name === 'TextRun') {
          // recreate with white bold
          return new TextRun({ text: r.options?.text || '', font: FONT_BODY, size: 20, bold: true, color: 'FFFFFF' });
        }
        return r;
      }),
    })],
  });
}

// Build table from header + rows arrays. cols = column widths in DXA (must sum to 9360 for US Letter w/ 1" margins).
function makeTable(headers, rows, cols) {
  const totalWidth = cols.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: cols,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => tableCell(h, { width: cols[i], header: true })),
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((c, i) => tableCell(String(c), { width: cols[i], shade: ri % 2 === 1 })),
      })),
    ],
  });
}

function spacer(size = 200) {
  return new Paragraph({ spacing: { after: size }, children: [new TextRun({ text: '' })] });
}

// =====================================================
// CONTENU DU CAHIER DES CHARGES
// =====================================================

const children = [];

// ---------- PAGE DE GARDE ----------
children.push(
  new Paragraph({ spacing: { before: 2000, after: 400 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'CAHIER DES CHARGES', font: FONT_HEAD, size: 56, bold: true, color: COLOR.green })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [new TextRun({ text: 'Alerte Douala', font: FONT_HEAD, size: 72, bold: true, color: COLOR.terracotta })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [new TextRun({ text: 'Plateforme citoyenne PWA + capteurs IoT pour la prévention des catastrophes naturelles',
      font: FONT_BODY, size: 24, italics: true, color: COLOR.gray })] }),
  spacer(800),
);

// Tableau métadonnées
children.push(makeTable(
  ['Champ', 'Valeur'],
  [
    ['Nom du projet', 'Alerte Douala'],
    ['Version', '1.0'],
    ['Date', 'Mai 2026'],
    ['Statut', 'Document de référence — soutenance académique'],
    ['Audience', 'Encadrant·e académique / jury de soutenance'],
    ['Langue', 'Français'],
    ['Couverture', '12 quartiers de Douala (Cameroun)'],
  ],
  [3000, 6360],
));

children.push(new Paragraph({ pageBreakBefore: true, children: [] }));

// ---------- TABLE DES MATIÈRES ----------
children.push(
  new Paragraph({ spacing: { after: 400 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Table des matières', font: FONT_HEAD, size: 40, bold: true, color: COLOR.green })] }),
  new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// ============================================================
// SECTION 1 — PRÉAMBULE ET GLOSSAIRE
// ============================================================
children.push(h1('1. Préambule et glossaire'));

children.push(h2('1.1 Objet du document'));
children.push(p('', { children: parseInline(
  'Le présent cahier des charges décrit de manière **précise et explicite** l\'ensemble des besoins, contraintes, fonctionnalités, spécifications techniques, ressources et critères de réussite du projet **Alerte Douala**. Il sert de document contractuel et pédagogique entre l\'étudiant·e porteur·euse, son encadrant·e et le jury de soutenance.'
) }));
children.push(p('', { children: parseInline(
  'Toute fonctionnalité ou contrainte non mentionnée dans ce document est considérée comme **hors périmètre** de la version 1.0 du projet.'
) }));

children.push(h2('1.2 Glossaire métier'));
children.push(makeTable(
  ['Terme', 'Définition'],
  [
    ['Signalement / Disaster', 'Déclaration d\'un événement (inondation, glissement, incendie, tempête, autre) par un·e citoyen·ne ou un capteur IoT.'],
    ['Validation', 'Acte par lequel un administrateur confirme qu\'un signalement est réel et publiable.'],
    ['Rejet', 'Acte par lequel un administrateur écarte un signalement (faux, doublon, hors périmètre).'],
    ['Quartier / Zone', 'Subdivision géographique de Douala parmi les 12 retenues.'],
    ['Sévérité', 'Niveau de gravité d\'un signalement : low, medium, high, critical.'],
    ['Capteur / Sensor', 'Dispositif ESP32 installé sur le terrain, qui transmet en continu des mesures.'],
    ['Lecture / Reading', 'Une mesure horodatée envoyée par un capteur.'],
    ['Alerte auto-générée', 'Disaster créé automatiquement par le backend quand un capteur dépasse un seuil critique.'],
    ['Cooldown', 'Délai minimum entre deux alertes auto pour un même capteur (30 min).'],
  ],
  [2600, 6760],
));

children.push(h2('1.3 Glossaire technique'));
children.push(makeTable(
  ['Acronyme', 'Signification'],
  [
    ['PWA', 'Progressive Web App — application web installable, offline-capable.'],
    ['JWT', 'JSON Web Token — jeton d\'authentification signé.'],
    ['SSE', 'Server-Sent Events — flux HTTP unidirectionnel serveur → client.'],
    ['VAPID', 'Voluntary Application Server Identification — clés pour Web Push.'],
    ['REST', 'Representational State Transfer — architecture d\'API HTTP.'],
    ['CORS', 'Cross-Origin Resource Sharing — politique d\'accès navigateur.'],
    ['MCU', 'Microcontroller Unit — microcontrôleur (ici ESP32).'],
    ['GPIO', 'General Purpose Input/Output — broche d\'entrée/sortie.'],
    ['ADC', 'Analog-to-Digital Converter — convertisseur analogique-numérique.'],
    ['OSM', 'OpenStreetMap — fond cartographique libre.'],
    ['Bcrypt', 'Algorithme de hachage de mots de passe.'],
    ['OWASP', 'Open Web Application Security Project — référentiel sécurité.'],
  ],
  [2000, 7360],
));

// ============================================================
// SECTION 2 — PRÉSENTATION DU PROJET
// ============================================================
children.push(h1('2. Présentation du projet'));

children.push(h2('2.1 Contexte général'));
children.push(p('Douala, capitale économique du Cameroun (≈ 3,7 millions d\'habitants), est exposée à plusieurs risques naturels récurrents :'));
children.push(bullet('**Inondations** : durant la saison des pluies (mai → octobre), les bassins versants du Wouri saturent, les drains coloniaux sous-dimensionnés débordent ; plusieurs quartiers (Bépanda, New Bell, Bonabéri, Ndogpassi) sont régulièrement submergés.'));
children.push(bullet('**Glissements de terrain** : les coteaux urbanisés sans étude géotechnique (Logbessou, PK Axe Lourd) cèdent après de fortes précipitations.'));
children.push(bullet('**Incendies urbains** : densité d\'habitat, installations électriques précaires, marchés à risque (Sandaga, Mboppi).'));
children.push(bullet('**Tempêtes côtières** : vents violents, dégâts sur l\'habitat léger.'));
children.push(p('Les services municipaux et de protection civile manquent d\'outil temps réel pour collecter, qualifier et diffuser ces alertes. Les citoyen·ne·s, malgré des smartphones largement diffusés, n\'ont pas de canal unique pour signaler et s\'informer.'));

children.push(h2('2.2 Problématique'));
children.push(quote('Comment outiller à la fois les citoyen·ne·s, l\'administration locale et le terrain (capteurs) pour détecter, valider et diffuser en temps réel les catastrophes naturelles à Douala, malgré les contraintes de connectivité, d\'électricité et de littératie numérique ?'));
children.push(p('Trois sous-problèmes :'));
children.push(num('**Collecte fragmentée** : les signalements circulent via WhatsApp, Facebook, radios — dispersés, non vérifiés, non géolocalisés.'));
children.push(num('**Absence de mesure objective** : les autorités réagissent après le pic, faute de capteurs hydrométéorologiques accessibles.'));
children.push(num('**Pas de diffusion coordonnée** : aucune notification temps réel ciblée par zone n\'existe à destination du public.'));

children.push(h2('2.3 Objectifs'));
children.push(h3('Objectif général'));
children.push(p('', { children: parseInline(
  'Concevoir et déployer une **plateforme web installable (PWA) + un réseau de capteurs IoT bas coût** permettant à toute personne disposant d\'un smartphone de **signaler**, **consulter** et **être notifiée** des catastrophes naturelles à Douala, avec une **validation administrative** et une **détection automatique** sur seuils capteur.'
) }));

children.push(h3('Objectifs spécifiques'));
children.push(makeTable(
  ['Code', 'Objectif spécifique', 'Indicateur de réussite'],
  [
    ['OS-1', 'Permettre à tout·e citoyen·ne authentifié·e de signaler une catastrophe en moins de 90 secondes, photo comprise.', 'Temps moyen ≤ 90 s sur 20 sessions pilote.'],
    ['OS-2', 'Faire valider/rejeter chaque signalement par un·e admin en moins de 24 h.', '90 % des signalements traités en < 24 h.'],
    ['OS-3', 'Déployer 6 capteurs ESP32 dans 6 quartiers représentatifs.', '6 capteurs opérationnels 90 % du temps.'],
    ['OS-4', 'Détecter et diffuser une alerte capteur en moins de 2 secondes.', 'Latence p95 ≤ 2 s en intégration.'],
    ['OS-5', 'Cartographier les zones à risque sur une carte Leaflet interactive.', 'Carte fonctionnelle avec ≥ 3 niveaux de risque.'],
  ],
  [900, 4500, 3960],
));

children.push(h2('2.4 Public cible'));
children.push(makeTable(
  ['Acteur', 'Profil', 'Besoin principal'],
  [
    ['Citoyen·ne lambda', 'Habitant·e de Douala, smartphone Android/iPhone, connexion 3G/4G intermittente.', 'Signaler facilement, recevoir des alertes pertinentes.'],
    ['Administrateur·ice', 'Agent mairie ou protection civile, ordinateur de bureau.', 'Modérer rapidement, consulter statistiques, gérer capteurs.'],
    ['Services de secours', 'Sapeurs-pompiers, Croix-Rouge.', 'Vision agrégée temps réel pour intervention.'],
    ['Chercheur·euse / ONG', 'Universitaire, ONG climat.', 'Accès aux données publiques pour études.'],
  ],
  [2200, 3580, 3580],
));

children.push(h2('2.5 Périmètre géographique : 12 quartiers'));
children.push(makeTable(
  ['ID', 'Quartier', 'Arrondissement', 'Latitude', 'Longitude'],
  [
    ['akwa', 'Akwa', 'Douala 1er', '4.0469', '9.7034'],
    ['bonanjo', 'Bonanjo', 'Douala 1er', '4.0466', '9.6921'],
    ['deido', 'Deïdo', 'Douala 1er', '4.0625', '9.7055'],
    ['bonaberi', 'Bonabéri', 'Douala 4e', '4.0822', '9.6622'],
    ['new-bell', 'New Bell', 'Douala 2e', '4.0426', '9.7244'],
    ['ndogpassi', 'Ndogpassi', 'Douala 3e', '4.075', '9.78'],
    ['logbessou', 'Logbessou', 'Douala 5e', '4.083', '9.79'],
    ['pk', 'PK Axe Lourd', 'Douala 3e', '4.099', '9.81'],
    ['makepe', 'Makepè', 'Douala 5e', '4.0717', '9.7531'],
    ['bonamoussadi', 'Bonamoussadi', 'Douala 5e', '4.085', '9.755'],
    ['bepanda', 'Bépanda', 'Douala 5e', '4.07', '9.74'],
    ['village', 'Village', 'Douala 1er', '4.06', '9.69'],
  ],
  [1500, 2400, 2400, 1530, 1530],
));

children.push(h3('Périmètre fonctionnel V1'));
children.push(bullet('Inscription / connexion (rôles user, admin) avec JWT + bcrypt'));
children.push(bullet('Signalement avec photo, géolocalisation par zone, type, sévérité'));
children.push(bullet('Validation/Rejet par admin'));
children.push(bullet('Carte interactive zones de risque + capteurs'));
children.push(bullet('Notifications temps réel (SSE + Web Push)'));
children.push(bullet('Tableau de bord utilisateur et admin'));
children.push(bullet('Ingestion automatique des capteurs ESP32'));
children.push(bullet('PWA installable, fonctionnement hors-ligne'));

children.push(h3('Hors périmètre V1'));
children.push(bullet('Application native iOS/Android (la PWA suffit)'));
children.push(bullet('SMS d\'alerte (coût opérateur prohibitif)'));
children.push(bullet('Multi-villes (Yaoundé, Limbé… à l\'étude phase 2)'));
children.push(bullet('Paiements ou monétisation'));

// ============================================================
// SECTION 3 — ÉTUDE DE L'EXISTANT
// ============================================================
children.push(h1('3. Étude de l\'existant'));

children.push(h2('3.1 Solutions concurrentes ou voisines'));
children.push(makeTable(
  ['Solution', 'Forces', 'Faiblesses pour notre besoin'],
  [
    ['Ushahidi (crowdmapping)', 'Mature, multilingue, déjà utilisée en Afrique de l\'Est.', 'Lourd à installer, pas d\'IoT natif, UI vieillissante, pas pensé PWA.'],
    ['Google FloodHub', 'Modèles ML précis sur bassins versants équipés.', 'Couverture limitée, pas de Douala, pas de signalement citoyen.'],
    ['WhatsApp / Facebook locaux', 'Adoption massive.', 'Pas de modération, pas d\'agrégation, pas géolocalisé.'],
    ['Téléphone vert mairie', 'Officiel.', 'Saturé en crise, pas de trace, pas de visualisation.'],
  ],
  [2400, 3480, 3480],
));

children.push(h2('3.2 Positionnement différenciant'));
children.push(num('**PWA installable** : pas de magasin d\'apps, mise à jour automatique, légère (< 500 ko à la première visite).'));
children.push(num('**Hybride humain + capteurs** : signalement citoyen validé manuellement ; signalement capteur validé automatiquement sur seuil → équilibre fiabilité/réactivité.'));
children.push(num('**Identité graphique locale** : « brutalisme éditorial tropical » affirmant l\'ancrage camerounais.'));
children.push(num('**Open-source et reproductible** : code ouvert, documenté, calibrable sur site par un·e technicien·ne local·e.'));
children.push(num('**Bas coût** : matériel < 50 € par capteur (voir section 8).'));

// ============================================================
// SECTION 4 — BESOINS FONCTIONNELS
// ============================================================
children.push(h1('4. Besoins fonctionnels'));

children.push(h2('4.1 Acteurs et rôles'));
children.push(makeTable(
  ['Acteur', 'Authentification', 'Permissions principales'],
  [
    ['Visiteur anonyme', 'Aucune', 'Lecture du feed public, ticker, stats publiques, sensors publics, inscription.'],
    ['Utilisateur (role=user)', 'JWT Bearer', 'Toutes les actions visiteur + créer un signalement, voir ses propres signalements, recevoir des notifications, gérer son profil.'],
    ['Administrateur (role=admin)', 'JWT Bearer', 'Toutes les actions user + valider/rejeter signalements, CRUD capteurs, CRUD utilisateurs, stats globales, logs d\'activité.'],
    ['Capteur IoT', 'Header x-api-key', 'Envoyer des lectures pour son deviceId. Aucun autre droit.'],
  ],
  [2200, 2200, 4960],
));

children.push(h2('4.2 Cas d\'usage détaillés'));
children.push(p('Pour chaque cas d\'usage : code, acteur, préconditions, scénario nominal, scénarios alternatifs, postconditions.'));

// --- UC-01
children.push(h3('UC-01 — S\'inscrire et se connecter'));
children.push(p('', { children: parseInline('**Acteur** : visiteur anonyme. **Préconditions** : néant.') }));
children.push(h4('Scénario nominal — Inscription'));
children.push(num('Le visiteur ouvre `/inscription`.'));
children.push(num('Il saisit email, mot de passe (≥ 8 caractères), nom d\'affichage.'));
children.push(num('Le backend vérifie l\'unicité, hashe avec bcrypt (10 rounds), crée le user (role par défaut = user).'));
children.push(num('Le backend renvoie {user, token} (JWT signé HS256, expiration 7 j).'));
children.push(num('Le frontend stocke le token, redirige vers /tableau-de-bord.'));
children.push(h4('Scénario nominal — Connexion'));
children.push(num('Le visiteur ouvre `/connexion`.'));
children.push(num('Il saisit email + mot de passe.'));
children.push(num('Le backend compare le hash, génère un JWT, renvoie {user, token}.'));
children.push(num('Selon le role : user → /tableau-de-bord, admin → /admin.'));
children.push(h4('Scénarios alternatifs'));
children.push(bullet('A1 Email déjà utilisé → 409 Conflict, message « email déjà enregistré ».'));
children.push(bullet('A2 Mot de passe incorrect → 401, message générique « identifiants invalides ».'));
children.push(bullet('A3 Plus de 10 tentatives en 15 min depuis la même IP → 429 (rate limit).'));
children.push(bullet('A4 Mot de passe oublié → flux /mot-de-passe-oublie → email avec token → /reset-password.'));
children.push(p('', { children: parseInline('**Postconditions** : un user est créé en base ou une session JWT est ouverte.') }));

// --- UC-02
children.push(h3('UC-02 — Signaler une catastrophe'));
children.push(p('', { children: parseInline('**Acteur** : utilisateur authentifié. **Préconditions** : JWT valide, navigateur compatible `getUserMedia`.') }));
children.push(h4('Scénario nominal'));
children.push(num('L\'utilisateur ouvre `/signaler`.'));
children.push(num('**Étape 1 — Photo** : déclenche la caméra arrière (facingMode `environment`), prend une photo. Fallback : import fichier.'));
children.push(num('**Étape 2 — Détails** : type (flood/landslide/fire/storm/other), quartier, sévérité, titre (4-100 car.), description (10-2000 car.), adresse libre.'));
children.push(num('Soumission : POST `/api/disasters` avec photoDataUrl base64.'));
children.push(num('Backend valide via `disasters.validators.js`, crée un disaster `status=pending, source=user`, incrémente reportsCount.'));
children.push(num('Toast confirmation, redirection vers /tableau-de-bord.'));
children.push(h4('Scénarios alternatifs'));
children.push(bullet('A1 Photo absente → bouton de soumission désactivé.'));
children.push(bullet('A2 Titre < 4 caractères → 400 Bad Request avec détail erreur.'));
children.push(bullet('A3 JWT expiré → 401, redirection /connexion.'));
children.push(p('', { children: parseInline('**Postconditions** : nouveau disaster `pending` en base. Visible dans `/admin/en-attente`. Aucune diffusion publique tant que non validé.') }));

// --- UC-03 à UC-11 résumés
children.push(h3('UC-03 — Consulter le flux d\'alertes en temps réel'));
children.push(p('Sur `/`, le composant `LiveTicker` affiche les 6 dernières alertes validées et rafraîchit toutes les 30 s via `GET /api/public/ticker`. Sur `/alertes`, le composant `LiveAlerts` affiche le feed paginé avec filtres (type, zone, source) et KPIs.'));

children.push(h3('UC-04 — Visualiser la carte interactive'));
children.push(p('Page `/carte` : React-Leaflet + OpenStreetMap centré sur Douala (lat 4.0511, lng 9.7679, zoom 12). Pour chaque quartier, cercle coloré selon niveau de risque (vert/or/orange/rouge). Capteurs IoT actifs représentés par des points avec tooltips (nom, dernière lecture, statut). Légende `RiskLegend` explique le code couleur. Au clic : popup détaillé.'));

children.push(h3('UC-05 — Recevoir des notifications Web Push'));
children.push(p('Activation depuis `/profil`. Le frontend récupère la VAPID publicKey, appelle `pushManager.subscribe()`, POST la subscription sur `/api/notifications/subscribe`. Quand un disaster est validé, le backend appelle `web-push`. Le service worker `/sw-push.js` reçoit l\'événement `push`, affiche la notification OS. En parallèle, flux SSE `/api/notifications/stream` pour temps réel in-app.'));

children.push(h3('UC-06 — Valider ou rejeter un signalement (admin)'));
children.push(p('Sur `/admin/en-attente`, l\'admin voit la liste filtrée. Clique sur un signalement → modal détail avec photo, description. « Valider » → POST `/api/disasters/:id/validate` → status=validated, notification au reporter. « Rejeter » → modal RejectModal demandant raison → POST `/api/disasters/:id/reject` avec {reason}.'));

children.push(h3('UC-07 — Gérer les capteurs IoT (admin)'));
children.push(p('Sur `/admin/capteurs` : création (deviceId unique, nom, zone, lat/lng, types, seuils warning/critical, statut), édition partielle (PATCH), suppression. GET `/api/sensors` renvoie liste enrichie avec alertLevel et offline (booléen, `now - lastSeenAtMs > 5 min`).'));

children.push(h3('UC-08 — Consulter le tableau de bord admin'));
children.push(p('Sur `/admin` : 4 KPIs (`GET /api/admin/stats`), file pending (5 derniers), activité récente (8 logs via `/activity`), top 5 zones à risque (`/top-zones?days=7&limit=5`), buckets capteurs (`/alerts/buckets`).'));

children.push(h3('UC-09 — Ingestion automatique d\'une lecture capteur'));
children.push(p('**Acteur** : capteur ESP32. Le capteur POST `/api/sensors/:deviceId/readings` (rate-limité 60 req/min). Backend valide x-api-key, persiste, appelle `evaluateAlertLevel()`. Si alertLevel ≥ warning ET aucun disaster auto dans les 30 dernières minutes → création automatique d\'un disaster `source=sensor, status=validated`, severity dérivée. Diffusion immédiate via SSE + Web Push. Réponse : `{ ok, sensorId, alertLevel, disasterId|null }`. Latence cible < 2 s.'));

children.push(h3('UC-10 — Installer l\'application en PWA'));
children.push(p('**Desktop Chrome/Edge** : icône « Installer » dans la barre d\'adresse. **Android Chrome** : bannière InstallPrompt, ou `⋮ → Ajouter à l\'écran d\'accueil`. **iOS Safari** : Partager → Sur l\'écran d\'accueil. Manifest : nom, icônes SVG, theme color, shortcuts (Signaler, Alertes, Carte).'));

children.push(h3('UC-11 — Utiliser l\'app hors-ligne'));
children.push(p('Le service worker (vite-plugin-pwa + Workbox) précache l\'app shell (JS/CSS/HTML/SVG). Les appels `/api/*` en stratégie *network-first* avec timeout 5 s ; retour cache si échec. Tuiles OSM cachées en *CacheFirst*. Utilisateur sans connexion : peut ouvrir l\'app, consulter dernier feed, naviguer. Actions d\'écriture échouent avec toast d\'erreur.'));

children.push(h2('4.3 Règles de gestion'));
children.push(makeTable(
  ['Code', 'Règle'],
  [
    ['RG-01', 'Tout signalement utilisateur a un status=pending à la création. Pas de diffusion publique tant que non validé.'],
    ['RG-02', 'Cible de délai de validation par un admin : 24 h. Au-delà, indicateur visuel.'],
    ['RG-03', 'Un signalement source=sensor est créé en status=validated directement (pré-approuvé).'],
    ['RG-04', 'Cooldown de 30 min entre deux disasters auto pour un même capteur.'],
    ['RG-05', 'Capteur considéré offline si now - lastSeenAtMs > 5 min.'],
    ['RG-06', 'Seuils par défaut : eau {warning:60%, critical:80%}, pluie {warning:30, critical:60 mm/h}, sol {warning:70%, critical:90%}.'],
    ['RG-07', 'Validation champs : titre 4-100 car., description 10-2000 car., photo obligatoire, quartier dans liste fermée.'],
    ['RG-08', 'Mot de passe ≥ 8 caractères, hashé bcrypt 10 rounds. JWT expire après 7 jours.'],
    ['RG-09', 'Rate limit : auth = 10 req/15 min/IP, ingestion = 60 req/min/IP+deviceId.'],
    ['RG-10', 'Rôle admin attribué manuellement en base ou par un autre admin — pas d\'auto-promotion.'],
    ['RG-11', 'Utilisateur ne voit que ses propres signalements (GET /api/disasters) sauf admin.'],
    ['RG-12', 'Notifications Web Push exigent HTTPS en production.'],
    ['RG-13', 'Subscription push doit avoir endpoint commençant par https://, sinon rejetée.'],
  ],
  [1200, 8160],
));

// ============================================================
// SECTION 5 — SPÉCIFICATIONS TECHNIQUES
// ============================================================
children.push(h1('5. Spécifications techniques'));

children.push(h2('5.1 Architecture générale'));
children.push(p('Architecture en 3 couches : Frontend PWA (React 19 + Vite + Service Worker) ↔ Backend REST Express (Node.js ≥ 20) ↔ Capteurs ESP32 sur le terrain. Communication temps réel via SSE (server → frontend) et Web Push API (server → OS notification). Persistance par fichier JSON. Les capteurs s\'authentifient par clé API partagée.'));
children.push(...code(
`┌────────────────┐   HTTPS REST   ┌─────────────────┐
│  Frontend PWA  │ ──────────────▶│  Backend Express│
│  React 19/Vite │ ◀── SSE ──────  │  JWT + bcrypt   │
│  Service Worker│ ◀── Web Push ── │  web-push VAPID │
└────────────────┘                 └────────┬────────┘
                                            │
                                            ▼
                                    ┌──────────────┐
                                    │  db.json     │
                                    └──────────────┘
                                            ▲
                            POST /readings   │
                            (x-api-key)      │
                                  ┌──────────┴───────┐
                                  │ ESP32 ×6 (WiFi)  │
                                  │ HC-SR04, YL-83,  │
                                  │ capacitif sol    │
                                  └──────────────────┘`
));

children.push(h2('5.2 Stack technique exhaustive'));
children.push(makeTable(
  ['Couche', 'Technologie', 'Version', 'Rôle'],
  [
    ['Frontend', 'React', '^19.2', 'UI'],
    ['Routing', 'react-router-dom', '^7.15', 'Routage SPA'],
    ['Bundler', 'Vite', '^8.0', 'Dev server + build'],
    ['PWA', 'vite-plugin-pwa (Workbox)', '^1.3', 'Manifest + service worker'],
    ['Carto', 'Leaflet + react-leaflet', '1.9 / 5.0', 'Carte interactive'],
    ['Animations', 'framer-motion', '^12.38', 'Transitions UI'],
    ['Dates', 'date-fns', '^4.1', 'Formatage'],
    ['Linter', 'ESLint + Prettier', '10 / 3.8', 'Qualité code'],
    ['Tests', 'Vitest', '^4.1', 'Unit + intégration'],
    ['Runtime', 'Node.js', '≥ 20', 'Serveur'],
    ['API', 'Express', '^4.19', 'Routage HTTP'],
    ['Auth', 'jsonwebtoken + bcryptjs', '9 / 2.4', 'JWT + hash MDP'],
    ['CORS', 'cors', '^2.8', 'Politique d\'origine'],
    ['Rate limit', 'express-rate-limit', '^8.5', 'Protection abus'],
    ['Web Push', 'web-push', '^3.6', 'Push API + VAPID'],
    ['Config', 'dotenv', '^16.4', 'Variables d\'env.'],
    ['Persistance', 'JSON fichier (db.json)', '—', 'Stockage V1'],
    ['IoT MCU', 'ESP32 DevKit V1', '—', 'Microcontrôleur'],
    ['IoT libs', 'WiFi, HTTPClient, ArduinoJson, esp_task_wdt', '—', 'Sketch Arduino'],
  ],
  [1400, 2900, 1700, 3360],
));

children.push(h2('5.3 Modèle de données'));
children.push(p('La base est un fichier JSON unique (`backend/data/db.json`) géré par un module `jsonStore` avec sérialisation atomique. 8 collections :'));

children.push(h3('Collection users'));
children.push(...code(
`{
  "uid": "u-abc123",
  "email": "alice@example.com",
  "password": "<bcrypt hash>",
  "displayName": "Alice",
  "role": "user",
  "fcmTokens": [],
  "notificationPrefs": { "zones": [], "muteAll": false },
  "reportsCount": 3,
  "createdAt": "2026-05-14T10:00:00.000Z"
}`
));

children.push(h3('Collection disasters'));
children.push(...code(
`{
  "id": "d-xyz789",
  "source": "user",         // ou "sensor"
  "type": "flood",          // flood | landslide | fire | storm | other
  "title": "Inondation rue Joss",
  "description": "Eau jusqu'aux genoux...",
  "address": "Rue Joss, Akwa",
  "quartierId": "akwa",
  "severity": "high",       // low | medium | high | critical
  "status": "pending",      // pending | validated | rejected
  "reporterId": "u-abc123",
  "reporterName": "Alice",
  "sensorId": null,
  "validatedAt": null,
  "validatedBy": null,
  "rejectionReason": null,
  "photoDataUrl": "data:image/jpeg;base64,...",
  "createdAt": "2026-05-14T10:00:00.000Z",
  "updatedAt": "2026-05-14T10:00:00.000Z"
}`
));

children.push(h3('Collection sensors'));
children.push(...code(
`{
  "id": "s-akwa-001",
  "deviceId": "ESP32-AKWA-001",
  "name": "Akwa — Marché central",
  "zoneId": "akwa",
  "lat": 4.0469, "lng": 9.7034,
  "types": ["water_level", "rainfall", "soil_moisture"],
  "thresholds": {
    "water_level":   { "warning": 60, "critical": 80 },
    "rainfall":      { "warning": 30, "critical": 60 },
    "soil_moisture": { "warning": 70, "critical": 90 }
  },
  "status": "active",      // active | inactive | maintenance
  "lastSeenAtMs": 1731580800000,
  "lastReading": { "water_level": 42, "rainfall": 5, "soil_moisture": 55, "batteryLevel": 78 }
}`
));

children.push(h3('Autres collections'));
children.push(bullet('**sensor_readings** : id, sensorId, values {water_level, rainfall, soil_moisture, batteryLevel}, createdAt'));
children.push(bullet('**notifications** : id, userId, type, title, body, link, payload, createdAt, readAt'));
children.push(bullet('**push_subscriptions** : id, userId, endpoint (HTTPS), keys {p256dh, auth}, userAgent'));
children.push(bullet('**activity** : audit logs admin (id, actorId, action, target, payload, createdAt)'));
children.push(bullet('**password_resets** : tokens éphémères réinitialisation'));

children.push(h2('5.4 API REST exhaustive'));

children.push(h3('Authentification — /api/auth (rate-limited 10 req/15 min)'));
children.push(makeTable(
  ['Méthode', 'Route', 'Auth', 'Retour'],
  [
    ['POST', '/register', '–', '201 {user, token}'],
    ['POST', '/login', '–', '200 {user, token}'],
    ['GET', '/me', 'JWT', '200 {user}'],
    ['POST', '/logout', 'JWT', '204'],
    ['POST', '/password-reset/request', '–', '200 {ok:true}'],
    ['POST', '/password-reset/confirm', '–', '200 {ok:true}'],
  ],
  [1200, 3000, 1500, 3660],
));

children.push(h3('Signalements — /api/disasters (JWT obligatoire)'));
children.push(makeTable(
  ['Méthode', 'Route', 'Auth', 'Description'],
  [
    ['GET', '/', 'JWT', 'Liste filtrable (non-admin = ses signalements)'],
    ['POST', '/', 'JWT', 'Créer signalement'],
    ['GET', '/:id', 'JWT owner/admin', 'Détail'],
    ['POST', '/:id/validate', 'JWT admin', 'Valider'],
    ['POST', '/:id/reject', 'JWT admin', 'Rejeter avec raison'],
    ['DELETE', '/:id', 'JWT admin', 'Supprimer'],
  ],
  [1200, 1800, 1800, 4560],
));

children.push(h3('Capteurs — /api/sensors'));
children.push(makeTable(
  ['Méthode', 'Route', 'Auth', 'Description'],
  [
    ['POST', '/:deviceId/readings', 'x-api-key (60/min)', 'Ingestion lecture'],
    ['GET', '/', 'JWT', 'Liste enrichie (alertLevel, offline)'],
    ['GET', '/:id', 'JWT', 'Détail'],
    ['POST', '/', 'JWT admin', 'Créer'],
    ['PATCH', '/:id', 'JWT admin', 'Mettre à jour'],
    ['DELETE', '/:id', 'JWT admin', 'Supprimer'],
    ['GET', '/:id/readings', 'JWT', 'Historique lectures'],
  ],
  [1200, 2200, 2200, 3760],
));

children.push(h3('Admin — /api/admin (JWT admin)'));
children.push(makeTable(
  ['Méthode', 'Route', 'Description'],
  [
    ['GET', '/stats', 'Compteurs globaux'],
    ['GET', '/activity', 'Logs d\'activité'],
    ['GET', '/top-zones', 'Top zones par fréquence'],
    ['GET', '/alerts/buckets', 'Distribution normal/warning/critical'],
  ],
  [1200, 3000, 5160],
));

children.push(h3('Public — /api/public (sans auth)'));
children.push(makeTable(
  ['Méthode', 'Route', 'Description'],
  [
    ['GET', '/feed', 'Feed validés + capteurs actifs'],
    ['GET', '/ticker', 'Derniers 6 validés'],
    ['GET', '/stats', 'Stats publiques anonymisées'],
    ['GET', '/sensors', 'Liste publique capteurs'],
  ],
  [1200, 3000, 5160],
));

children.push(h3('Notifications — /api/notifications'));
children.push(makeTable(
  ['Méthode', 'Route', 'Auth', 'Description'],
  [
    ['GET', '/stream', 'JWT en query', 'Flux SSE (hello, notification). Keepalive 25 s.'],
    ['GET', '/vapid-public-key', '–', '{publicKey, enabled}'],
    ['GET', '/', 'JWT', 'Liste notifs user'],
    ['GET', '/unread-count', 'JWT', 'Compteur non-lues'],
    ['POST', '/:id/read', 'JWT', 'Marquer une lue'],
    ['POST', '/read-all', 'JWT', 'Marquer toutes lues'],
    ['POST', '/subscribe', 'JWT', 'Enregistrer subscription Web Push'],
    ['POST', '/unsubscribe', 'JWT', 'Désenregistrer par endpoint'],
  ],
  [1100, 2500, 1700, 4060],
));

children.push(h2('5.5 Sécurité'));
children.push(bullet('**Authentification JWT** : signé HS256 avec JWT_SECRET (≥ 32 caractères aléatoires), expiration 7 j. Bearer dans Authorization. Variante `requireAuthFromQuery` pour SSE.'));
children.push(bullet('**Mots de passe** : bcryptjs 10 rounds (paramétrable BCRYPT_ROUNDS).'));
children.push(bullet('**Capteurs** : header x-api-key vs SENSOR_API_KEY. Pas de JWT.'));
children.push(bullet('**CORS** : restreint à CORS_ORIGIN.'));
children.push(bullet('**Rate limiting** : 10 req/15 min sur /api/auth, 60 req/min/IP+deviceId sur ingestion.'));
children.push(bullet('**HTTPS** : obligatoire en production (Web Push l\'exige).'));
children.push(bullet('**Validation entrées** : chaque payload passe par un validator (backend/src/validators/).'));
children.push(bullet('**OWASP Top 10** : middlewares requireAuth/requireAdmin systématiques, secrets en .env, table activity pour audit.'));
children.push(bullet('**Secrets** : JWT_SECRET, SENSOR_API_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT en variables d\'environnement.'));

children.push(h2('5.6 Spécifications matérielles IoT'));
children.push(makeTable(
  ['Composant', 'Modèle', 'Rôle', 'Pin ESP32'],
  [
    ['MCU', 'ESP32 DevKit V1 (WiFi 2.4 GHz, ADC 12-bit)', 'Cerveau', '—'],
    ['Niveau d\'eau', 'HC-SR04 ultrason', 'Mesure distance → niveau', 'TRIG=5, ECHO=18'],
    ['Pluie', 'YL-83 (carte + sonde)', 'Détection / intensité', 'A0 → GPIO34'],
    ['Humidité sol', 'Capacitif v2.0', 'Saturation sol', 'A1 → GPIO35'],
    ['Batterie', 'Diviseur 2×100 kΩ', 'Lecture Vbat', 'GPIO33'],
  ],
  [1800, 2900, 2400, 2260],
));

children.push(h3('Comportement firmware'));
children.push(bullet('**Boucle** : toutes les 60 s, lit les 3 capteurs, formate JSON, POST sur le backend.'));
children.push(bullet('**Authentification** : header `x-api-key: <SENSOR_API_KEY>`.'));
children.push(bullet('**Watchdog logiciel** : esp_task_wdt à 60 s. Reboot si la boucle bloque.'));
children.push(bullet('**Reconnexion WiFi** : non-bloquante, backoff exponentiel 1 s → 60 s.'));
children.push(bullet('**Retry HTTP** : doublement de l\'intervalle (60 s → 5 min max) sur 5xx/timeout, retour à 60 s à la première réussite.'));
children.push(bullet('**Calibration sur site** : seuils ADC à mesurer pour chaque déploiement (HC-SR04, YL-83, capacitif).'));

children.push(h3('Format payload capteur'));
children.push(...code(
`{
  "deviceId": "ESP32-AKWA-001",
  "readings": {
    "water_level": 45,
    "rainfall": 62,
    "soil_moisture": 75
  },
  "batteryLevel": 80
}`
));

children.push(h3('Limites V1 documentées'));
children.push(bullet('Pas de buffer offline : mesures perdues si WiFi absent (à corriger V2).'));
children.push(bullet('Pas de seuil batterie critique ni hibernation d\'urgence.'));
children.push(bullet('HTTPS via reverse proxy (Nginx/Caddy), pas natif dans le sketch.'));

children.push(h2('5.7 PWA et hors-ligne'));
children.push(bullet('**Manifest** (public/manifest.webmanifest) : nom Alerte Douala, theme color vert mangrove, icônes SVG 192/512, shortcuts (/signaler, /alertes, /carte).'));
children.push(bullet('**Service Worker** : vite-plugin-pwa + Workbox. Précache app shell. Runtime cache /api/* en NetworkFirst (timeout 5 s, max 50 entrées). Tuiles OSM en CacheFirst (expiration 7 j).'));
children.push(bullet('**sw-push.js** : handlers push (notification OS) + notificationclick (focus onglet existant ou open).'));
children.push(bullet('**InstallPrompt** : détecte beforeinstallprompt (Android/Desktop) ou plateforme iOS, propose installation, dismiss 14 j.'));
children.push(bullet('**Mise à jour** : Workbox auto-update, prompt « nouvelle version disponible — recharger ».'));

children.push(h2('5.8 Notifications temps réel'));
children.push(p('Deux canaux complémentaires :'));
children.push(num('**SSE in-app** (GET /api/notifications/stream) : flux server → client tant que l\'onglet est ouvert. Broker in-memory Map<userId, Set<Response>>. Événements `hello` (handshake), `notification` (payload JSON). Keepalive 25 s.'));
children.push(num('**Web Push** (web-push + VAPID) : notification OS même app fermée. Endpoint HTTPS obligatoire. Coalescing par tag.'));

children.push(h2('5.9 Configuration et variables d\'environnement'));
children.push(p('Fichier `backend/.env` (voir `backend/.env.example`) :'));
children.push(...code(
`PORT=4000
JWT_SECRET=<au moins 32 caractères aléatoires>
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:5173
SENSOR_API_KEY=<secret partagé firmware/backend>
VAPID_PUBLIC_KEY=<clé publique base64>
VAPID_PRIVATE_KEY=<clé privée base64>
VAPID_SUBJECT=mailto:admin@alertedouala.cm`
));
children.push(p('Frontend : pas de .env requis. Vite proxifie /api/* vers http://localhost:4000 en dev.'));

// ============================================================
// SECTION 6 — EXIGENCES NON-FONCTIONNELLES
// ============================================================
children.push(h1('6. Exigences non-fonctionnelles'));
children.push(makeTable(
  ['Catégorie', 'Exigence', 'Cible mesurable'],
  [
    ['Performance frontend', 'Charge initiale légère', 'First Contentful Paint < 2 s sur 4G simulée'],
    ['Performance frontend', 'Carte fluide', '≥ 30 fps au zoom/pan sur smartphone milieu de gamme'],
    ['Performance backend', 'Latence API', 'p95 < 300 ms (feed, ticker, stats)'],
    ['Performance backend', 'Latence notification', '< 2 s entre lecture critique et arrivée notif client'],
    ['Disponibilité', 'Service en ligne', '99 % hors coupures électriques/réseau documentées'],
    ['Sécurité', 'Conformité OWASP Top 10', 'Aucun risque haut ouvert'],
    ['Sécurité', 'Pas de secret en clair', 'Tous secrets en .env, jamais commités'],
    ['Accessibilité', 'WCAG 2.1 niveau AA', 'Contrastes ≥ 4.5:1, navigation clavier, labels ARIA'],
    ['Compatibilité', 'Navigateurs', 'Chrome/Edge/Firefox/Safari 2 dernières versions, iOS 16.4+'],
    ['Compatibilité', 'Responsive', 'Breakpoints 320/768/1024/1440 px'],
    ['i18n', 'Langue', 'FR par défaut, hook FR/EN dans /profil (V2)'],
    ['RGPD', 'Minimisation', 'Email + nom + signalements. Pas de tracking tiers.'],
    ['RGPD', 'Droit à l\'oubli', 'Endpoint suppression compte (V1.1)'],
    ['Maintenabilité', 'Qualité code', 'ESLint + Prettier, architecture modulaire'],
    ['Maintenabilité', 'Tests', 'Couverture cible 60 % services backend (Vitest)'],
    ['Évolutivité', 'Migration BD', 'JSON V1 → PostgreSQL/Firestore V2'],
    ['Coût', 'Hébergement', '< 10 €/mois (VPS 1 vCPU / 1 Go RAM)'],
  ],
  [2200, 3000, 4160],
));

// ============================================================
// SECTION 7 — PLANNING
// ============================================================
children.push(h1('7. Planning prévisionnel'));

children.push(h2('7.1 Phases du projet'));
children.push(makeTable(
  ['Phase', 'Durée', 'Période', 'Livrables'],
  [
    ['P1 — Étude & cadrage', '2 sem.', 'S1–S2', 'Ce cahier des charges, maquettes Figma, choix techniques'],
    ['P2 — Backend & BD', '3 sem.', 'S3–S5', 'API REST complète, auth JWT, seed users + capteurs, tests Vitest'],
    ['P3 — Frontend MVP', '4 sem.', 'S6–S9', 'Pages Home, Auth, Report, Alerts, Map, Dashboard'],
    ['P4 — Firmware IoT', '2 sem.', 'S10–S11', 'Sketch ESP32, calibration labo, test ingestion'],
    ['P5 — PWA & Web Push', '2 sem.', 'S12–S13', 'Manifest, service worker, VAPID, SSE, InstallPrompt'],
    ['P6 — Admin & dashboard', '2 sem.', 'S14–S15', '/admin/*, validation, stats, CRUD capteurs/utilisateurs'],
    ['P7 — Tests & recette', '2 sem.', 'S16–S17', 'Vitest, recette manuelle, Lighthouse, corrections'],
    ['P8 — Déploiement pilote', '1 sem.', 'S18', 'Déploiement VPS, formation admin, installation 6 capteurs'],
    ['TOTAL', '18 sem.', '~4,5 mois', '—'],
  ],
  [2400, 1200, 1400, 4360],
));

children.push(h2('7.2 Jalons clés'));
children.push(makeTable(
  ['Jalon', 'Semaine', 'Critère'],
  [
    ['J1 — Cadrage validé', 'S2', 'Cahier des charges signé par l\'encadrant·e'],
    ['J2 — API testable', 'S5', 'Tous les endpoints répondent, collection Postman partagée'],
    ['J3 — MVP frontend', 'S9', 'Démo signalement complet sur navigateur'],
    ['J4 — 1ère lecture capteur', 'S11', 'Un ESP32 envoie en continu vers backend dev'],
    ['J5 — PWA installable', 'S13', 'Installe sur Android et passe Lighthouse PWA ≥ 90'],
    ['J6 — Admin complet', 'S15', 'Workflow validation/rejet bout en bout'],
    ['J7 — Recette pilote', 'S17', 'Tous les UC validés en recette manuelle'],
    ['J8 — Mise en ligne', 'S18', 'URL publique + 6 capteurs sur le terrain'],
  ],
  [2800, 1400, 5160],
));

// ============================================================
// SECTION 8 — BUDGET
// ============================================================
children.push(h1('8. Budget estimatif'));
children.push(p('Devise : FCFA (XAF) avec équivalence € indicative (1 € ≈ 656 FCFA, taux mai 2026). Le développement, réalisé en cadre académique, n\'est pas chiffré.'));

children.push(h2('8.1 Matériel IoT (par capteur)'));
children.push(makeTable(
  ['Poste', 'Qté', 'Coût unitaire', 'Sous-total'],
  [
    ['ESP32 DevKit V1', '1', '6 000 FCFA', '6 000 FCFA'],
    ['HC-SR04 ultrason', '1', '1 500 FCFA', '1 500 FCFA'],
    ['YL-83 pluie', '1', '2 500 FCFA', '2 500 FCFA'],
    ['Capteur capacitif sol', '1', '3 000 FCFA', '3 000 FCFA'],
    ['Boîtier IP65', '1', '5 000 FCFA', '5 000 FCFA'],
    ['Batterie Li-Ion 18650 + TP4056', '1', '4 000 FCFA', '4 000 FCFA'],
    ['Panneau solaire 5W + régulateur', '1', '8 000 FCFA', '8 000 FCFA'],
    ['Câblage, soudure, fixation', '—', '2 000 FCFA', '2 000 FCFA'],
    ['TOTAL PAR CAPTEUR', '', '', '32 000 FCFA (~49 €)'],
    ['TOTAL 6 CAPTEURS', '', '', '192 000 FCFA (~293 €)'],
  ],
  [3500, 1000, 2400, 2460],
));

children.push(h2('8.2 Infrastructure (annuel)'));
children.push(makeTable(
  ['Poste', 'Qté', 'Coût/an', 'Total'],
  [
    ['VPS 1 vCPU / 1 Go RAM', '1', '50 000 FCFA', '50 000 FCFA'],
    ['Nom de domaine .cm ou .com', '1', '10 000 FCFA', '10 000 FCFA'],
    ['Certificat SSL Let\'s Encrypt', '1', 'gratuit', '0'],
    ['Sauvegarde hebdo S3-compat', '1', '5 000 FCFA', '5 000 FCFA'],
    ['SOUS-TOTAL INFRA', '', '', '65 000 FCFA (~99 €)'],
  ],
  [3500, 1000, 2400, 2460],
));

children.push(h2('8.3 Récapitulatif'));
children.push(makeTable(
  ['Catégorie', 'Montant'],
  [
    ['Matériel IoT (6 capteurs)', '192 000 FCFA'],
    ['Infrastructure 1 an', '65 000 FCFA'],
    ['Communication / formation admin', '15 000 FCFA'],
    ['Marge imprévus (10 %)', '27 000 FCFA'],
    ['TOTAL V1', '≈ 300 000 FCFA (~458 €)'],
  ],
  [5360, 4000],
));

// ============================================================
// SECTION 9 — TESTS
// ============================================================
children.push(h1('9. Stratégie de tests et critères d\'acceptation'));

children.push(h2('9.1 Niveaux de tests'));
children.push(makeTable(
  ['Niveau', 'Outils', 'Périmètre'],
  [
    ['Unitaires', 'Vitest', 'Services backend, utils (thresholds, validators), hooks frontend'],
    ['Intégration', 'Vitest + supertest', 'Endpoints API end-to-end avec base JSON éphémère'],
    ['PWA / Performance', 'Lighthouse CI', 'Audit PWA, performance, accessibilité, SEO'],
    ['Manuels / Recette', 'Checklist', 'UC-01 à UC-11 sur 3 navigateurs et 2 OS mobiles'],
    ['Charge (optionnel V1)', 'k6 ou Artillery', '100 utilisateurs simultanés sur feed + ticker'],
  ],
  [2200, 2400, 4760],
));

children.push(h2('9.2 Critères d\'acceptation par cas d\'usage'));
children.push(makeTable(
  ['UC', 'Critère(s) d\'acceptation'],
  [
    ['UC-01', 'Inscription + connexion < 5 s ; MDP < 8 car. rejeté ; 11ᵉ tentative en 15 min bloquée (429)'],
    ['UC-02', 'Signalement avec photo + champs requis ⇒ disaster pending créé ; sans photo ⇒ bouton désactivé ; titre 3 car. ⇒ 400'],
    ['UC-03', 'Feed mis à jour ≤ 30 s après validation admin ; KPI = nombre exact'],
    ['UC-04', 'Carte centrée sur Douala, 12 zones visibles, capteurs avec tooltips, légende affichée'],
    ['UC-05', 'Notif Web Push reçue < 5 s sur Android Chrome ; click → ouvre l\'app sur bonne route'],
    ['UC-06', 'Validation : disaster validated, notif au reporter ; rejet avec raison stockée + notif'],
    ['UC-07', 'CRUD capteur : 200, log activité créé, capteur visible dans liste enrichie'],
    ['UC-08', '4 KPIs admin chargés < 1 s ; top-zones et buckets cohérents'],
    ['UC-09', 'POST water_level=85 ⇒ {alertLevel:"critical", disasterId:"..."} en < 500 ms ; 2ᵉ POST en < 30 min ⇒ disasterId:null'],
    ['UC-10', 'Audit Lighthouse PWA ≥ 90 ; installable Chrome desktop + Android Chrome + iOS Safari'],
    ['UC-11', 'App ouvrable hors-ligne après 1ère visite ; dernier feed visible ; toast d\'erreur sur écriture'],
  ],
  [800, 8560],
));

children.push(h2('9.3 Indicateurs de succès du projet (pilote 3 mois)'));
children.push(makeTable(
  ['Indicateur', 'Cible'],
  [
    ['Nombre de signalements citoyens validés', '≥ 50'],
    ['Délai moyen de validation admin', '< 6 h'],
    ['Disponibilité capteurs (6 zones)', '≥ 90 % du temps'],
    ['Notifications délivrées avec succès', '≥ 95 %'],
    ['Score Lighthouse PWA', '≥ 90'],
    ['NPS utilisateur post-pilote', '≥ 30'],
    ['Utilisateurs actifs/mois', '≥ 100'],
  ],
  [6360, 3000],
));

// ============================================================
// SECTION 10 — RISQUES
// ============================================================
children.push(h1('10. Analyse de risques et mitigation'));
children.push(makeTable(
  ['Risque', 'Probabilité', 'Impact', 'Mitigation'],
  [
    ['Coupure électrique fréquente', 'Élevée', 'Capteurs offline, backend down', 'Batterie + panneau solaire ; VPS hors zone Cameroun ; alerting perte signal'],
    ['Connectivité 3G/4G intermittente', 'Élevée', 'Citoyens ne peuvent pas signaler', 'PWA offline + cache app shell ; queue d\'envoi locale (V2)'],
    ['Faux positifs capteurs', 'Moyenne', 'Perte de confiance', 'Calibration obligatoire ; double seuil ; cooldown 30 min ; revue hebdo'],
    ['Signalements abusifs / trolling', 'Moyenne', 'Pollution data, charge admin', 'Validation admin obligatoire ; rate limit register ; ban manuel'],
    ['Perte de la base JSON', 'Faible', 'Perte totale des données', 'Sauvegarde quotidienne S3 ; migration PostgreSQL V2'],
    ['Adoption PWA iOS faible', 'Moyenne', 'Reach limité', 'InstallPrompt + tutoriel Safari illustré'],
    ['Vol/vandalisme capteurs', 'Moyenne', 'Couverture dégradée', 'Boîtier discret, fixation murale, sensibilisation locale ; budget +1/an'],
    ['Fuite de SENSOR_API_KEY', 'Faible', 'Ingestion frauduleuse', 'Rotation annuelle ; surveillance volumes par deviceId'],
    ['Compromission JWT', 'Faible', 'Usurpation user', 'JWT court 7 j ; secret long ; HTTPS strict'],
    ['Surcharge admin (trop de pending)', 'Moyenne', 'Délai validation > 24 h', 'Notifications mail admin ; multi-admins ; batch validation V2'],
  ],
  [2400, 1300, 2300, 3360],
));

// ============================================================
// SECTION 11 — LIVRABLES
// ============================================================
children.push(h1('11. Livrables finaux'));
children.push(p('À la fin du projet, l\'étudiant·e remet :'));
children.push(num('**Code source complet** versionné Git : src/ (frontend), backend/ (API), firmware/ (ESP32).'));
children.push(num('**Documentation technique** : README.md, ce cahier des charges, README firmware.'));
children.push(num('**Manuel utilisateur** (PDF, FR) avec captures d\'écran : inscription, signalement, installation PWA, notifications.'));
children.push(num('**Manuel administrateur** (PDF, FR) : validation, gestion capteurs/utilisateurs, lecture stats.'));
children.push(num('**Rapport de tests d\'acceptation** : résultat des 11 UC, captures Lighthouse, bugs résiduels.'));
children.push(num('**Démo vidéo** (2 min) : parcours complet signaler → valider → notifier → carte.'));
children.push(num('**Scripts de déploiement** : `npm run build`, configuration VPS (Nginx + certbot).'));
children.push(num('**6 capteurs physiques** assemblés, calibrés et installés (livrable optionnel selon contraintes terrain).'));

// ============================================================
// SECTION 12 — ANNEXES
// ============================================================
children.push(h1('12. Annexes'));

children.push(h2('Annexe A — Identité graphique'));
children.push(bullet('**Style** : « brutalisme éditorial tropical »'));
children.push(bullet('**Typographies** : Fraunces (titres, sérif contemporain), Inter (corps), JetBrains Mono (chiffres, valeurs capteurs)'));
children.push(bullet('**Palette** : papier crème (#F4ECD8), vert mangrove (#1E4D3B), terre cuite (#C46A3E), rouge alerte (#D7263D), noir encre (#0E0E0E)'));
children.push(bullet('**Composants** : bordures épaisses, ombres décalées, texture papier subtile'));
children.push(bullet('**Référence** : tokens CSS dans `src/styles/tokens.css`'));

children.push(h2('Annexe B — Diagramme de séquence : signalement → notification'));
children.push(...code(
`Utilisateur     Frontend       Backend         Admin         Push Service
    │              │              │              │                 │
    │ /signaler    │              │              │                 │
    ├─────────────▶│              │              │                 │
    │              │ caméra +     │              │                 │
    │              │ formulaire   │              │                 │
    │ valide       │              │              │                 │
    ├─────────────▶│ POST         │              │                 │
    │              │ /api/        │              │                 │
    │              │ disasters    │              │                 │
    │              ├─────────────▶│ valide,      │                 │
    │              │              │ persiste     │                 │
    │              │              │ status=      │                 │
    │              │              │ pending      │                 │
    │              │◀─────────────│ 201 Created  │                 │
    │              │              │              │ voit dans       │
    │              │              │              │ /admin/         │
    │              │              │              │ en-attente      │
    │              │              │ POST         │                 │
    │              │              │ /:id/validate│                 │
    │              │              │◀─────────────┤                 │
    │              │              │ status=      │                 │
    │              │              │ validated    │                 │
    │              │              │ notif créée  │                 │
    │              │              ├──────────────┼────────────────▶│
    │              │              │              │      Web Push    │
    │              │◀── SSE ──────│              │                 │
    │ notification │              │              │                 │
    │◀─────────────│              │              │                 │`
));

children.push(h2('Annexe C — Schéma de câblage ESP32'));
children.push(...code(
`              ┌──────────────────┐
   5V ────────│ VCC      HC-SR04 │
   GND ───────│ GND              │
   GPIO5 ─────│ TRIG             │
   GPIO18 ────│ ECHO             │
              └──────────────────┘

              ┌──────────────────┐
   3V3 ───────│ VCC      YL-83   │
   GND ───────│ GND              │
   GPIO34 ────│ A0               │
              └──────────────────┘

              ┌──────────────────┐
   3V3 ───────│ VCC  Sol capacit.│
   GND ───────│ GND              │
   GPIO35 ────│ A0               │
              └──────────────────┘

   Vbat ───[100kΩ]────┬───── GPIO33  (lecture batterie)
                      │
                  [100kΩ]
                      │
                     GND`
));

children.push(h2('Annexe D — Checklist déploiement'));
children.push(bullet('VPS provisionné (1 vCPU, 1 Go RAM, Ubuntu 24.04)'));
children.push(bullet('Node.js 20 LTS installé'));
children.push(bullet('Reverse proxy Nginx + certificat Let\'s Encrypt'));
children.push(bullet('backend/.env configuré (JWT_SECRET, SENSOR_API_KEY, VAPID_*, CORS_ORIGIN HTTPS)'));
children.push(bullet('db.json seedé avec 2 comptes + 6 capteurs'));
children.push(bullet('Frontend built (npm run build), dist/ servi par Nginx'));
children.push(bullet('DNS pointé vers le VPS'));
children.push(bullet('Service systemd pour backend (auto-restart)'));
children.push(bullet('Sauvegarde quotidienne db.json (cron + S3)'));
children.push(bullet('Monitoring uptime (UptimeRobot ou équivalent)'));
children.push(bullet('Comptes admin par défaut : mots de passe changés'));
children.push(bullet('6 capteurs flashés, calibrés, installés, vérifiés en monitoring'));

children.push(h2('Annexe E — Comptes initiaux de seed'));
children.push(quote('Ces comptes existent uniquement à des fins de démonstration. À supprimer ou changer impérativement avant mise en production.'));
children.push(makeTable(
  ['Email', 'Mot de passe', 'Rôle'],
  [
    ['admin@test.com', '12345678', 'admin'],
    ['user@test.com', '12345678', 'user'],
  ],
  [4500, 3000, 1860],
));
children.push(p('Six capteurs préenregistrés : Akwa, Bonabéri, New Bell, Bépanda, Ndogpassi, Makepè.'));

children.push(h2('Annexe F — Glossaire des dépendances'));
children.push(makeTable(
  ['Dépendance', 'Utilité dans le projet'],
  [
    ['react@^19.2', 'Couche UI déclarative'],
    ['react-router-dom@^7.15', 'Routage côté client'],
    ['react-leaflet@^5.0 + leaflet@^1.9', 'Composants React pour carte interactive'],
    ['framer-motion@^12.38', 'Animations d\'entrée/sortie'],
    ['date-fns@^4.1', 'Formatage « il y a 3 min », parsing ISO'],
    ['vite@^8.0', 'Bundler et dev server (HMR)'],
    ['vite-plugin-pwa@^1.3', 'Génération manifest + service worker Workbox'],
    ['express@^4.19', 'Serveur HTTP backend'],
    ['jsonwebtoken@^9.0', 'Création/vérification des JWT'],
    ['bcryptjs@^2.4', 'Hash mot de passe'],
    ['web-push@^3.6', 'Envoi Web Push (VAPID)'],
    ['express-rate-limit@^8.5', 'Limitation de débit'],
    ['cors@^2.8', 'Politique CORS'],
    ['dotenv@^16.4', 'Lecture .env'],
    ['vitest@^4.1', 'Tests unit/intégration'],
    ['concurrently@^9.2', 'Lancement parallèle front+back en dev'],
    ['kill-port@^2.0', 'Libération de ports avant relance'],
  ],
  [3000, 6360],
));

// Note de fin
children.push(spacer(400));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 600 },
  children: [new TextRun({ text: 'Fin du cahier des charges — Alerte Douala v1.0 — Mai 2026', font: FONT_BODY, size: 20, italics: true, color: COLOR.gray })],
}));

// =====================================================
// DOCUMENT
// =====================================================
const doc = new Document({
  creator: 'Alerte Douala',
  title: 'Cahier des charges — Alerte Douala v1.0',
  description: 'Plateforme citoyenne PWA + capteurs IoT — cahier des charges complet',
  styles: {
    default: { document: { run: { font: FONT_BODY, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 44, bold: true, font: FONT_HEAD, color: COLOR.green },
        paragraph: { spacing: { before: 480, after: 240 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 30, bold: true, font: FONT_HEAD, color: COLOR.green },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: FONT_HEAD, color: COLOR.terracotta },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } },
      { id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, italics: true, font: FONT_HEAD, color: COLOR.ink },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 3 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets',
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ] },
      { reference: 'numbers',
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        ] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 }, // US Letter
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR.green, space: 4 } },
          children: [new TextRun({ text: 'Cahier des charges — Alerte Douala v1.0', font: FONT_BODY, size: 18, italics: true, color: COLOR.gray })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: 'Page ', font: FONT_BODY, size: 18, color: COLOR.gray }),
            new TextRun({ children: [PageNumber.CURRENT], font: FONT_BODY, size: 18, color: COLOR.gray }),
            new TextRun({ text: ' / ', font: FONT_BODY, size: 18, color: COLOR.gray }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT_BODY, size: 18, color: COLOR.gray }),
          ],
        })],
      }),
    },
    children,
  }],
});

// ===== ÉCRITURE =====
const outDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'cahier-des-charges.docx');

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ Document généré : ${outPath} (${(buffer.length / 1024).toFixed(1)} ko)`);
}).catch((err) => {
  console.error('Erreur génération :', err);
  process.exit(1);
});
