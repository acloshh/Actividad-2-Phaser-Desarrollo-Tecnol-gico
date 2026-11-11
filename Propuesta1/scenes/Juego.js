// ---------------------------------------------------------------------------
// Configuración del juego (consigna + mejoras)
// ---------------------------------------------------------------------------
const TIPOS = {
  cuadrado: { puntos: 10 },              // Mejora 2: puntaje distinto por figura
  triangulo: { puntos: 15 },
  rombo: { puntos: 20 },
  bomba: { puntos: 15, resta: true },    // Mejora 5: objeto que descuenta puntos
};
const TIPOS_BUENOS = ["cuadrado", "triangulo", "rombo"];
const PROBABILIDAD_BOMBA = 0.2;

const TIEMPO_INICIAL = 40;               // Mejora 1: segundos del contador descendente
const INTERVALO_APARICION = 500;         // Mejora 3: 0.5 s (consigna base: 1000 ms)
const DESCUENTO_POR_REBOTE = 5;          // Mejora 3
const PUNTOS_PARA_GANAR = 100;           // Mejora 2: hay que SUPERAR este valor

// "puntos": gana al superar PUNTOS_PARA_GANAR (Mejora 2)
// "items":  condición base, gana al juntar al menos 2 de cada tipo
const CONDICION_VICTORIA = "puntos";

export default class Juego extends Phaser.Scene {
  constructor() {
    super("juego");
  }

  init() {
    // Estructura de datos "array" donde se acumulan los objetos recolectados
    this.recolectados = [];
    this.puntaje = 0;
    this.tiempoRestante = TIEMPO_INICIAL;
    this.terminado = false;
  }

  create() {
    this.add.image(400, 300, "cielo");

    // --- Plataformas (plataforma inferior + Mejora 4) ---
    this.plataformas = this.physics.add.staticGroup();
    this.plataformas.create(400, 580, "piso");
    [
      [140, 440], [660, 440],
      [400, 320],
      [120, 200], [680, 200],
    ].forEach(([x, y]) => this.plataformas.create(x, y, "plataforma"));

    // --- Jugador ---
    this.jugador = this.physics.add.sprite(400, 500, "jugador");
    this.jugador.setCollideWorldBounds(true);
    this.jugador.body.setGravityY(500);

    // --- Ítems que caen ---
    this.items = this.physics.add.group();

    // --- Colisiones ---
    this.physics.add.collider(this.jugador, this.plataformas);
    this.physics.add.collider(this.items, this.plataformas, this.alRebotar, null, this);
    this.physics.add.overlap(this.jugador, this.items, this.recolectar, null, this);

    // --- Entradas ---
    this.cursores = this.input.keyboard.createCursorKeys();
    this.teclas = this.input.keyboard.addKeys("A,D,W");

    // --- Partículas (imagen del template) ---
    this.particulas = this.add.particles(0, 0, "particula", {
      speed: { min: 60, max: 220 },
      scale: { start: 0.35, end: 0 },
      lifespan: 500,
      blendMode: "ADD",
      emitting: false,
    });

    // --- Temporizadores ---
    this.time.addEvent({
      delay: INTERVALO_APARICION,
      loop: true,
      callback: this.crearItem,
      callbackScope: this,
    });
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.descontarTiempo,
      callbackScope: this,
    });

    this.crearHUD();
  }

  // -------------------------------------------------------------------------
  crearHUD() {
    const estilo = { fontFamily: "Arial", fontSize: "22px", color: "#fff", stroke: "#000", strokeThickness: 4 };
    this.add.rectangle(400, 22, 800, 44, 0x000000, 0.45).setDepth(10);
    this.textoPuntaje = this.add.text(12, 10, "", estilo).setDepth(11);
    this.textoTiempo = this.add.text(400, 10, "", estilo).setOrigin(0.5, 0).setDepth(11);

    this.textosConteo = {};
    Object.keys(TIPOS).forEach((tipo, i) => {
      const x = 560 + i * 60;
      this.add.image(x, 22, tipo).setScale(0.6).setDepth(11);
      this.textosConteo[tipo] = this.add.text(x + 14, 11, "0", estilo).setDepth(11);
    });
    this.actualizarHUD();
  }

  actualizarHUD() {
    this.textoPuntaje.setText(`Puntos: ${this.puntaje} / ${PUNTOS_PARA_GANAR}`);
    this.textoTiempo.setText(`Tiempo: ${this.tiempoRestante}`);
    this.textoTiempo.setColor(this.tiempoRestante <= 10 ? "#ff5252" : "#ffffff");
    Object.keys(TIPOS).forEach((tipo) => {
      this.textosConteo[tipo].setText(String(this.contar(tipo)));
    });
  }

  // -------------------------------------------------------------------------
  crearItem() {
    if (this.terminado) return;

    const tipo =
      Math.random() < PROBABILIDAD_BOMBA ? "bomba" : Phaser.Utils.Array.GetRandom(TIPOS_BUENOS);
    const x = Phaser.Math.Between(30, 770);

    const item = this.items.create(x, 60, tipo);
    item.setBounce(0.8);
    item.setCollideWorldBounds(true);
    item.setVelocityX(Phaser.Math.Between(-80, 80));
    item.setAngularVelocity(Phaser.Math.Between(-120, 120));
    item.setData({ tipo, valor: TIPOS[tipo].puntos, ultimoRebote: 0 });

    // Texto con el valor actual del ítem, sigue al ítem en update()
    const etiqueta = this.add
      .text(x, 60, "", {
        fontFamily: "Arial", fontSize: "14px", color: TIPOS[tipo].resta ? "#ff8a80" : "#ffffff",
        stroke: "#000", strokeThickness: 3,
      })
      .setOrigin(0.5);
    item.setData("etiqueta", etiqueta);
    this.actualizarEtiqueta(item);
    item.on("destroy", () => etiqueta.destroy());
  }

  actualizarEtiqueta(item) {
    const signo = TIPOS[item.getData("tipo")].resta ? "-" : "+";
    item.getData("etiqueta").setText(`${signo}${item.getData("valor")}`);
  }

  // Mejora 3: cada rebote con el piso descuenta 5 puntos al objeto
  alRebotar(item) {
    if (!item.active || !item.body || !item.body.touching.down) return; // sólo cuando cae sobre una plataforma

    const ahora = this.time.now;
    if (ahora - item.getData("ultimoRebote") < 150) return; // un descuento por rebote
    item.setData("ultimoRebote", ahora);

    const valor = item.getData("valor") - DESCUENTO_POR_REBOTE;
    if (valor <= 0) {
      this.sound.play("desaparece", { volume: 0.4 });
      this.particulas.explode(6, item.x, item.y);
      item.destroy();
      return;
    }
    item.setData("valor", valor);
    this.actualizarEtiqueta(item);
    this.sound.play("rebote", { volume: 0.25 });
  }

  recolectar(jugador, item) {
    if (this.terminado) return;

    const tipo = item.getData("tipo");
    const valor = item.getData("valor");
    this.particulas.explode(14, item.x, item.y);
    item.destroy();

    // Se persiste el objeto recolectado en el array
    this.recolectados.push({ tipo, valor });

    if (TIPOS[tipo].resta) {
      this.puntaje = Math.max(0, this.puntaje - valor);
      this.sound.play("malo");
      this.cameras.main.shake(150, 0.01);
    } else {
      this.puntaje += valor;
      this.sound.play("recoger", { volume: 0.6 });
    }
    this.actualizarHUD();

    // Al recolectar un nuevo elemento se verifica la condición de victoria
    if (this.verificarVictoria()) this.terminar(true);
  }

  contar(tipo) {
    return this.recolectados.filter((r) => r.tipo === tipo).length;
  }

  verificarVictoria() {
    if (CONDICION_VICTORIA === "items") {
      return TIPOS_BUENOS.every((tipo) => this.contar(tipo) >= 2);
    }
    return this.puntaje > PUNTOS_PARA_GANAR;
  }

  // Mejora 1: contador descendente, al llegar a 0 se pierde
  descontarTiempo() {
    if (this.terminado) return;
    this.tiempoRestante--;
    this.actualizarHUD();
    if (this.tiempoRestante <= 0) this.terminar(false);
  }

  terminar(gano) {
    this.terminado = true;
    this.physics.pause();
    this.time.removeAllEvents();
    this.jugador.setTint(gano ? 0x76ff03 : 0xff1744);

    this.time.delayedCall(800, () => {
      this.scene.start("fin", {
        gano,
        puntaje: this.puntaje,
        recolectados: this.recolectados,
        tiempoRestante: this.tiempoRestante,
      });
    });
  }

  // -------------------------------------------------------------------------
  update() {
    // Las etiquetas de valor siguen a cada ítem
    this.items.getChildren().forEach((item) => {
      item.getData("etiqueta").setPosition(item.x, item.y - 26);
    });

    if (this.terminado) return;

    const izquierda = this.cursores.left.isDown || this.teclas.A.isDown;
    const derecha = this.cursores.right.isDown || this.teclas.D.isDown;
    const saltar =
      Phaser.Input.Keyboard.JustDown(this.cursores.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursores.space) ||
      Phaser.Input.Keyboard.JustDown(this.teclas.W);

    if (izquierda) {
      this.jugador.setVelocityX(-300);
      this.jugador.setFlipX(true);
    } else if (derecha) {
      this.jugador.setVelocityX(300);
      this.jugador.setFlipX(false);
    } else {
      this.jugador.setVelocityX(0);
    }

    const enSuelo = this.jugador.body.blocked.down || this.jugador.body.touching.down;
    if (saltar && enSuelo) {
      this.jugador.setVelocityY(-560);
      this.sound.play("salto", { volume: 0.4 });
    }
  }
}
