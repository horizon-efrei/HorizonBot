# Contribuer

*Inspiré des [directives de contributions de Skyra]*

## Préambule

N'ayez pas peur de contribuer ! Ce n'est pas grave si vous faites une erreur, on est là pour apprendre ! Le principe
d'une Pull Request est justement de pouvoir s'améliorer mutuellement et de faire évoluer le code ensemble. Si vous avez
un doute, créez votre PR quand même en faisant part de votre doute dans le message, ou venez me voir en privé sur
Discord (`noftaly#0359`).\
Sur votre PR, n'ayez pas peur de faire autant de commits dont vous avez besoin, ils seront de toute façon squash
(= réunis) en un seul commit avant de merge.

## Directives

**Les issues sont uniquement pour signaler des bugs ou proposer des suggestions. Si vous avez une question concernant
le bot ou son développement, contactez-moi sur Discord (`noftaly#0359`) ou ouvrez une Discussion GitHub**.

Pour contribuer à ce repo, n'hésitez pas à créer un nouveau fork et à soumettre une Pull Request, en suivant ces
instructions :

1. Forkez, clonez, et selectionnez la branche `master`.
1. **Créez une nouvelle branche sur votre fork.**
1. Faites vos changements.
1. Assurez-vous que le lint passe avec `npm run lint`.
1. Pensez-bien à tester vos changements de manière **intensive**.
1. Commitez vos changements en respectant le plus que possible le style *[conventional commits]* (regardez les commits
précédents sur le repo), et pushez-les.
1. Soumettez une Pull Request! Assurez-vous que votre PR fait bien un changement dans un domaine précis : 1 PR = 1
changement (ne faites pas 3 commandes et 4 bugfixes en une seule PR).

⚠️ Utilisez l'anglais pour vos commits, les commentaires dans votre code, les messages de logs dans la console, les
variables et tout autre objet compris directement dans le code.\
Les messages visibles par les utilisateurs (envoyés par discord), votre PR, vos issues etc. doivent être en **français**.

## Lancer MonkaBot localement

Pour lancer MonkaBot localement, il faut suivre ces étapes :

1. Installez [Node.js].
1. Renommez le fichier `.env.example` à la racine du projet, en `.env`.
1. Remplissez ce fichier avec vos tokens et votre configuration.
1. Installez les dependences avec `npm install`.
1. Lancez MonkaBot en mode "développement" avec `npm run dev`.

D'autres commandes importantes :

```bash
# Lancer les tests de style de code ('lint')
$ npm run lint

# Appliquer automatiquement les règles de style de code
$ npm run lint:fix

# Lancer MonkaBot en mode de développement
$ npm run dev

# Lancer MonkaBot en mode de production
$ npm start
```

## Concept de MonkaBot

Il y a certaines directives à prendre en compte avant que vos changements soient acceptés. *Ce n'est pas une liste
exhaustive, mais ca peut vous donner une idée de ce à quoi penser avant de faire vos changements.*

- Les fonctionnalités de MonkaBot doivent être utiles à la majorité des utilisateurs. Mais ne laissez pas cela vous
arrêter : votre idée est surement très bonne aussi !
- Pensez que vous développez une fonctionnalité pour un discord d'entraide et de révision, pas une communauté de jeu.
Ainsi, inutile d'ajouter des commandes "fun" ou qui n'ont rien à voir avec le thème du discord.
- Votre code doit suivre nos règles ESLint dans la mesure du possible, et les tests de lint doivent passer, même si
cela vous oblige à désactiver quelques règles **localement, pas dans le fichier `.eslintrc.js`**.

<!-- Link Dump -->

[directives de contributions de Skyra]: https://github.com/skyra-project/skyra/blob/75df79bd409f78d224e50a39acdf3e2a10679cd4/.github/CONTRIBUTING.md
[conventional commits]: https://www.conventionalcommits.org/en/v1.0.0/
[Node.js]: https://nodejs.org/en/download/
