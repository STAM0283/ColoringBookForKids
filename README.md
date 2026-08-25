# Le Petit Crayon

Application Next.js full-stack utilisant PostgreSQL, Auth.js, Drizzle ORM et un stockage local persistant pour les images, vidéos et PDF.

## Architecture de production

```text
Internet → Caddy (HTTPS) → Next.js + PM2 (127.0.0.1:3000) → PostgreSQL local
                              │
                              └── /var/www/data/uploads
```

Cette architecture est adaptée à un site de petite ou moyenne taille administré par une seule personne : aucun conteneur, aucun orchestrateur et aucun backend séparé.

## Installation locale sous Windows

Installez :

- Node.js 22 ;
- PostgreSQL 18 avec pgAdmin et l’outil `psql` ;
- Git.

Pendant l’installation PostgreSQL, retenez le mot de passe de l’utilisateur `postgres`. Créez ensuite la base et l’utilisateur de l’application avec pgAdmin, ou dans `psql` :

```sql
CREATE USER coloringbook WITH PASSWORD 'votre-mot-de-passe-local';
CREATE DATABASE coloringbook OWNER coloringbook;
```

Initialisez le projet :

```powershell
Copy-Item .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

La connexion locale doit correspondre aux identifiants PostgreSQL :

```env
DATABASE_URL=postgresql://coloringbook:mot-de-passe@localhost:5432/coloringbook
```

Ouvrez ensuite [http://localhost:3000](http://localhost:3000).

### Comment la base et les tables sont créées

PostgreSQL est un service Windows qui écoute sur `localhost:5432`. Les deux commandes SQL précédentes créent seulement le rôle `coloringbook` et la base vide `coloringbook`.

Le fichier `src/db/schema.ts` décrit les tables, colonnes, relations et index de l’application. Drizzle transforme ce schéma en migrations SQL versionnées dans `src/db/migrations`. La commande suivante exécute uniquement les migrations qui ne l’ont pas encore été :

```powershell
npm run db:migrate
```

Elle crée actuellement 18 tables, dont `users`, `books`, `categories`, `media`, `activities`, `posts`, `vlogs`, `settings`, `club_codes` et `site_visits`. Drizzle conserve son propre journal de migrations dans PostgreSQL afin qu’une migration déjà appliquée ne soit pas rejouée.

La commande suivante initialise ensuite le compte administrateur et les réglages indispensables, sans ajouter de faux contenu :

```powershell
npm run db:seed
```

Les scripts de base chargent automatiquement le fichier `.env`. Il n’est pas nécessaire de définir manuellement `DATABASE_URL` dans PowerShell.

### Consulter PostgreSQL

Dans pgAdmin 4, ouvrez :

```text
Servers → PostgreSQL 18 → Databases → coloringbook → Schemas → public → Tables
```

Utilisez **Refresh** sur `Tables` après une migration. Vous pouvez aussi lancer :

```powershell
npm run db:studio
```

Ne modifiez jamais manuellement la structure de production. Modifiez `src/db/schema.ts`, générez une migration avec `npm run db:generate`, relisez le SQL généré, puis appliquez-la avec `npm run db:migrate`.

## Commandes principales

```bash
npm run dev
npm run build
npm start
npm run lint
npm run typecheck
npm test
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

## Migration des données SQLite existantes

Les anciennes migrations sont conservées dans `src/db/sqlite-migrations`. La dépendance SQLite est uniquement présente en développement pour permettre l’import historique ; l’application en production utilise exclusivement PostgreSQL.

```powershell
npm run db:migrate
npm run db:migrate:sqlite -- --sqlite .\data\database\site.db
```

Le script vérifie l’intégrité SQLite, conserve les relations et identifiants, convertit les dates et booléens et effectue l’import dans une transaction PostgreSQL. Il ignore les lignes déjà présentes.

## Dépannage local PostgreSQL

### `password authentication failed` ou code `28P01`

Le nom d’utilisateur ou le mot de passe de `DATABASE_URL` ne correspond pas au rôle PostgreSQL. Vérifiez d’abord `.env`, puis corrigez le rôle depuis pgAdmin ou avec le compte administrateur PostgreSQL :

```sql
ALTER ROLE coloringbook WITH LOGIN PASSWORD 'nouveau-mot-de-passe';
```

Redémarrez `npm run dev` après toute modification de `.env`.

### `relation "books" does not exist`

La connexion fonctionne, mais les migrations n’ont pas encore créé les tables :

```powershell
npm run db:migrate
npm run db:seed
```

### Connexion refusée sur le port 5432

Ouvrez `services.msc`, trouvez le service `postgresql-x64-18` et démarrez-le. Vérifiez ensuite :

```powershell
Test-NetConnection localhost -Port 5432
```

## Installation sur un VPS OVH Ubuntu

### 1. Préparer le serveur

Créez un utilisateur dédié disposant de `sudo` et connectez-vous avec une clé SSH. Installez ensuite :

- Node.js 22 LTS ;
- PostgreSQL 18 ;
- Caddy ;
- PM2 ;
- Git, `pg_dump`, `psql`, `tar`, `curl` et `rsync`.

```bash
sudo npm install -g pm2
sudo mkdir -p /var/www/lepetitcrayon/current /var/www/data/uploads /var/www/data/backups /var/log/pm2
sudo chown -R "$USER":"$USER" /var/www/lepetitcrayon /var/www/data /var/log/pm2
```

### 2. Créer PostgreSQL

PostgreSQL doit écouter uniquement sur l’interface locale. Ne publiez jamais le port 5432 sur Internet.

```bash
sudo -u postgres psql
```

```sql
CREATE USER coloringbook WITH PASSWORD 'MOT_DE_PASSE_LONG_ET_ALEATOIRE';
CREATE DATABASE coloringbook OWNER coloringbook;
\q
```

Vérifiez la connexion avant d’installer l’application :

```bash
psql "postgresql://coloringbook:MOT_DE_PASSE@localhost:5432/coloringbook" -c "select current_database(), current_user;"
```

### 3. Installer l’application

```bash
git clone URL_DU_DEPOT.git /var/www/lepetitcrayon/current
cd /var/www/lepetitcrayon/current
cp .env.example .env
nano .env
```

Variables importantes :

```env
APP_ENV="production"
NODE_ENV="production"
DATABASE_URL="postgresql://coloringbook:MOT_DE_PASSE@localhost:5432/coloringbook"
NEXT_PUBLIC_SITE_URL="https://lepetitcrayon.fr"
AUTH_SECRET="SECRET_ALEATOIRE"
AUTH_TRUST_HOST="true"
ADMIN_EMAIL="adresse-reelle@example.fr"
ADMIN_PASSWORD="MOT_DE_PASSE_ADMIN_LONG"
MEDIA_ROOT="/var/www/data/uploads"
BACKUP_ROOT="/var/www/data/backups"
HOSTING_PROVIDER="OVH VPS"
```

Générez le secret Auth.js avec :

```bash
openssl rand -base64 48
```

Puis déployez :

```bash
npm ci
npm run env:check
npm run db:migrate
npm run db:seed
npm run build
npm prune --omit=dev
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
pm2 startup
```

Exécutez la commande supplémentaire affichée par `pm2 startup`.

Vérifiez les services :

```bash
systemctl status postgresql
pm2 status
curl http://127.0.0.1:3000/api/health
```

### 4. Configurer Caddy

Le fichier [Caddyfile](./Caddyfile) redirige `www.lepetitcrayon.fr` vers le domaine principal et transmet le trafic à Next.js sur `127.0.0.1:3000`.

```bash
sudo cp Caddyfile /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo systemctl status caddy
```

Caddy obtient et renouvelle automatiquement le certificat HTTPS.

### 5. Configurer le DNS OVH

```text
A    @      IP_DU_VPS
A    www    IP_DU_VPS
```

Attendez la propagation DNS avant de vérifier HTTPS.

### 6. Pare-feu et SSH

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

N’ouvrez ni 3000 ni 5432. Après avoir validé votre clé SSH, désactivez la connexion root distante et l’authentification SSH par mot de passe. Fail2ban est utile si le serveur reçoit de nombreuses tentatives SSH.

## Mise à jour

Depuis `/var/www/lepetitcrayon/current` :

```bash
./scripts/backup-db.sh
./scripts/backup-uploads.sh
./scripts/deploy.sh
```

Le script récupère uniquement une avance Git linéaire, valide l’environnement, applique les migrations, construit Next.js, recharge PM2 et vérifie `/api/health`.

## Sauvegardes

```bash
./scripts/backup-db.sh
./scripts/backup-uploads.sh
```

Les sauvegardes PostgreSQL sont compressées et datées. La rétention quotidienne, hebdomadaire et mensuelle est configurable dans `.env`. Planifiez les deux scripts avec cron et copiez les archives vers un stockage externe chiffré.

Exemple de planification quotidienne avec `crontab -e` :

```cron
15 2 * * * cd /var/www/lepetitcrayon/current && ./scripts/backup-db.sh >> /var/log/lepetitcrayon-backup.log 2>&1
45 2 * * * cd /var/www/lepetitcrayon/current && ./scripts/backup-uploads.sh >> /var/log/lepetitcrayon-backup.log 2>&1
```

Restauration :

```bash
./scripts/restore-db.sh /var/www/data/backups/database/daily/backup_YYYY-MM-DD_HHMM.sql.gz
pm2 restart lepetitcrayon
```

La restauration demande une confirmation explicite. Sauvegardez toujours la base actuelle et les uploads avant de restaurer.

## Contrôles après déploiement

```bash
npm run lint
npm run typecheck
npm test
npm run build
pm2 status
pm2 logs lepetitcrayon --lines 100
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl status caddy postgresql
curl -fsS https://lepetitcrayon.fr/api/health
```

Testez également la connexion administrateur, la création et la modification d’un contenu, puis l’affichage d’une image, d’une vidéo et le téléchargement d’un PDF.

## Sécurité

- PostgreSQL, Next.js et PM2 n’écoutent pas publiquement.
- Caddy est le seul point d’entrée HTTP/HTTPS.
- Les mots de passe sont hachés avec bcrypt.
- Les cookies Auth.js sont HttpOnly, Secure en production et SameSite=Lax.
- Toutes les routes d’administration vérifient le rôle côté serveur.
- Les uploads sont vérifiés par signature MIME, limités en taille, renommés par UUID et protégés contre les traversées de chemin.
- PostgreSQL conserve uniquement les métadonnées des médias, jamais les gros fichiers.
- `/api/health` vérifie PostgreSQL et le stockage sans exposer de secret.
# Gestion bilingue français / anglais

Le site public utilise le français comme langue principale (`/`) et l’anglais sous le préfixe `/en`. Le sélecteur de langue conserve la page équivalente lorsque celle-ci existe. Les anciennes URL françaises restent donc compatibles.

Les livres, activités, articles, vidéos et catégories possèdent un champ PostgreSQL `language` (`FR` ou `EN`). Les contenus existants sont automatiquement conservés en français par la migration `0001_bilingual_content.sql`. Dans l’administration, sélectionner la langue au moment de créer le contenu ; un contenu anglais n’apparaît que dans les pages anglaises.

Après récupération d’une version contenant une nouvelle migration, le déploiement doit exécuter :

```bash
npm run db:migrate
```

Le sitemap contient les routes des deux langues et les principales pages déclarent leurs alternatives `fr`/`en`. Avant de publier un contenu anglais, traduire manuellement le titre, la description, le contenu et les métadonnées SEO ; ne pas publier de traduction automatique non relue.
