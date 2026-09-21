# My Workspace 2.0 – Mobile Redesign

- komplett neues, dunkles/helles modernes UI
- Handy-Navigation per Hamburger-Menü
- Zurück-Button + Browser-History
- alle Bereiche auch mobil erreichbar
- responsive Dashboard, Projekte, Notizen und Chat
- Desktop Drag & Drop
- echter Touch-Drag & Drop auf Smartphones: Aufgabe gedrückt halten, ziehen, loslassen
- gemeinsamer Datenbestand über Netlify Blobs
- keine externe Datenbank und kein eigener Server

## Deployment
Repository in Netlify importieren, Build Command leer lassen und Publish Directory `.` setzen. `netlify.toml` richtet die Function automatisch ein.

## Hinweis
Die Version hat weiterhin absichtlich keine Authentifizierung. Jeder mit der URL kann Daten sehen und verändern.
