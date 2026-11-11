import { NIVELES } from "./Preload.js";

const MIN_ITEMS = 5;          // condición para poder salir de cada nivel
const PUNTOS_POR_ITEM = 10;
const BONUS_NIVEL = 50;
const VEL_JUGADOR = 190;
const VEL_ENEMIGO = 110;

// Una sola escena reutilizable para los 3 niveles: cada nivel es un mapa distinto.
export default class Nivel extends Phaser.Scene {
  constructor() {
    super("nivel");
  }

  // Mejora 1: los datos (nivel, puntaje, vidas) se transportan entre escenas
  init(data) {
    this.indiceNivel = data.nivel ?? 0;
    this.puntaje = data.puntaje ?? 0;
    this.vidas = data.vidas ?? 3;
    this.recolectados = [];
    this.terminado = false;
    this.invulnerable = false;
    this.ultimoAviso = 0;
  }

  create() {
    // ---------------- Tilemap ----------------
    const mapa = this.make.tilemap({ key: NIVELES[this.indiceNivel] });
    const tileset = mapa.addTilesetImage("tileset", "tiles");
    mapa.createLayer("suelo", tileset);
    this.paredes = mapa.createLayer("paredes", tileset);
    // La propiedad "colisiona" está definida en el tileset (editable en Tiled)
    this.paredes.setCollisionByProperty({ colisiona: true });

    this.anchoMapa = mapa.widthInPixels;
    this.altoMapa = mapa.heightInPixels;
    this.physics.world.setBounds(0, 0, this.anchoMapa, this.altoMapa);

    // ---------------- Objetos del mapa ----------------
    const objetos = mapa.getObjectLayer("objetos").objects;
    const buscar = (nombre) => objetos.filter((o) => o.name === nombre);

    const inicio = buscar("jugador")[0];
    this.inicio = { x: inicio.x, y: inicio.y };
    this.jugador = this.physics.add.sprite(inicio.x, inicio.y, "jugador");
    this.jugador.setCircle(12, 2, 2);
    this.jugador.setCollideWorldBounds(true);
    this.jugador.setDepth(5);

    this.items = this.physics.add.staticGroup();
    buscar("item").forEach((o) => {
      const item = this.items.create(o.x, o.y, "item");
      this.tweens.add({ targets: item, scale: 1.25, duration: 500, yoyo: true, repeat: -1 });
    });
    this.totalItems = this.items.getLength();

    const s = buscar("salida")[0];
    this.salida = this.physics.add.staticImage(s.x, s.y, "salida");
    this.salida.setCircle(16, 8, 8);
    this.salida.setTint(0x777777).setAlpha(0.6); // cerrada hasta juntar los ítems
    this.tweens.add({ targets: this.salida, angle: 360, duration: 3000, repeat: -1 });

    // Mejora 3: enemigos con movimiento vertical u horizontal según su ubicación
    this.enemigos = this.physics.add.group({ bounceX: 1, bounceY: 1, collideWorldBounds: true });
    buscar("enemigo").forEach((o) => {
      const enemigo = this.enemigos.create(o.x, o.y, "enemigo");
      enemigo.setCircle(12, 3, 3);
      if (this.direccionEnemigo(o.x, o.y) === "horizontal") {
        enemigo.setVelocity(VEL_ENEMIGO * Phaser.Math.RND.sign(), 0);
      } else {
        enemigo.setVelocity(0, VEL_ENEMIGO * Phaser.Math.RND.sign());
      }
      this.tweens.add({ targets: enemigo, angle: 360, duration: 1200, repeat: -1 });
    });

    // ---------------- Colisiones ----------------
    this.physics.add.collider(this.jugador, this.paredes);
    this.physics.add.collider(this.enemigos, this.paredes);
    this.physics.add.overlap(this.jugador, this.items, this.recolectar, null, this);
    this.physics.add.overlap(this.jugador, this.salida, this.llegarASalida, null, this);
    this.physics.add.overlap(this.jugador, this.enemigos, this.tocarEnemigo, null, this);

    // ---------------- Entradas ----------------
    this.cursores = this.input.keyboard.createCursorKeys();
    this.teclas = this.input.keyboard.addKeys("W,A,S,D");

    this.particulas = this.add.particles(0, 0, "particula", {
      speed: { min: 50, max: 200 },
      scale: { start: 0.3, end: 0 },
      lifespan: 450,
      blendMode: "ADD",
      emitting: false,
    }).setDepth(6);

    // ---------------- Cámaras ----------------
    this.configurarCamaras();
    this.crearHUD();
    this.mostrarMensaje(`NIVEL ${this.indiceNivel + 1}`);
  }

  // Cuenta las celdas libres en cada eje: se mueve en el eje con el pasillo más largo
  direccionEnemigo(x, y) {
    const tx = this.paredes.worldToTileX(x);
    const ty = this.paredes.worldToTileY(y);
    const libre = (cx, cy) => {
      const t = this.paredes.getTileAt(cx, cy);
      return !t || !t.collides;
    };
    const contar = (dx, dy, ox, oy) => {
      let n = 0;
      let cx = ox, cy = oy;
      // se revisan las dos filas/columnas que ocupa el pasillo (2 mosaicos de ancho)
      while (libre(cx, cy) && (dx ? libre(cx, cy - 1) : libre(cx - 1, cy))) {
        n++;
        cx += dx;
        cy += dy;
      }
      return n;
    };
    const horizontal = contar(1, 0, tx, ty) + contar(-1, 0, tx - 1, ty);
    const vertical = contar(0, 1, tx, ty) + contar(0, -1, tx, ty - 1);
    return horizontal >= vertical ? "horizontal" : "vertical";
  }

  configurarCamaras() {
    const camara = this.cameras.main;
    // Mejora 2: si el mapa es más grande que el monitor, la cámara sigue al jugador
    camara.setBounds(0, 0, this.anchoMapa, this.altoMapa);
    camara.startFollow(this.jugador, true, 0.1, 0.1);
    camara.fadeIn(400);

    this.minimapa = null;
    const esGrande = this.anchoMapa > this.scale.width || this.altoMapa > this.scale.height;
    if (esGrande) {
      // Segunda cámara: minimapa con el laberinto completo
      const zoom = 0.09;
      const w = Math.round(this.anchoMapa * zoom);
      const h = Math.round(this.altoMapa * zoom);
      this.minimapa = this.cameras
        .add(this.scale.width - w - 10, 52, w, h)
        .setZoom(zoom)
        .setName("minimapa")
        .setBackgroundColor(0x000000);
      this.minimapa.setBounds(0, 0, this.anchoMapa, this.altoMapa);
      this.minimapa.centerOn(this.anchoMapa / 2, this.altoMapa / 2);
      this.minimapa.ignore(this.particulas);
      this.marcoMinimapa = this.add
        .rectangle(this.scale.width - w / 2 - 10, 52 + h / 2, w + 4, h + 4)
        .setStrokeStyle(2, 0xffffff)
        .setScrollFactor(0)
        .setDepth(20);
      this.minimapa.ignore(this.marcoMinimapa);
    }
  }

  crearHUD() {
    const estilo = { fontFamily: "Arial", fontSize: "18px", color: "#fff", stroke: "#000", strokeThickness: 4 };
    const fondo = this.add.rectangle(400, 20, 800, 40, 0x000000, 0.55);
    this.textoHUD = this.add.text(12, 9, "", estilo);
    this.textoMensaje = this.add
      .text(400, 300, "", {
        fontFamily: "Arial Black, Arial", fontSize: "40px", color: "#ffeb3b",
        stroke: "#000", strokeThickness: 6, align: "center",
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const hud = [fondo, this.textoHUD, this.textoMensaje];
    hud.forEach((o) => o.setScrollFactor(0).setDepth(20));
    if (this.minimapa) this.minimapa.ignore(hud);
    this.actualizarHUD();
  }

  actualizarHUD() {
    const listo = this.recolectados.length >= MIN_ITEMS;
    this.textoHUD.setText(
      `Nivel ${this.indiceNivel + 1}/${NIVELES.length}   ` +
        `Gemas: ${this.recolectados.length}/${this.totalItems} (mín. ${MIN_ITEMS})${listo ? " ✔" : ""}   ` +
        `Puntaje: ${this.puntaje}   Vidas: ${"♥".repeat(this.vidas)}`
    );
  }

  mostrarMensaje(texto, color = "#ffeb3b") {
    this.tweens.killTweensOf(this.textoMensaje);
    this.textoMensaje.setText(texto).setColor(color).setAlpha(1);
    this.tweens.add({ targets: this.textoMensaje, alpha: 0, delay: 900, duration: 500 });
  }

  // ---------------------------------------------------------------------------
  recolectar(jugador, item) {
    this.particulas.explode(12, item.x, item.y);
    item.destroy();
    this.recolectados.push({ nivel: this.indiceNivel + 1, x: item.x, y: item.y });
    this.puntaje += PUNTOS_POR_ITEM;
    this.sound.play("recoger", { volume: 0.6 });

    if (this.recolectados.length === MIN_ITEMS) {
      this.salida.clearTint().setAlpha(1);
      this.mostrarMensaje("¡Portal abierto!", "#00e676");
    }
    this.actualizarHUD();
  }

  // Condición para GANAR / pasar de nivel: llegar con al menos 5 elementos
  llegarASalida() {
    if (this.terminado) return;

    if (this.recolectados.length < MIN_ITEMS) {
      if (this.time.now - this.ultimoAviso > 1200) {
        this.ultimoAviso = this.time.now;
        const faltan = MIN_ITEMS - this.recolectados.length;
        this.mostrarMensaje(`Te faltan ${faltan} gema${faltan > 1 ? "s" : ""}`, "#ff5252");
        this.sound.play("bloqueado", { volume: 0.6 });
      }
      return;
    }

    this.terminado = true;
    this.physics.pause();
    this.puntaje += BONUS_NIVEL;
    this.particulas.explode(40, this.salida.x, this.salida.y);
    const esUltimo = this.indiceNivel === NIVELES.length - 1;

    if (esUltimo) {
      this.cameras.main.fadeOut(800, 255, 255, 255);
      this.cameras.main.once("camerafadeoutcomplete", () =>
        this.scene.start("fin", { gano: true, puntaje: this.puntaje, nivel: this.indiceNivel + 1 })
      );
    } else {
      this.sound.play("nivel");
      this.mostrarMensaje(`¡Nivel superado!\n+${BONUS_NIVEL} pts`, "#00e676");
      this.cameras.main.fadeOut(900);
      this.cameras.main.once("camerafadeoutcomplete", () =>
        this.scene.start("nivel", {
          nivel: this.indiceNivel + 1,
          puntaje: this.puntaje,
          vidas: this.vidas,
        })
      );
    }
  }

  tocarEnemigo() {
    if (this.terminado || this.invulnerable) return;

    this.vidas--;
    this.sound.play("golpe", { volume: 0.7 });
    this.cameras.main.shake(250, 0.015);
    this.cameras.main.flash(150, 255, 0, 0);
    this.actualizarHUD();

    if (this.vidas <= 0) {
      this.terminado = true;
      this.physics.pause();
      this.jugador.setTint(0xff0000);
      this.time.delayedCall(700, () =>
        this.scene.start("fin", { gano: false, puntaje: this.puntaje, nivel: this.indiceNivel + 1 })
      );
      return;
    }

    // Vuelve al inicio del nivel con un instante de invulnerabilidad
    this.invulnerable = true;
    this.jugador.setPosition(this.inicio.x, this.inicio.y);
    this.jugador.setVelocity(0, 0);
    this.tweens.add({ targets: this.jugador, alpha: 0.2, duration: 120, yoyo: true, repeat: 7 });
    this.time.delayedCall(2000, () => {
      this.invulnerable = false;
      this.jugador.setAlpha(1);
    });
  }

  // ---------------------------------------------------------------------------
  update() {
    if (this.terminado) return;

    const vel = new Phaser.Math.Vector2(0, 0);
    if (this.cursores.left.isDown || this.teclas.A.isDown) vel.x = -1;
    else if (this.cursores.right.isDown || this.teclas.D.isDown) vel.x = 1;
    if (this.cursores.up.isDown || this.teclas.W.isDown) vel.y = -1;
    else if (this.cursores.down.isDown || this.teclas.S.isDown) vel.y = 1;

    vel.normalize().scale(VEL_JUGADOR);
    this.jugador.setVelocity(vel.x, vel.y);
    if (vel.x !== 0) this.jugador.setFlipX(vel.x < 0);
  }
}
