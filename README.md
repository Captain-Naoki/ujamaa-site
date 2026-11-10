# Site web Ujamaa

Site vitrine statique (HTML / CSS / JavaScript, sans étape de build) de la startup et communauté tech **Ujamaa**.
Bilingue (français / anglais), thèmes clair et sombre.

## Pages

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil FR : hero (carte de l'Afrique animée), manifeste, identité du logo, expertise, communauté, réalisations (Injara + captures), méthode, FAQ, contact |
| `en/index.html` | Accueil EN |
| `mentions-legales.html`, `confidentialite.html` | Pages légales FR (quelques champs `[à compléter]`) |
| `en/legal-notice.html`, `en/privacy.html` | Pages légales EN |
| `404.html` | Page d'erreur bilingue |
| `robots.txt`, `sitemap.xml`, `site.webmanifest` | SEO et PWA |
| `vercel.json` | Configuration Vercel (préproduction) |
| `.htaccess` | Configuration Apache (hébergement définitif type cPanel) |

Les captures d'Injara sont dans `assets/img/injara/light` et `assets/img/injara/dark` : la version affichée suit le thème choisi.

## Tester en local

Depuis ce dossier `site` :

```bash
python -m http.server 5173
```

Puis ouvrir http://localhost:5173. Les chemins sont absolus (`/assets/...`) : le site doit être servi depuis la racine d'un domaine, pas ouvert en double-cliquant sur le fichier.

## Mettre en ligne sur Vercel (préproduction)

1. Ouvrir ce dossier `site` dans VS Code.
2. Publier le dépôt sur GitHub (panneau « Contrôle de code source » → « Publier sur GitHub »).
3. Sur vercel.com, « Add New… → Project », importer le dépôt, Framework Preset : **Other**, sans commande de build, puis « Deploy ».
4. Chaque `git push` redéploie automatiquement.

`vercel.json` envoie l'en-tête `X-Robots-Tag: noindex` : la préproduction n'est pas indexée par Google.
**Si Vercel devient l'hébergement définitif, supprimer cette ligne.**

## Avant la mise en ligne définitive

Guide complet : `../HEBERGEMENT-SPACESHIP.md`.

1. **Domaine** : `python outils/preparer-mise-en-ligne.py VOTRE-DOMAINE` (depuis le dossier `ujamaa`) remplace `www.ujamaa.cm` partout et crée le zip à envoyer.
2. **Mentions légales** : compléter RCCM / NIU et directeur de publication (FR et EN). L'hébergeur (Spaceship) est renseigné.
3. **Cache** : après modification de `main.css`, `main.js`, `africa.js` ou `icons.svg`, changer le numéro `?v=` dans les pages HTML.
4. **HTTPS** (hébergement Apache) : décommenter la redirection et l'en-tête HSTS dans `.htaccess`.
5. **Google Search Console** : déclarer le domaine et soumettre `sitemap.xml`.
6. **Google Business Profile** : créer la fiche « Ujamaa — Dschang » pour le référencement local.

## Technique

- Animations : GSAP 3.13 (ScrollTrigger, SplitText) + Lenis, auto-hébergés dans `assets/vendor/`.
- Polices auto-hébergées (Unbounded, Manrope, JetBrains Mono, Sansita de la charte) : aucune requête tierce, aucun cookie.
- Thème : suit la préférence du système, mémorisé dans le navigateur après un clic sur le bouton soleil / lune.
- Accessibilité : HTML sémantique, lien d'évitement, navigation clavier, `prefers-reduced-motion` respecté, contenu lisible sans JavaScript.
- SEO : balises uniques par page, canonical + hreflang FR/EN, Open Graph, données structurées schema.org (Organization, WebSite, FAQPage, SoftwareApplication), sitemap multilingue.
