# Elixir Forge

Clash Royale deck builder for 1v1 and 2v2 that builds from each player's **real collection**: the cards, Evolutions, Heroes, tower troops and card levels they actually own.

- Load a collection from a **player tag** (needs the small server function, set up below), or set it up by tapping cards, or paste a teammate's **share code**.
- 2v2 team building: cross-deck combos, covering each other's weaknesses, Attacker/Defender roles, up to 2 shared cards.
- Every deck fills the Evo, Hero and Wild slots with forms the player owns; card levels can be matched.
- **Open in Clash Royale** links copy a deck straight into the game, tower troop included.
- Build against an opponent's deck, save decks and log wins and losses.
- **Check a deck**: score any 8 cards (or a loaded player's current deck) and get the best single swaps.
- **Player decks**: the decks any player used in their most recent battles (`api/battles.js`). To feature a creator, put their player tag in `CREATORS` in `src/data.js` and rebuild; the tab is then named after them.
- **Edit a deck or team**: press Edit on any forged deck or pair, swap cards and watch the score change.
- **Unlock next**: which missing Evo or Hero would lift a player's best deck the most.
- **Send to teammate** and links like `?a=TAG&b=TAG` that open the site with both players loaded.
- Ratings refresh weekly from Supercell's official API (GitHub Action) once you add a key.

## Files

| Path | What it is |
|---|---|
| `index.html` | The whole app in one file (built from `src/`). Works on any static host. |
| `src/` | Source: `data.js` (cards, ratings, synergies), `engine.js` (deck search), `app.js` (interface), `styles.css`, `shell.html` |
| `api/player.js`, `api/health.js`, `api/cards.js`, `api/battles.js` | Serverless functions: player tag lookup, and the official card list with picture links (Vercel format) |
| `scripts/refresh-meta.mjs` | Builds `data/meta.json` from top players' battles |
| `.github/workflows/refresh-meta.yml` | Runs the refresh every Monday |
| `test/` | Offline tests (`npm test`) |
| `build.py` | Rebuilds `index.html` after you edit anything in `src/` |

## Set up player tag lookup (about 15 minutes, free)

The official API needs a secret key, and a key only works from fixed IP addresses. Free hosts like Vercel change IPs, so requests go through RoyaleAPI's public proxy, whose IP is fixed.

1. **Get an API key.** Sign in at <https://developer.clashroyale.com>, open *My Account*, create a key and enter **45.79.218.79** as the allowed IP address. Copy the key.
2. **Put the code on GitHub.** Create a new repository and upload everything in this folder (keep the folder structure).
3. **Deploy on Vercel.** At <https://vercel.com>, choose *Add New → Project*, import the repository, leave the framework as *Other*, and under *Environment Variables* add `CR_API_KEY` with your key. Deploy.
4. **Check it.** Open `https://<your-project>.vercel.app/api/health`. It should say `{"ok":true}`. Then open the app and load a player tag.
5. **Turn on weekly data refresh.** In the GitHub repository go to *Settings → Secrets and variables → Actions* and add a secret named `CR_API_KEY` with the same key. Then open the *Actions* tab, choose *Refresh meta data* and press *Run workflow* once. After that it runs every Monday, and Vercel redeploys automatically when `data/meta.json` changes. Run it by hand after big balance patches.

Netlify or Cloudflare work too; only the two files in `api/` need adapting to their function format.

## Before a public launch

- **Starting profiles.** `PRESET_PLAYERS` in `src/data.js` is empty, so each visitor starts with a blank profile and a prompt to load their player tag. Add entries there only for a private copy.
- **Supercell Fan Content Policy** (<https://supercell.com/en/fan-content-policy/>): the app must stay free. No paywalls, subscriptions or in-app purchases; ads and voluntary donations are allowed. Don't use "Clash Royale" in your domain or social handles. Keep the disclaimer that is already in the footer.
- **Card art:** on a deployed copy the app shows the official card pictures, linked from Supercell's API (`api/cards.js`), which the Fan Content Policy allows unmodified. Without the server it falls back to lettered tiles.
- **Privacy:** the app stores collections only in the visitor's browser. Tag lookups send the tag to your server and Supercell's API. If you ever add accounts or emails, publish a privacy policy and handle younger players properly (PIPEDA in Canada, COPPA for US users).
- **RoyaleAPI data:** the ratings bundled in `src/data.js` were read from RoyaleAPI's public pages on Sept 30, 2026. Once the weekly refresh runs, the app uses your own data from Supercell's API instead. Ask RoyaleAPI (<https://royaleapi.com/business-inquiries>) before using their data commercially.

## Keeping it current

- New card: add a row to `RAW` in `src/data.js` (id, name, elixir, type, role tags, ratings), its official ID to `CARD_IDS`, then `python3 build.py`. The comment at the top of `RAW` explains the role letters.
- New combos: add lines to `SYN_RAW` (`card-a,card-b,weight 1-3,why it works`).
- Run `npm test` after changes.

## Staying in step with the game

On load the app reads Supercell's card list (`api/cards.js`). It takes card and tower troop IDs from it, and switches on any Evo or Hero the game has that the card table doesn't yet, with an estimated rating that the weekly refresh replaces with measured numbers.

`/api/audit` lists any difference between the card table and the live game (empty arrays mean they match), and `/api/audit?tag=TAG` checks a real account's Evo and Hero flags against the table. Run both after a big update.

## Known limits

- The official API can't show which form a card is equipped in, only what a player owns. The refresh script infers Evo/Hero use from deck slot order (slot 1 Evo, slot 2 Hero/Champion, slot 3 Wild), and skips decks where the API drops a Hero in the Champion slot.
- Tower Princess's game ID is verified; the IDs used for Cannoneer, Dagger Duchess and Royal Chef in deck links are best known, and are replaced by real IDs from a player's tag lookup.
- Team synergy scoring comes from strategy research, not measured 2v2 pair win rates (no public source has those yet). The saved-deck win/loss tracker is the start of measuring it.
