# Heticall

Prototype d'appel par QR code pour les cours : l'élève scanne, il est présent.

Projet étudiant réalisé à HETIC (2e année, développement web). Le prototype a été réalisé avec l'aide d'une IA, puis relu et adapté.

## Le principe

1. Le professeur ouvre l'appel : un QR code et un code de séance s'affichent, valables **15 minutes**.
2. L'élève scanne le QR code avec son téléphone. La première fois, il saisit son nom (mémorisé sur le téléphone). Ensuite, **un scan suffit** : il est marqué présent automatiquement.
3. Passé le délai, le scan le marque **absent**.
4. **Seul le professeur** peut modifier une présence.

Le but : un cadre clair et équitable, et ne plus avoir à déranger le professeur pour 5 minutes de retard.

## Lancer le projet

Prérequis : [Node.js](https://nodejs.org) 18 ou plus.

```bash
npm install
npm start
```

Sous Windows, on peut aussi double-cliquer sur `lancer.bat`.

- Page professeur : http://localhost:3000/prof.html (mot de passe par défaut : `hetic`)
- Page élève : http://localhost:3000/?code=CODE

Pour changer le mot de passe et le port :

```bash
PROF_PASSWORD=monmotdepasse PORT=4000 npm start
```

## Tester avec un téléphone

Le QR code utilise l'adresse du PC sur le réseau local. Le téléphone et le PC doivent être sur le même réseau Wi-Fi. Sans téléphone, cliquer sur le lien affiché sous le QR code simule un scan.

## Structure

```
server.js          API Express (séance, scan, liste, correction)
public/index.html  page élève (scan automatique)
public/prof.html   page professeur (QR, compte à rebours, liste)
public/style.css   styles
```

## API

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| POST | `/api/session` | professeur | ouvre un appel de 15 min |
| GET | `/api/session` | professeur | état de l'appel + QR code |
| POST | `/api/checkin` | élève | enregistre un scan |
| GET | `/api/records` | professeur | liste des présences |
| PATCH | `/api/records/:id` | professeur | corrige une présence |

L'accès professeur utilise l'en-tête `x-prof-password`.

## Limites actuelles et suite

- Données gardées en mémoire (perdues à l'arrêt du serveur).
- Le nom est saisi à la main : on pourrait scanner pour un autre. À terme, connexion avec les comptes de l'école.
- Prochaines étapes : base de données, comptes, historique par cours, export.

## Licence et marque

Code sous licence MIT. Le logo et le nom HETIC appartiennent à leurs propriétaires et ne sont utilisés ici que dans le cadre d'un projet scolaire.
