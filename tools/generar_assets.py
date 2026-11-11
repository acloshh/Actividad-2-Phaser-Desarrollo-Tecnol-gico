"""
Genera los assets que no vienen en el template:
  - Sonidos .wav (sintetizados) para Propuesta 1 y Propuesta 2.
  - Tileset .png y mapas de mosaicos en formato Tiled JSON (Propuesta 2).

Los mapas se pueden abrir y editar con Tiled (https://www.mapeditor.org/).

Uso (desde la carpeta Modulo1_Framework):
    python tools/generar_assets.py
"""

import json
import math
import os
import random
import struct
import wave
import zlib
from collections import deque

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P1 = os.path.join(RAIZ, "Propuesta1", "public", "assets")
P2 = os.path.join(RAIZ, "Propuesta2", "public", "assets")

# ---------------------------------------------------------------------------
# SONIDOS
# ---------------------------------------------------------------------------
RATE = 22050


def onda(tipo, fase):
    if tipo == "seno":
        return math.sin(2 * math.pi * fase)
    if tipo == "cuadrada":
        return 1.0 if (fase % 1.0) < 0.5 else -1.0
    if tipo == "triangular":
        f = fase % 1.0
        return 4 * f - 1 if f < 0.5 else 3 - 4 * f
    if tipo == "ruido":
        return random.uniform(-1, 1)
    raise ValueError(tipo)


def tono(f_ini, f_fin, dur, tipo="cuadrada", vol=0.4):
    """Tono con barrido de frecuencia y envolvente ataque/decaimiento."""
    n = int(RATE * dur)
    out, fase = [], 0.0
    for i in range(n):
        t = i / n
        f = f_ini + (f_fin - f_ini) * t
        fase += f / RATE
        env = min(1.0, i / (RATE * 0.005)) * (1 - t) ** 1.5
        out.append(onda(tipo, fase) * env * vol)
    return out


def silencio(dur):
    return [0.0] * int(RATE * dur)


def melodia(notas, dur, tipo="cuadrada", vol=0.35):
    out = []
    for f in notas:
        out += tono(f, f, dur, tipo, vol)
    return out


def guardar_wav(ruta, muestras):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with wave.open(ruta, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(
            b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32767)) for s in muestras)
        )


def generar_sonidos():
    random.seed(1)
    C5, E5, G5, C6 = 523, 659, 784, 1047
    comunes = {
        "recoger": tono(660, 1320, 0.12, "cuadrada", 0.3),
        "ganar": melodia([C5, E5, G5, C6, G5, C6], 0.12, "cuadrada", 0.3),
        "perder": melodia([392, 330, 262, 196], 0.2, "triangular", 0.5),
    }
    p1 = {
        **comunes,
        "malo": tono(220, 60, 0.3, "cuadrada", 0.35),
        "rebote": tono(180, 120, 0.05, "triangular", 0.35),
        "salto": tono(300, 650, 0.14, "cuadrada", 0.2),
        "desaparece": tono(900, 300, 0.1, "seno", 0.3),
    }
    p2 = {
        **comunes,
        "bloqueado": tono(150, 150, 0.1, "cuadrada", 0.3) + silencio(0.05) + tono(150, 110, 0.15, "cuadrada", 0.3),
        "nivel": melodia([G5, C6, E5 * 2, G5 * 2], 0.1, "cuadrada", 0.3),
        "golpe": tono(400, 40, 0.35, "ruido", 0.5),
    }
    for nombre, m in p1.items():
        guardar_wav(os.path.join(P1, "sounds", f"{nombre}.wav"), m)
    for nombre, m in p2.items():
        guardar_wav(os.path.join(P2, "sounds", f"{nombre}.wav"), m)
    print(f"Sonidos: {len(p1)} en Propuesta1, {len(p2)} en Propuesta2")


# ---------------------------------------------------------------------------
# TILESET (PNG sin dependencias externas)
# ---------------------------------------------------------------------------
T = 32  # tamaño de mosaico


def guardar_png(ruta, ancho, alto, pixeles):
    """pixeles: lista de filas, cada fila lista de (r,g,b,a)."""
    crudo = b"".join(b"\x00" + b"".join(bytes(p) for p in fila) for fila in pixeles)

    def chunk(tipo, datos):
        c = tipo + datos
        return struct.pack(">I", len(datos)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", ancho, alto, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(crudo, 9))
    png += chunk(b"IEND", b"")
    with open(ruta, "wb") as f:
        f.write(png)


def tile_piso(x, y, variante):
    base = (34, 38, 58) if not variante else (40, 44, 66)
    if x == 0 or y == 0:
        return (base[0] + 10, base[1] + 10, base[2] + 14, 255)
    if variante and (x - y) % 11 == 0:
        return (base[0] + 14, base[1] + 14, base[2] + 18, 255)
    return (*base, 255)


def tile_pared(x, y, variante):
    ladrillo = (110, 70, 160) if not variante else (95, 60, 140)
    junta = (50, 30, 80)
    fila = y // 8
    desfase = 8 if fila % 2 else 0
    if y % 8 == 0 or (x + desfase) % 16 == 0:
        return (*junta, 255)
    brillo = 18 if (y % 8 == 1) else 0
    return (ladrillo[0] + brillo, ladrillo[1] + brillo, ladrillo[2] + brillo, 255)


# índice local del tile -> (función, variante, colisiona)
TILES = [
    (tile_piso, False, False),   # gid 1
    (tile_pared, False, True),   # gid 2
    (tile_piso, True, False),    # gid 3
    (tile_pared, True, True),    # gid 4
]
GID_PISO, GID_PARED, GID_PISO2, GID_PARED2 = 1, 2, 3, 4


def generar_tileset():
    ancho = T * len(TILES)
    filas = []
    for y in range(T):
        fila = []
        for i, (fn, var, _) in enumerate(TILES):
            for x in range(T):
                fila.append(fn(x, y, var))
        filas.append(fila)
    guardar_png(os.path.join(P2, "tilemaps", "tileset.png"), ancho, T, filas)


# ---------------------------------------------------------------------------
# LABERINTOS -> Tiled JSON
# ---------------------------------------------------------------------------
# Cada "celda" del laberinto ocupa 2x2 mosaicos de piso y las paredes 1 mosaico
# (paso de 3). Así los pasillos son de 64px y el movimiento es cómodo.


def generar_laberinto(cols, filas, semilla, apertura=0.12):
    rnd = random.Random(semilla)
    W, H = 3 * cols + 1, 3 * filas + 1
    grilla = [[1] * W for _ in range(H)]  # 1 = pared

    def abrir_celda(cx, cy):
        for dy in (1, 2):
            for dx in (1, 2):
                grilla[3 * cy + dy][3 * cx + dx] = 0

    def abrir_entre(a, b):
        (ax, ay), (bx, by) = a, b
        if ax != bx:  # horizontal: abrir columna de pared entre ambas
            x = 3 * max(ax, bx)
            for dy in (1, 2):
                grilla[3 * ay + dy][x] = 0
        else:
            y = 3 * max(ay, by)
            for dx in (1, 2):
                grilla[y][3 * ax + dx] = 0

    vecinos = {}
    visit = {(0, 0)}
    pila = [(0, 0)]
    abrir_celda(0, 0)
    conex = {(x, y): set() for x in range(cols) for y in range(filas)}
    while pila:
        cx, cy = pila[-1]
        opciones = [
            (cx + dx, cy + dy)
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            if 0 <= cx + dx < cols and 0 <= cy + dy < filas and (cx + dx, cy + dy) not in visit
        ]
        if not opciones:
            pila.pop()
            continue
        nx, ny = rnd.choice(opciones)
        abrir_celda(nx, ny)
        abrir_entre((cx, cy), (nx, ny))
        conex[(cx, cy)].add((nx, ny))
        conex[(nx, ny)].add((cx, cy))
        visit.add((nx, ny))
        pila.append((nx, ny))

    # Abrir algunas paredes extra para crear ciclos (más caminos para esquivar enemigos)
    for (cx, cy) in list(conex):
        for nx, ny in ((cx + 1, cy), (cx, cy + 1)):
            if (nx, ny) in conex and (nx, ny) not in conex[(cx, cy)] and rnd.random() < apertura:
                abrir_entre((cx, cy), (nx, ny))
                conex[(cx, cy)].add((nx, ny))
                conex[(nx, ny)].add((cx, cy))

    return grilla, conex, rnd


def distancias(conex, origen):
    dist = {origen: 0}
    q = deque([origen])
    while q:
        c = q.popleft()
        for v in conex[c]:
            if v not in dist:
                dist[v] = dist[c] + 1
                q.append(v)
    return dist


def tramo_recto(conex, celda, dx, dy):
    """Cantidad de celdas en línea recta conectadas pasando por 'celda'."""
    n = 1
    for s in (1, -1):
        c = celda
        while True:
            sig = (c[0] + dx * s, c[1] + dy * s)
            if sig in conex[c]:
                n += 1
                c = sig
            else:
                break
    return n


def crear_nivel(nombre, cols, filas, semilla, n_items, n_enemigos, off_y=0, filas_extra=0):
    grilla, conex, rnd = generar_laberinto(cols, filas, semilla)
    W = len(grilla[0])
    H = len(grilla) + off_y + filas_extra

    inicio = (0, 0)
    dist = distancias(conex, inicio)
    salida = max(dist, key=dist.get)

    # Ítems: preferentemente en callejones sin salida, si no en celdas lejanas al inicio
    candidatos = [c for c in conex if c not in (inicio, salida)]
    callejones = [c for c in candidatos if len(conex[c]) == 1]
    rnd.shuffle(callejones)
    resto = [c for c in candidatos if c not in callejones and dist[c] > 2]
    rnd.shuffle(resto)
    items = (callejones + resto)[:n_items]

    # Enemigos: en pasillos rectos largos, lejos del inicio y sin pisar ítems/salida
    ocupadas = set(items) | {inicio, salida}
    posibles = []
    for c in conex:
        if c in ocupadas or dist[c] < 4:
            continue
        h = tramo_recto(conex, c, 1, 0)
        v = tramo_recto(conex, c, 0, 1)
        if max(h, v) >= 4:
            posibles.append(c)
    rnd.shuffle(posibles)
    enemigos = []
    for c in posibles:
        if len(enemigos) >= n_enemigos:
            break
        if all(abs(c[0] - e[0]) + abs(c[1] - e[1]) > 4 for e in enemigos):
            enemigos.append(c)

    # Capas de mosaicos
    suelo, paredes = [], []
    for y in range(H):
        gy = y - off_y
        for x in range(W):
            es_pared = not (0 <= gy < len(grilla)) or grilla[gy][x] == 1
            suelo.append(GID_PISO2 if rnd.random() < 0.08 else GID_PISO)
            if es_pared:
                paredes.append(GID_PARED2 if rnd.random() < 0.12 else GID_PARED)
            else:
                paredes.append(0)

    def centro(celda):
        cx, cy = celda
        return (3 * cx + 2) * T, (3 * cy + 2 + off_y) * T

    objetos, oid = [], 1

    def agregar(nombre_obj, tipo, celda):
        nonlocal oid
        x, y = centro(celda)
        objetos.append({
            "id": oid, "name": nombre_obj, "type": tipo, "point": True,
            "x": x, "y": y, "width": 0, "height": 0, "rotation": 0, "visible": True,
        })
        oid += 1

    agregar("jugador", "jugador", inicio)
    agregar("salida", "salida", salida)
    for c in items:
        agregar("item", "item", c)
    for c in enemigos:
        agregar("enemigo", "enemigo", c)

    mapa = {
        "compressionlevel": -1, "infinite": False, "orientation": "orthogonal",
        "renderorder": "right-down", "tiledversion": "1.10.2", "type": "map", "version": "1.10",
        "width": W, "height": H, "tilewidth": T, "tileheight": T,
        "nextlayerid": 4, "nextobjectid": oid,
        "layers": [
            {"id": 1, "name": "suelo", "type": "tilelayer", "data": suelo, "width": W, "height": H,
             "opacity": 1, "visible": True, "x": 0, "y": 0},
            {"id": 2, "name": "paredes", "type": "tilelayer", "data": paredes, "width": W, "height": H,
             "opacity": 1, "visible": True, "x": 0, "y": 0},
            {"id": 3, "name": "objetos", "type": "objectgroup", "draworder": "topdown",
             "objects": objetos, "opacity": 1, "visible": True, "x": 0, "y": 0},
        ],
        "tilesets": [{
            "firstgid": 1, "name": "tileset", "image": "tileset.png",
            "imagewidth": T * len(TILES), "imageheight": T, "tilewidth": T, "tileheight": T,
            "columns": len(TILES), "tilecount": len(TILES), "margin": 0, "spacing": 0,
            "tiles": [
                {"id": i, "properties": [{"name": "colisiona", "type": "bool", "value": col}]}
                for i, (_, _, col) in enumerate(TILES)
            ],
        }],
    }
    with open(os.path.join(P2, "tilemaps", f"{nombre}.json"), "w", encoding="utf-8") as f:
        json.dump(mapa, f)
    print(f"{nombre}: {W}x{H} mosaicos ({W*T}x{H*T}px), {len(items)} ítems, {len(enemigos)} enemigos")


if __name__ == "__main__":
    generar_sonidos()
    generar_tileset()
    # Nivel 1 y 2: entran en pantalla (800x576). Fila superior libre para el HUD.
    crear_nivel("nivel1", cols=8, filas=5, semilla=7, n_items=7, n_enemigos=0, off_y=1, filas_extra=1)
    crear_nivel("nivel2", cols=8, filas=5, semilla=21, n_items=8, n_enemigos=2, off_y=1, filas_extra=1)
    # Nivel 3: más grande que el monitor -> la cámara sigue al jugador.
    crear_nivel("nivel3", cols=20, filas=13, semilla=99, n_items=14, n_enemigos=8)
