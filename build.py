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
      '<meta name="theme-color" content="#1b1029">\n<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" href="icon.svg" type="image/svg+xml">\n</head>\n<body>\n'+page+'\n</body>\n</html>\n')
(root/'index.html').write_text(full)
print('built',len(page)//1024,'KB')
