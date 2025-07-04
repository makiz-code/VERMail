# VERMail

VERMail est un système piloté par intelligence artificielle pour la classification automatique des emails et l’extraction d’informations. Il est accessible via une application web conviviale permettant la configuration du système, l’entraînement des modèles et la visualisation des données sur des tableaux de bord.

## Prérequis

Avant de lancer le projet, assurez-vous d'avoir :

- **Python** installé (version 3.8 ou supérieure)  
- **Pip** installé  
- **Node.js et npm** installés pour le frontend  
- **Un environnement conda** (ex : `cuda`) configuré (optionnel mais recommandé)  
- **Serveur web** pour héberger l’application backend et frontend  

## Installation

1. **Téléchargez le projet :**  
   Clonez ce dépôt ou téléchargez-le en `.zip` et extrayez-le.

2. **Configurez l’environnement :**  
   Ouvrez un terminal et tapez :  
   cd "chemin/vers/le/projet/VERMail"
   conda activate cuda

3. **Installez les dépendances backend :**  
   Installer les dépendances manuellement selon les erreurs rencontrées.

4. **Installez les dépendances frontend :**  
   npm --prefix ./frontend install

5. **Mettez à jour les fichiers de configuration :**  
   Mettez à jour les fichiers de configuration dans le backend (ex : config.py) avec les paramètres nécessaires.

## Exécution

Lancez les serveurs backend et frontend avec les commandes suivantes:

   run backend server: python backend/app.py
   run frontend server: npm --prefix ./frontend start
