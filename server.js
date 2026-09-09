const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/thermometre.png', async (req, res) => {
  try {
    // Test direct sur l'API de Rafflebox avec plusieurs formats d'URLs possibles
    const urlsToTest = [
      'https://api.rafflebox.ca/raffles/fa-ll',
      'https://api.rafflebox.ca/raffle/fa-ll',
      'https://rafflebox.ca/api/raffles/fa-ll'
    ];

    let resultats = {};

    for (let url of urlsToTest) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        });
        resultats[url] = {
          status: response.status,
          data: response.ok ? await response.json() : await response.text()
        };
      } catch (err) {
        resultats[url] = { error: err.message };
      }
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(resultats, null, 2));
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Serveur de test prêt sur le port ${PORT}`));
