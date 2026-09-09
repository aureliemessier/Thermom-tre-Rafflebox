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

    // Simuler un navigateur complet pour éviter le blocage
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigation vers Rafflebox
    await page.goto('https://rafflebox.ca/fr/raffle/fa-ll/', { 
      waitUntil: 'networkidle0',
      timeout: 45000 
    });

    // Attendre 3 secondes supplémentaires pour s'assurer que le script React/Vue a rendu le montant
    await page.waitForTimeout(3000);

    // Extraction du montant par recherche ciblée dans le texte de la page
    const texteExtrait = await page.evaluate(() => {
      // 1. Chercher d'abord dans les éléments spécifiques Rafflebox
      const elementsPrio = document.querySelectorAll('[class*="jackpot"], [class*="amount"], [class*="prize"], h1, h2, h3, span, div');
      for (let el of elementsPrio) {
        const txt = el.innerText || '';
        if (txt.includes('$') && (txt.toLowerCase().includes('gros lot') || txt.toLowerCase().includes('jackpot') || txt.toLowerCase().includes('actuel') || txt.toLowerCase().includes('total'))) {
          return txt;
        }
      }
      // 2. Si non trouvé, retourner tout le texte du body
      return document.body ? document.body.innerText : '';
    });

    // Recherche de la structure du montant ($1 500, 1 500 $, $1,500, etc.)
    const regexMontant = /\$\s*([0-9\s,\.]+)|([0-9\s,\.]+)\s*\$/;
    const match = texteExtrait.match(regexMontant);

    if (match) {
      const brut = match[1] || match[2];
      // Nettoyage des espaces, virgules et séparateurs de milliers
      const chiffrePropre = brut.replace(/\s/g, '').replace(',', '.');
      const valeurNume = parseFloat(chiffrePropre);
      if (!isNaN(valeurNume) && valeurNume > 0) {
        montantActuel = valeurNume;
      }
    }
    
    await browser.close();
  } catch (error) {
    console.error("Erreur de lecture Rafflebox:", error);
  }

  const pourcentage = Math.min(Math.max((montantActuel / objectif) * 100, 0), 100);

  // Dessin de l'image PNG (600x220 px)
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

  // Thermomètre (fond)
  ctx.fillStyle = '#e0e0e0';
  ctx.beginPath();
  ctx.roundRect(50, 115, 500, 36, 18);
  ctx.fill();

  // Thermomètre (remplissage)
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

  // Anti-cache
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const buffer = canvas.toBuffer('image/png');
  res.send(buffer);
});

app.listen(PORT, () => console.log(`Serveur actif sur le port ${PORT}`));
