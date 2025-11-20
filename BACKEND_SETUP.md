# Configuration du Backend Netlify Functions

## 📋 Résumé

Le frontend fait des appels à un backend Netlify Function qui doit être déployé sur Netlify.

## 🔧 Installation des dépendances

Pour que la fonction `upload.js` fonctionne, vous devez installer les dépendances suivantes :

```bash
npm install cloudinary multiparty
```

## ⚙️ Configuration des variables d'environnement sur Netlify

1. Allez sur votre dashboard Netlify
2. Sélectionnez votre site
3. Allez dans **Site settings** > **Environment variables**
4. Ajoutez les variables suivantes :

```
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

## 🚀 Déploiement

1. Assurez-vous que `netlify.toml` est à la racine du projet
2. La fonction est dans `netlify/functions/upload.js`
3. Déployez sur Netlify (via Git ou Netlify CLI)

## 🧪 Test

Une fois déployé, testez l'upload depuis le frontend. Les logs dans la console du navigateur vous indiqueront si la connexion fonctionne.

## ⚠️ Note importante

Si le backend existe déjà sur `https://sensational-naiad-e44c75.netlify.app`, vous n'avez peut-être pas besoin de créer cette fonction. Testez d'abord pour voir si l'endpoint répond.


