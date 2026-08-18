# Configuration OVH

Les configurations locale et OVH sont strictement séparées :

- `.env.local` ou `.env` sert uniquement au développement ;
- `/var/www/app/site/shared/.env.production` sert uniquement au serveur OVH ;
- les fichiers `*.example` sont des modèles sans véritables secrets.

## Première installation

```bash
sudo mkdir -p /var/www/app/site/shared
sudo cp deploy/.env.production.example /var/www/app/site/shared/.env.production
openssl rand -base64 48
sudo chmod 600 /var/www/app/site/shared/.env.production
```

Reporter le secret généré dans `AUTH_SECRET`, puis personnaliser toutes les autres valeurs du fichier. Les valeurs contenant des caractères spéciaux doivent rester entre guillemets.

Les chemins persistants recommandés sont déjà présents dans le modèle&nbsp;:

- `DATABASE_PATH=/var/www/data/database/site.db` ;
- `MEDIA_ROOT=/var/www/data/media` ;
- `BACKUP_ROOT=/var/www/data/backups` ;
- `STORAGE_CAPACITY_BYTES=42949672960` pour le disque OVH de 40&nbsp;Gio ;
- `HOSTING_PROVIDER=OVH` pour le libellé affiché dans le dashboard.

Avant le premier déploiement, remplacez obligatoirement le domaine d’exemple, l’adresse administrateur, le mot de passe et `AUTH_SECRET`, puis vérifiez la configuration&nbsp;:

```bash
set -a
source /var/www/app/site/shared/.env.production
set +a
npm run env:check
```

Dans les variables CI/CD GitLab, définir aussi :

- `NEXT_PUBLIC_SITE_URL` avec l'URL HTTPS publique ;
- `AUTH_SECRET`, masqué et protégé ;
- `ADMIN_EMAIL`, masqué et protégé ;
- `ADMIN_PASSWORD`, masqué et protégé ;
- `DEPLOY_HOST` et `DEPLOY_USER` pour la connexion SSH.

Les quatre variables sensibles doivent être réservées à la branche protégée `main`. N’inscrivez aucune de leurs valeurs directement dans `.gitlab-ci.yml`.

`NEXT_PUBLIC_SITE_URL` est nécessaire pendant le build. Le script de déploiement charge ensuite le fichier OVH, applique les migrations et initialise l'administrateur de manière idempotente.

L’application et le script de déploiement refusent désormais une configuration contenant un secret factice, un domaine local, une URL non HTTPS, des chemins relatifs, un compte administrateur d’exemple ou une capacité disque invalide. Les véritables fichiers `.env*` sont ignorés par Git.

Après la mise en ligne, contrôlez `/connexion`, l’affichage d’une image et d’une vidéo, puis effectuez un export de sauvegarde depuis le tableau de bord. Le fichier réel doit rester accessible uniquement au compte de déploiement avec la permission `600`.

## Préparation du VPS

Le serveur doit disposer de Node.js 22, PM2, Nginx, SQLite, `curl`, `flock`, `tar` et `sha256sum`. Le compte de déploiement doit pouvoir écrire dans `/var/www/app/site`, `/var/www/data` et `/var/log/pm2`. Ajoutez l’utilisateur Nginx au groupe qui peut lire `/var/www/data/media`, sans lui donner le droit d’écrire dans la base.

Le pipeline assemble automatiquement le serveur standalone, ses fichiers statiques, les migrations et l’initialiseur SQLite. Le déploiement vérifie la somme SHA-256, sauvegarde la base avant migration, démarre une seule instance PM2 puis interroge `/api/health`. Si l’application ne répond pas, le lien `current` revient automatiquement sur la release précédente.

Planifiez `deploy/backup.sh` chaque nuit avec cron, puis synchronisez les sauvegardes vers un stockage externe chiffré. Une sauvegarde présente uniquement sur le VPS ne protège pas contre la perte complète du serveur.
