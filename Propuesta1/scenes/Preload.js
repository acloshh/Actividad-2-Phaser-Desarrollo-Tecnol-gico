// Carga los assets del template + sonidos y genera las texturas de las figuras.
export default class Preload extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload() {
    // Imágenes del template
    this.load.image("cielo", "./public/assets/space3.png");
    this.load.image("logo", "./public/assets/phaser3-logo.png");
    this.load.image("particula", "./public/assets/particles/red.png");

    // Sonidos
    const sonidos = ["recoger", "malo", "rebote", "salto", "desaparece", "ganar", "perder"];
    sonidos.forEach((s) => this.load.audio(s, `./public/assets/sounds/${s}.wav`));
  }

  create() {
    this.crearTexturas();
    this.scene.start("menu");
  }

  // Dibuja con Graphics y guarda cada figura como textura reutilizable
  crearTexturas() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const S = 32;

    // Jugador
    g.fillStyle(0x4fc3f7).fillRoundedRect(0, 0, 40, 48, 8);
    g.fillStyle(0xffffff).fillCircle(13, 16, 6).fillCircle(27, 16, 6);
    g.fillStyle(0x000000).fillCircle(14, 17, 3).fillCircle(28, 17, 3);
    g.generateTexture("jugador", 40, 48).clear();

    // Cuadrado
    g.fillStyle(0x66bb6a).fillRect(0, 0, S, S);
    g.lineStyle(3, 0xffffff).strokeRect(1.5, 1.5, S - 3, S - 3);
    g.generateTexture("cuadrado", S, S).clear();

    // Triángulo
    g.fillStyle(0xffca28).fillTriangle(S / 2, 0, S, S, 0, S);
    g.lineStyle(3, 0xffffff).strokeTriangle(S / 2, 2, S - 2, S - 1.5, 2, S - 1.5);
    g.generateTexture("triangulo", S, S).clear();

    // Rombo
    const rombo = [
      new Phaser.Geom.Point(S / 2, 0),
      new Phaser.Geom.Point(S, S / 2),
      new Phaser.Geom.Point(S / 2, S),
      new Phaser.Geom.Point(0, S / 2),
    ];
    g.fillStyle(0xab47bc).fillPoints(rombo, true);
    g.lineStyle(3, 0xffffff).strokePoints(rombo, true);
    g.generateTexture("rombo", S, S).clear();

    // Bomba (resta puntos)
    g.fillStyle(0x212121).fillCircle(S / 2, S / 2 + 2, 13);
    g.lineStyle(3, 0xff5252).strokeCircle(S / 2, S / 2 + 2, 13);
    g.lineStyle(3, 0xff5252).lineBetween(10, 12, 22, 24).lineBetween(22, 12, 10, 24);
    g.fillStyle(0xffab40).fillRect(S / 2 - 2, 0, 4, 6);
    g.generateTexture("bomba", S, S).clear();

    // Plataformas
    g.fillStyle(0x5d4037).fillRect(0, 0, 800, 40);
    g.fillStyle(0x7cb342).fillRect(0, 0, 800, 10);
    g.generateTexture("piso", 800, 40).clear();

    g.fillStyle(0x6d4c41).fillRoundedRect(0, 0, 160, 20, 6);
    g.fillStyle(0x9ccc65).fillRoundedRect(0, 0, 160, 8, { tl: 6, tr: 6, bl: 0, br: 0 });
    g.generateTexture("plataforma", 160, 20).clear();

    g.destroy();
  }
}
