"""Builds the single-file app from src/: artifact.html (page content only, for the claude.ai preview)
and index.html (a complete document for any static host such as Vercel)."""
import pathlib
root=pathlib.Path(__file__).parent;src=root/'src'
shell=(src/'shell.html').read_text()
page=(shell.replace('/*STYLE*/',(src/'styles.css').read_text())
          .replace('/*ENGINE*/',(src/'data.js').read_text()+'\n'+(src/'engine.js').read_text())
          .replace('/*APP*/',(src/'app.js').read_text()))
(root/'dist').mkdir(exist_ok=True)
(root/'dist'/'artifact.html').write_text(page)
full=('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
      '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
      '<meta name="description" content="Build Clash Royale decks and 2v2 team pairs from the cards you actually own.">\n'
      '<meta name="theme-color" content="#0c1728">\n<meta property="og:title" content="Elixir Forge">\n<meta property="og:description" content="Clash Royale decks and 2v2 teams built from the cards, Evos and Heroes you actually own. Enter a player tag to start.">\n<meta property="og:type" content="website">\n<meta name="twitter:card" content="summary">\n<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" href="icon.svg" type="image/svg+xml">\n</head>\n<body>\n'+page+'\n</body>\n</html>\n')
(root/'index.html').write_text(full)
print('built',len(page)//1024,'KB')

# Compact copy of the card table for api/audit.js, which compares it with Supercell's live card list.
import json,re
rows=[l.split('|') for l in re.search(r"const RAW=`(.*?)`",(src/'data.js').read_text(),re.S).group(1).strip().split('\n')]
ids=dict(re.findall(r"'([a-z0-9-]+)':(\d+)",re.search(r"CARD_IDS=\{(.*?)\}",(src/'data.js').read_text(),re.S).group(1)))
(root/'api'/'_table.json').write_text(json.dumps([{'k':r[0],'name':r[1],'e':int(r[2]),'evo':int(r[6])>0 or int(r[9])>0,'hero':('C' not in r[4]) and (int(r[7])>0 or int(r[10])>0),'id':int(ids.get(r[0],0)),'p':int(r[5]),'ev':int(r[6]),'he':int(r[7])} for r in rows]))
