const express = require('express');
const { createCanvas } = require('canvas');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/thermometre.png', async (req, res) => {
  let montantActuel = 0;
  const objectif = 3000;
  const couleurTheme = '#c21e56';

  try {
    // Interrogation directe de l'API de Rafflebox sans ouvrir de navigateur
    const response = await fetch('https://api.rafflebox.ca/raffles/fa-ll', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      // Extraction du montant total du jackpot
      if (data && (data.jackpot || data.totalSales || data.currentAmount)) {
        montantActuel = parseFloat(data.jackpot || data.totalSales || data.currentAmount);
      }
    }
  } catch (error) {
    console.error("Erreur de lecture de l'API Rafflebox:", error);
  }

  // Calcul du pourcentage (sur 3 000 $)
  const pourcentage = Math.min(Math.max((montantActuel / objectif) * 100, 0), 100);

  // Création du visuel PNG (600x220 px)
  const canvas = createCanvas(600, 220);
  const ctx = canvas.getContext('2d');

  // Arrière-plan
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

  // Fond de la barre du thermomètre
  ctx.fillStyle = '#e0e0e0';
  ctx.beginPath();
  ctx.roundRect(50, 115, 500, 36, 18);
  ctx.fill();

  // Remplissage dynamique du thermomètre
  if (pourcentage > 0) {
    const largeurRemplissage = Math.max((500 * pourcentage) / 100, 36);
    ctx.fillStyle = couleurTheme;
    ctx.beginPath();
    ctx.roundRect(50, 115, largeurRemplissage, 36, 18);
    ctx.fill();
  }

  // Pourcentage inscrit
  ctx.fillStyle = pourcentage > 15 ? '#ffffff' : '#333333';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(pourcentage)} %`, 530, 139);

  // Note de bas de carte
  ctx.fillStyle = '#777777';
  ctx.font = 'italic 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Mise à jour automatique en temps réel', 300, 190);

  // En-têtes anti-cache obligatoires
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const buffer = canvas.toBuffer('image/png');
  res.send(buffer);
});

app.listen(PORT, () => console.log(`Serveur prêt sur le port ${PORT}`));
