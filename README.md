# VERMail

VERMail est un système piloté par l'IA pour automatiser la classification des e-mails et l’extraction d’informations pertinentes à partir des fichiers attachés. Il est accessible via une application web conviviale permettant la configuration du système, l'entraînement des modèles et la visualisation des résultats en temps réel.

## Prérequis

Avant de lancer le projet, assurez-vous d'avoir :

- **Python** installé (version 3.8 ou supérieure)  
- **Pip** installé  
- **Node.js et npm** installés

## Installation

1. **Téléchargez le projet :**  
   Clonez ce dépôt ou téléchargez-le en `.zip` et extrayez-le.

2. **Configurez l’environnement :**  
   Créez un environnement Conda à partir du fichier cuda.yml  
   Activez l’environnement 'cuda'

3. **Installez les dépendances :**  
   npm --prefix ./frontend install

4. **Mettez à jour les fichiers de configuration :**  
   Mettez à jour les fichiers de configuration dans le backend avec les paramètres nécessaires.

## Exécution

Lancez les serveurs backend et frontend avec les commandes suivantes:

   run backend server: python backend/app.py
   run frontend server: npm --prefix ./frontend start
