# My Workspace – gemeinsamer Netlify-Stand

Diese Version speichert den Workspace zentral über **Netlify Functions + Netlify Blobs**. Du brauchst keinen eigenen Server und keine Datenbank-Verwaltung.

## Deployment

1. Den Ordner als GitHub-Repository hochladen.
2. Das Repository in Netlify importieren.
3. Als Build Command nichts eintragen.
4. Publish directory: `.`
5. Deploy starten.

Die Function liegt in `netlify/functions/data.mjs`. Netlify erkennt sie über `netlify.toml` automatisch.

## Verhalten

- Alle Geräte greifen auf denselben Datenstand zu.
- Aufgaben, Projekte, Notizen und Chat werden zentral gespeichert.
- Die Oberfläche synchronisiert ungefähr alle 5 Sekunden neu.
- Es gibt absichtlich **keine Anmeldung und keine Zugriffskontrolle**.
- Jeder, der die URL kennt, kann die Daten verändern.
- `localStorage` bleibt nur als Fallback für lokale Tests erhalten.

## Wichtig

Die Daten sind damit absichtlich nicht geschützt. Für echte vertrauliche Inhalte sollte später Authentifizierung und Berechtigung ergänzt werden.
