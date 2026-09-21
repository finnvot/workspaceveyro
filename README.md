# My Workspace – gemeinsame Netlify-Version

Diese Version nutzt Netlify Functions + Netlify Blobs als gemeinsamen Datenspeicher. Du brauchst keinen eigenen Server und keine externe Datenbankverwaltung.

## Deployment
1. Den Inhalt dieses Ordners in ein GitHub-Repository laden.
2. Repository in Netlify importieren.
3. Build command leer lassen.
4. Publish directory `.`.
5. Deploy starten.

Die Function ist `netlify/functions/workspace.mjs` und wird über `netlify.toml` erkannt.

## Test
- PC öffnen.
- Aufgabe erstellen/verschieben.
- Unten rechts muss `✓ Gespeichert` erscheinen.
- Handy öffnen oder aktualisieren.
- Änderung sollte erscheinen.
- Die Seite synchronisiert etwa alle 2 Sekunden.

## Wichtig
Aktuell absichtlich keine Sicherheit: jeder mit der URL kann lesen und ändern. Später können Authentifizierung und Berechtigungen ergänzt werden.
