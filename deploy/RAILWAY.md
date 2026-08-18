# Déploiement Railway

Le projet est prêt pour un déploiement Docker Railway avec une seule instance Next.js et un volume persistant SQLite.

## 1. Créer le service

1. Envoyer le projet sur un dépôt GitHub privé.
2. Dans Railway, créer un projet depuis ce dépôt.
3. Railway détecte `railway.toml` et construit automatiquement `Dockerfile`.
4. Ne pas activer plusieurs répliques : SQLite doit rester sur une seule instance applicative.

## 2. Ajouter le volume persistant

Créer un volume Railway et le monter exactement sur `/data`.

```text
/data/database/site.db
/data/media/images
/data/media/videos
/data/media/pdf
/data/backups
```

Sans ce volume, les contenus seraient perdus lors d’un redéploiement.

## 3. Configurer les variables

Reprendre `deploy/.env.railway.example` dans l’onglet Variables. Remplacer impérativement les valeurs d’exemple :

```ini
APP_ENV=production
AUTH_TRUST_HOST=true
AUTH_SECRET=<secret aléatoire d'au moins 32 caractères>
ADMIN_EMAIL=<adresse administrateur réelle>
ADMIN_PASSWORD=<mot de passe long et unique>
NEXT_PUBLIC_SITE_URL=https://<domaine Railway ou domaine personnalisé>
NEXT_PUBLIC_INSTAGRAM_URL=https://www.instagram.com/lena.stam.coloringbook
DATABASE_PATH=/data/database/site.db
MEDIA_ROOT=/data/media
BACKUP_ROOT=/data/backups
STORAGE_CAPACITY_BYTES=5368709120
HOSTING_PROVIDER=Railway
```

Générer `AUTH_SECRET` localement avec `openssl rand -base64 48`.

`NEXT_PUBLIC_SITE_URL` est utilisée pendant le build. Après ajout d’un domaine personnalisé, modifier cette variable puis redéployer.

## 4. Domaine et contrôle

1. Générer un domaine Railway ou connecter le domaine définitif.
2. Vérifier que `NEXT_PUBLIC_SITE_URL` correspond exactement à son URL HTTPS.
3. Le healthcheck configuré est `/api/health`.
4. Après le premier déploiement, tester `/connexion`, un média, une vidéo et un PDF.

## 5. Données et sauvegardes

L’entrypoint crée les répertoires, vérifie les secrets, applique les migrations et initialise l’administrateur de manière idempotente. Une sauvegarde SQLite pré-migration est créée uniquement lorsque le jeu de migrations change, pas lors de chaque redémarrage.

Activer également les sauvegardes du volume Railway. Télécharger périodiquement une copie SQLite depuis le dashboard et conserver une copie externe des médias.

## 6. Coûts et limites

Le forfait Hobby dispose par défaut de 5 Go de volume. Conserver `STORAGE_CAPACITY_BYTES=5368709120` tant que cette limite n’est pas augmentée. Mettre cette valeur à jour après tout redimensionnement afin que le dashboard reste fidèle à la capacité réelle.
