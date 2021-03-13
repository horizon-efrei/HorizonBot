<h2 align="center">MonkaBot</h2>
<p align="center">
    🦉 Le bot discord de <a href="https://discord.gg/WTGdnn4yzv">EFREI Révisions Entraide (ERE)</a>
</p>

## Rapport de bug et suggestions

- Vous avez aperçu un bug en utilisant MonkaBot ?
- Vous avez une idée ou une suggestion ?
- Vous souhaitez nous faire part de quelque chose ?

Vous pouvez vous rendre dans le [menu des issues] et en créer une ; nous y jetterons un œil dès que possible !\
Pour tout autre question, vous pouvez créer une [Discussion GitHub].

## Développement et contributions

Nos Pull Request (PR) sont ouvertes à toute contribution ! Vous pouvez regarder notre [guide de contributions] avant de commencer à travailler sur MonkaBot : il vous aidera à tout mettre en place et à vous assurer que votre PR puisse être merge rapidement.

## Informations

MonkaBot est un bot Discord développé en TypeScript (un dérivé de JavaScript avec un typage plus fort). Il utilise la librairie [discord.js] pour les appels à l'API Discord.
Il utilise également le framework [Sapphire], par-dessus discord.js.
Ce framework sert notamment à gérer les évènements, les commandes et les arguments...

Vous pouvez utiliser le bot pour votre propre serveur à condition de respecter la [License] (MIT).

## Organisation du projet

- **`dist`** *(pas sur GitHub)* **:** Dossier où se trouve le code transpilé de MonkaBot, après avoir lancé `npm run build` (ou `npm start`).
- **`config` :** Dossier où se trouvent tous les fichiers de configuration de MonkaBot.
- **`src` :**
  - **`commands` :** Dossier où se trouvent toutes les commandes, rangées dans des sous-dossiers correspondant à leurs catégories.
  - **`events` :** Dossier où se trouvent tous les gestionnaires d'évènement.
  - **`types` :** Fichiers contenant les typings TypeScript nécessaires pour MonkaBot.

## Crédits

#### Développeurs

- [noftaly] (noftaly#0359)

#### Contributeurs

*Aucun pour le moment, mais je veux bien un [petit coup de main] 🙂*

#### License

MonkaBot est sous license [MIT](./LICENSE).

<!-- Link Dump -->

[menu des issues]: https://github.com/noftaly/MonkaBot/issues
[Discussion GitHub]: https://github.com/noftaly/MonkaBot/discussions
[guide de contributions]: ./CONTRIBUTING.md
[discord.js]: https://npmjs.com/package/discord.js
[Sapphire]: https://www.npmjs.com/package/@sapphire/framework
[License]: https://github.com/noftaly/MonkaBot/blob/master/LICENSE
[noftaly]: https://github.com/noftaly
[petit coup de main]: #-développement-et-contributions
[MIT]: ./LICENSE
