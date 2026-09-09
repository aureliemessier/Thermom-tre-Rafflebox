const express = require('express');
const puppeteer = require('puppeteer');
const { createCanvas } = require('canvas');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/thermometre.png', async (req, res) => {
  let montantActuel = 0;
  const objectif = 3000;
  const couleurTheme = '#c21e56';

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process'
      ]
    });
    
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigation vers Rafflebox
    await page.goto('https://rafflebox.ca/fr/raffle/fa-ll/', { 
      waitUntil: 'networkidle0',
      timeout: 45000 
    });

    // Attendre explicitement que l'élément avec la classe de montant soit chargé
    await page.waitForSelector('.text-charcoal-black-500', { timeout: 10000 }).catch(() => {});

    // Extraction précise du montant
    const texteMontant = await page.evaluate(() => {
      // 1. Cibler la classe exacte fournie
      const el = document.querySelector('.text-charcoal-black-500');
      if (el && el.innerText) return el.innerText;

      // 2. Repli de sécurité si la classe principale varie légèrement
      const fallback = document.querySelector('.text-7xl');
      return fallback ? fallback.innerText : '';
    });

    // Extraction du chiffre (ex: "815 $" -> 815)
    const match = texteMontant.match(/([0-9\s,]+)/);
    if (match) {
      const chiffrePropre = match[1].replace(/\s/g, '').replace(',', '.');
      const val = parseFloat(chiffrePropre);
      if (!isNaN(val)) {
        montantActuel = val;
      }
    }
    
    await browser.close();
  } catch (error) {
    console.error("Erreur de lecture Rafflebox:", error);
  }

  const pourcentage = Math.min(Math.max((montantActuel / objectif) * 100, 0), 100);

  // Dessin du visuel PNG (600x220 px)
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

  // Montant
  ctx.fillStyle = couleurTheme;
  ctx.font = 'bold 34px Arial';
  ctx.fillText(`${montantActuel.toLocaleString('fr-CA')} $ Amassés`, 300, 90);

  // Thermomètre (Fond)
  ctx.fillStyle = '#e0e0e0';
  ctx.beginPath();
  ctx.roundRect(50, 115, 500, 36, 18);
  ctx.fill();

  // Thermomètre (Remplissage)
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

  // En-têtes Anti-Cache
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const buffer = canvas.toBuffer('image/png');
  res.send(buffer);
});

app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
