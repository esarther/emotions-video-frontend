# Configuration des Variables d'Environnement Netlify

## ✅ Variables déjà configurées
- `SUPABASE_URL` ✅
- `SUPABASE_SERVICE_KEY` ✅
- `SUPABASE_ANON_KEY` ✅
- `STRIPE_PUBLIC_KEY` ✅
- `STRIPE_SECRET_KEY` ✅
- `NEXTAUTH_SECRET` ✅
- `CRON_SECRET` ✅

## ❌ Variables Cloudinary MANQUANTES

Vous devez ajouter ces 3 variables dans Netlify :

1. **CLOUDINARY_CLOUD_NAME**
   - Valeur : Votre Cloud Name depuis votre dashboard Cloudinary
   - Où le trouver : https://cloudinary.com/console → Settings → Product environment credentials

2. **CLOUDINARY_API_KEY**
   - Valeur : Votre API Key depuis Cloudinary
   - Où le trouver : Même page que ci-dessus

3. **CLOUDINARY_API_SECRET**
   - Valeur : Votre API Secret depuis Cloudinary
   - Où le trouver : Même page que ci-dessus

## 📝 Instructions pour ajouter les variables

1. Dans Netlify, allez dans **Project configuration** > **Environment variables**
2. Cliquez sur **"Add a variable"** ou **"Add variable"**
3. Ajoutez les 3 variables Cloudinary une par une :
   - Key: `CLOUDINARY_CLOUD_NAME`, Value: `votre_cloud_name`
   - Key: `CLOUDINARY_API_KEY`, Value: `votre_api_key`
   - Key: `CLOUDINARY_API_SECRET`, Value: `votre_api_secret`
4. Assurez-vous que le scope est **"All scopes"** et le contexte **"Same value in all deploy contexts"**
5. Sauvegardez

## ⚠️ Important

- Les variables sont sensibles, ne les partagez jamais publiquement
- Après avoir ajouté les variables, vous devrez peut-être redéployer le site pour qu'elles soient prises en compte
- Vérifiez que les valeurs sont correctes (pas d'espaces avant/après)

## 🧪 Test après configuration

Une fois les variables ajoutées :
1. Testez l'upload depuis le frontend
2. Vérifiez les logs dans Netlify (Functions > Logs) pour voir si Cloudinary fonctionne
3. Vérifiez la console du navigateur pour les erreurs

