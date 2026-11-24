# DUO-webapp

Lichte, onafhankelijke simulator voor studieschuld. De eerste bouwstap bevat de rekenmodule en rekentests. Er is nog geen website of Cloudflare-deployment.

## Ontwikkelen

Installeer Node.js 24 LTS. Voer `npm test` uit om de rekenmodule te controleren. Deze eerste stap gebruikt de ingebouwde testrunner van Node.js en heeft geen externe pakketten nodig. Vite en de gebruikersinterface volgen bij de websitebouw.

## Rekenmodel

`src/simulation.ts` rekent per kalendermaand. Invoer: startmaand (`JJJJ-MM`), beginschuld inclusief eerdere rente, jaarlijks rentepercentage, duur in maanden, optioneel maandelijks bijlenen met laatste leenmaand, maandelijkse betaling met eerste betaalmaand en één rentewijziging met ingangsmaand.

Maandfactor: `(1 + jaarrente / 100)^(1/12) - 1`. Eerst rente over de beginschuld, dan bijlenen, dan betalen aan het einde van de maand. Nieuwe leningen dragen vanaf de volgende maand rente. Betalingen worden beperkt tot de openstaande schuld. Geen tussentijdse afronding; de interface zal bedragen op centen tonen.

De rente blijft gelijk tenzij een expliciete wijziging wordt opgegeven. De gebruiker kiest de ingangsmaand passend bij de eigen rentevaste periode. Toekomstige rente is een aanname. De simulatie ondersteunt 1–1200 maanden en niet-negatieve invoer.

Uitvoer: maandregels, eindschuld, totaal bijgeleend, totaal opgebouwde rente vanaf de simulatiestart, totaal betaald en eventueel de afbetaalmaand. Opgebouwde rente is niet hetzelfde als betaalde rente. Een afbetaalmaand wordt alleen gemeld wanneer daarna geen nieuwe leningen gepland zijn.

Dit model berekent geen verplicht DUO-maandbedrag, draagkracht, kwijtschelding of prestatiebeursomzetting. IKB en werkgeversregelingen vallen buiten de rekenkern en kunnen later bij tips worden opgenomen.

Bron voor de renteformule: https://duo.nl/particulier/rente/rente-voor-studenten.jsp

## Hosting (volgende stap)

Geplande opzet: statische website op Cloudflare Pages, gekoppeld aan deze GitHub-repository. Berekeningen blijven in de browser. Geen database of serverfuncties nodig. Na toevoeging van Vite wordt de verwachte bouwopdracht `npm run build` en de uitvoermap `dist`; deze opdracht bestaat nu nog niet.
