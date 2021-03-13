<h2 align="center">MonkaBot</h2>
<p align="center">
    🦉 Le bot discord de <a href="https://discord.gg/WTGdnn4yzv">EFREI Révisions Entraide (ERE)</a>
</p>

## Installation

- Installez [Node.js](https://nodejs.org/fr/) sur votre machine. Il vous faudra Node.js 12 ou supérieur.
- Téléchargez la [dernière version stable](https://github.com/noftaly/MonkaBot/releases/latest), ou clonez ce dépôt pour tester les dernières modifications.
- Pensez à avoir une base de donnée MongoDB, le plus simple serait en local.
- Copiez le fichier `.env.example` vers `.env` et remplissez-le.
- Exécutez la commande `npm i` pour installer les dépendances nécessaires.
- C'est parti ! Exécutez la commande `npm run dev` *(ou `npm start` en production)* pour démarrer MonkaBot.

## Rapport de bug et suggestions

- Vous avez aperçu un bug en utilisant MonkaBot ?
- Vous avez une idée ou une suggestion ?
- Vous souhaitez nous faire part de quelque chose ?

Vous pouvez vous rendre dans le [menu des issues](https://github.com/noftaly/MonkaBot/issues) et en créer une ; nous y jetterons un œil dès que possible !

## Développement et contributions

Nos Pull Request (PR) sont ouvertes à toute contribution ! Vous pouvez [créer un fork](https://github.com/Skript-MC/MonkaBot/fork) (= une copie) de ce dépôt et y faire vos modifications.\
Voici quelques informations utiles avant de créer une Pull Request :

- 🔀 Faites vos modifications sur une nouvelle branche ! Ce sera plus simple ensuite pour tenir votre PR à jour.
- 🏷️ Créez votre PR vers la branche `dev` uniquement.
- 🚨 Respectez les règles ESLint ; vous pouvez vérifier avec la commande `npm run lint`.
- ⚡️ Vérifiez qu'aucune vulnérabilité n'est présente ; via la commande `npm audit`.
- ✅ Pensez bien à tester votre nouvelle fonctionnalité, autant que possible !

## Informations

MonkaBot est un bot Discord développé en TypeScript (un dérivé de JavaScript avec un typage plus fort). Il utilise la librairie [discord.js](https://npmjs.com/package/discord.js) pour les appels à l'API Discord.
Il utilise également le framework [Sapphire](https://www.npmjs.com/package/@sapphire/framework), par-dessus discord.js.
Ce framework sert notamment à gérer les évènements, les commandes et les arguments...

Vous pouvez utiliser le bot pour votre propre serveur à condition de respecter la [License](https://github.com/noftaly/MonkaBot/blob/master/LICENSE) (MIT).

## Organisation du projet

- **`dist`** *(pas sur GitHub)* **:** Dossier où se trouve le code transpilé de MonkaBot, après avoir lancé `npm run build` (ou `npm start`).
- **`config` :** Dossier où se trouvent tous les fichiers de configuration de MonkaBot.
- **`src` :**
  - **`commands` :** Dossier où se trouvent toutes les commandes, rangées dans des sous-dossiers correspondant à leurs catégories.
  - **`events` :** Dossier où se trouvent tous les gestionnaires d'évènement.
  - **`types` :** Fichiers contenant les typings TypeScript nécessaires pour MonkaBot.

## Merci

#### Développeurs

- [noftaly](https://github.com/noftaly) (noftaly#0359)

#### Contributeurs

*Aucun pour le moment, mais je veux bien un [petit coup de main](#-développement-et-contributions) 🙂*
