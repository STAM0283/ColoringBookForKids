# Le Petit Crayon

Site éditorial et back-office pour une marque de livres de coloriage et d’activités pour enfants. Le projet utilise Next.js App Router, React, TypeScript strict, Tailwind, SQLite, Drizzle ORM et Auth.js. Les données et médias restent hors des releases.

## Installation locale

Prérequis : Node.js 22 LTS, npm 10+ et les outils de compilation C++ nécessaires à `better-sqlite3`.

```powershell
Copy-Item .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:bootstrap
npm run dev
```

Ouvrir `http://localhost:3000`. L’administration est accessible sur `/connexion`. Le bootstrap crée uniquement le compte administrateur et les réglages indispensables à partir de `ADMIN_EMAIL` et `ADMIN_PASSWORD`.

Les données de démonstration sont facultatives et strictement réservées au développement :

```powershell
$env:ALLOW_DEMO_SEED="true"
npm run db:seed:dev
```

## Variables principales

- `DATABASE_PATH` : chemin de la base SQLite.
- `MEDIA_ROOT` : racine des médias persistants.
- `BACKUP_ROOT` : emplacement des sauvegardes temporaires et de sécurité.
- `AUTH_SECRET` : secret aléatoire d’au moins 32 octets.
- `NEXT_PUBLIC_SITE_URL` : origine canonique du site.
- `NEXT_PUBLIC_INSTAGRAM_URL` : adresse du compte Instagram utilisée par le Club.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` : identifiants du compte créé au bootstrap.

## Vérifications

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

SQLite fonctionne avec WAL, clés étrangères et délai d’attente. Les listes publiques utilisent les repositories paginés. Les routes d’administration valident l’authentification et les entrées. Les fichiers passent par l’abstraction de stockage, qui contrôle leur signature, leur MIME, leur taille et leur chemin.

## Production OVH Ubuntu

1. Installer Node 22, Nginx, PM2, SQLite et Certbot.
2. Séparer les releases applicatives des données persistantes.
3. Conserver la base, les médias et les sauvegardes sous un répertoire partagé hors Git.
4. Configurer les variables d’environnement et lancer `db:migrate`, puis `db:bootstrap` une seule fois.
5. Exécuter lint, types, tests et build avant chaque déploiement.

Le répertoire de données ne doit jamais être remplacé pendant un déploiement. Les médias peuvent être servis directement par Nginx avec prise en charge des requêtes Range pour les vidéos.

## Production Railway

Railway utilise `Dockerfile` et `railway.toml`. Un volume persistant monté sur `/data` conserve SQLite, les images, les vidéos, les PDF et les sauvegardes entre les déploiements. Le conteneur vérifie les secrets, applique les migrations puis démarre Next.js automatiquement.

Conserver une seule réplique avec SQLite. Les variables et les étapes détaillées sont documentées dans [`deploy/RAILWAY.md`](deploy/RAILWAY.md).

## Sauvegarde et restauration

Le tableau de bord permet d’exporter la base SQLite et de restaurer un export valide. Une sauvegarde de sécurité est créée automatiquement avant chaque restauration. En production, planifier également une sauvegarde externe de la base **et** des médias, avec une rétention adaptée.

## Club Instagram

Une activité peut être publique ou réservée au Club. Après vérification manuelle de l’abonnement Instagram, l’administrateur génère un code unique depuis `/admin/codes-acces` et l’envoie en message privé. Le code est utilisable une seule fois et ouvre l’accès aux PDF Club sur l’appareil pendant 12 mois. Les codes ne sont stockés que sous forme hachée et les téléchargements protégés passent par une route serveur contrôlée.

## Architecture

- `src/app` : pages, layouts et routes API.
- `src/components` : composants publics et d’administration.
- `src/repositories` : requêtes de lecture paginées et optimisées.
- `src/db` : schéma, migrations et initialisation.
- `src/lib/storage` : stockage et validation des médias.
- `deploy` : configurations Railway et OVH, migrations de production et scripts d’exploitation.
