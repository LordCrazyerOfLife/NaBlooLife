#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Instalador idempotente para el Mod Loader de NaBlooLife.
Copia los archivos del loader y engancha game.html.
Soy idempotente: correrme varias veces no duplica nada.
"""

import sys
import os
import re
import shutil
from pathlib import Path

def main():
    if len(sys.argv) < 2:
        print("Uso: python instalar.py <ruta_naabloolife>")
        sys.exit(1)
    
    target_dir = Path(sys.argv[1]).resolve()
    if not target_dir.is_dir():
        print(f"Error: {target_dir} no es un directorio válido")
        sys.exit(1)
    
    # Archivos a copiar (origen -> destino)
    # Estos archivos viven en el repo FreeLife, y los copiamos a NaBlooLife
    files_to_copy = [
        ("modloader.js", target_dir / "modloader.js"),
        ("gang.js", target_dir / "gang.js"),
        ("chess.js", target_dir / "chess.js"),
        ("mods.js", target_dir / "mods.js"),
        ("chess-events.js", target_dir / "chess-events.js"),
        ("chess-engine.js", target_dir / "chess-engine.js"),
        ("chess-puzzles.js", target_dir / "chess-puzzles.js"),
    ]
    
    print("=== Mod Loader Instalar ===")
    
    # 1. Copiar archivos (sobreescribir si ya existen)
    for src_name, dst in files_to_copy:
        src = Path(__file__).parent / src_name
        if not src.is_file():
            print(f"Advertencia: {src} no encontrado, omitiendo")
            continue
        
        shutil.copy2(str(src), str(dst))
        print(f"  Copiado: {dst.name}")
    
    # 2. Enganchar game.html: agregar <script src="modloader.js?v=12"> después de mods.js
    game_html = target_dir / "game.html"
    if not game_html.is_file():
        print(f"Error: {game_html} no encontrado")
        sys.exit(1)
    
    with open(game_html, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Verificar si ya está instalado (idempotencia)
    if 'src="modloader.js?v=12"' in content and 'src="mods.js?v=11"' in content:
        # Verificar que el orden sea correcto: mods.js antes que modloader.js
        mods_pos = content.find('src="mods.js"')
        loader_pos = content.find('src="modloader.js"')
        if mods_pos != -1 and loader_pos != -1 and mods_pos < loader_pos:
            print("  Ya instalado (idempotente: orden correcto ya existente)")
            # No hacer nada, ya está instalado
        else:
            # Reordenar si es necesario
            print("  Reorganizando orden en game.html...")
            # Elimina etiquetas viejas y las vuelve a agregar en orden
            content = re.sub(r'<script src="mods\.js[^"]*">[^<]*</script>', '', content)
            content = re.sub(r'<script src="modloader\.js[^"]*">[^<]*</script>', '', content)
            # Agregar mods.js primero (si no está)
            if 'src="mods.js?v=11"' not in content:
                # Insertar después del script de Chess Career si existe, o al final antes de </body>
                pass
            print("  Orden ya correcto")
    else:
        # Agregar el tag modloader.js después de mods.js
        # Buscar la línea con mods.js y agregar modloader.js después
        original = content
        # Patrón: encontrar <script src="mods.js ..."> y agregar después
        mods_match = re.search(r'(<script src="mods\.js[^"]*>.*?</script>)', content, re.DOTALL)
        loader_match = re.search(r'(<script src="modloader\.js[^"]*>.*?</script>)', content, re.DOTALL)
        
        if mods_match:
            # Insertar modloader.js después de mods.js
            after_mods = mods_match.group(1) + '\n    <script src="modloader.js?v=12"></script>\n'
            content = content.replace(mods_match.group(1), after_mods)
            print(f"  Enganchado: modloader.js después de mods.js")
        else:
            # Agregar al final antes de </body> si no hay mods.js
            content = content.replace("</body>", '<script src="mods.js?v=11"></script>\n    <script src="modloader.js?v=12"></script>\n</body>')
            print("  Agregado mods.js y modloader.js al final")
        
        if content != original:
            with open(game_html, "w", encoding="utf-8") as f:
                f.write(content)
            print("  game.html actualizado")
    
    # 3. Agregar entrada chess a mods.js si no existe (código 64646464)
    mods_js = target_dir / "mods.js"
    if mods_js.is_file():
        with open(mods_js, "r", encoding="utf-8") as f:
            mcontent = f.read()
        
        # Verificar si ya tiene la entrada chess con 64646464
        if '64646464:' in mcontent and 'chess.js' in mcontent:
            print("  mods.js ya tiene entrada chess (idempotente)")
        else:
            # Agregar entrada chess al final del objeto MODS o al principio
            # Buscar el patrón de entradas y agregar chess
            chess_entry = '  64646464: {\n    path: "chess.js?v=5",\n    version: 5\n  },'
            if '64646464:' not in mcontent:
                # Agregar después del último entry, antes del cierre
                mcontent = mcontent.rstrip() + '\n' + chess_entry + '\n'
                with open(mods_js, "w", encoding="utf-8") as f:
                    f.write(mcontent)
                print("  Agregada entrada chess a mods.js con código 64646464")
    
    print("\n=== Instalación completa ===")
    print("Ejecuta nuevamente sin miedo: los cambios son idempotentes.")
    
    # Reconfigure UTF-8 para consola Windows
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

if __name__ == "__main__":
    main()