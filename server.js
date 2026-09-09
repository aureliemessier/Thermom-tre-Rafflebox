const express = require('express');
const { createCanvas } = require('canvas');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Montant par défaut au démarrage
let montantActuel = 815;

// Route POST reçue de Make.com pour mettre à jour le montant
app.post('/update-montant', (req, res) => {
  let { montant } = req.body;

  // Nettoyage flexible : extrait uniquement les chiffres et les décimales
  if (typeof montant === 'string') {
    montant = montant.replace(/[^0-9.,]/g, '').replace(',', '.');
  }

  const valeurNum = parseFloat(montant);

  if (!isNaN(valeurNum)) {
    montantActuel = valeurNum;
    console.log(`Montant mis à jour : ${montantActuel} $`);
    return res.status(200).send({ success: true, montant: montantActuel });
  }

  res.status(400).send({ error: "Montant invalide reçu", recu: req.body.montant });
});

// Route GET d'affichage du thermomètre PNG
app.get('/thermometre.png', (req, res) => {
  const objectif = 3000;
  const couleurTheme = '#c21e56';

  const pourcentage = Math.min(Math.max((montantActuel / objectif) * 100, 0), 100);

  // Création du Canvas (600x220 px)
  const canvas = createCanvas(600, 220);
  const ctx = canvas.getContext('2d');

  // Arrière-plan blanc avec coins arrondis
  ctx.fillStyle = '#ffffff';
  ctx.roundRect(0, 0, 600, 220, 12);
  ctx.fill();

  // Titre
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('OBJECTIF DU 50/50 : 3 000 $', 300, 45);

  // Montant récolté
  ctx.fillStyle = couleurTheme;
  ctx.font = 'bold 34px Arial';
  ctx.fillText(`${montantActuel.toLocaleString('fr-CA')} $ Amassés`, 300, 90);

  // Thermomètre (Fond gris)
  ctx.fillStyle = '#e0e0e0';
  ctx.beginPath();
  ctx.roundRect(50, 115, 500, 36, 18);
  ctx.fill();

  // Thermomètre (Remplissage rose)
  if (pourcentage > 0) {
    const largeurRemplissage = Math.max((500 * pourcentage) / 100, 36);
    ctx.fillStyle = couleurTheme;
    ctx.beginPath();
    ctx.roundRect(50, 115, largeurRemplissage, 36, 18);
    ctx.fill();
  }

  // Pourcentage
  ctx.fillStyle = pourcentage > 15 ? '#ffffff' : '#333333';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(pourcentage)} %`, 530, 139);

  // Pied de carte
  ctx.fillStyle = '#777777';
  ctx.font = 'italic 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Mise à jour automatique en temps réel', 300, 190);

  // En-têtes Anti-Cache obligatoires pour les courriels
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const buffer = canvas.toBuffer('image/png');
  res.send(buffer);
});

app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));
