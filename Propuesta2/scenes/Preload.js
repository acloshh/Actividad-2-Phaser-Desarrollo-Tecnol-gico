export const NIVELES = ["nivel1", "nivel2", "nivel3"];

export default class Preload extends Phaser.Scene {
  constructor() {
    super("preload");
  }

  preload() {
    // Imágenes del template
    this.load.image("cielo", "./public/assets/space3.png");
    this.load.image("logo", "./public/assets/phaser3-logo.png");
    this.load.image("particula", "./public/assets/particles/red.png");

    // Tileset y mapas de mosaicos (formato Tiled JSON)
    this.load.image("tiles", "./public/assets/tilemaps/tileset.png");
    NIVELES.forEach((n) => this.load.tilemapTiledJSON(n, `./public/assets/tilemaps/${n}.json`));

    // Sonidos
    ["recoger", "bloqueado", "nivel", "golpe", "ganar", "perder"].forEach((s) =>
      this.load.audio(s, `./public/assets/sounds/${s}.wav`)
    );
  }

  create() {
    this.crearTexturas();
    this.scene.start("menu");
  }

  crearTexturas() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Jugador
    g.fillStyle(0x4fc3f7).fillCircle(14, 14, 13);
    g.lineStyle(2, 0xffffff).strokeCircle(14, 14, 13);
    g.fillStyle(0xffffff).fillCircle(9, 11, 4).fillCircle(19, 11, 4);
    g.fillStyle(0x000000).fillCircle(10, 12, 2).fillCircle(20, 12, 2);
    g.generateTexture("jugador", 28, 28).clear();

    // Ítem recolectable (gema)
    const gema = [
      new Phaser.Geom.Point(10, 0), new Phaser.Geom.Point(20, 8),
      new Phaser.Geom.Point(10, 22), new Phaser.Geom.Point(0, 8),
    ];
    g.fillStyle(0xffd54f).fillPoints(gema, true);
    g.lineStyle(2, 0xffffff).strokePoints(gema, true);
    g.generateTexture("item", 20, 22).clear();

    // Salida (portal)
    g.fillStyle(0x00e676, 0.35).fillCircle(24, 24, 24);
    g.lineStyle(4, 0x00e676).strokeCircle(24, 24, 20);
    g.lineStyle(3, 0xb9f6ca).strokeCircle(24, 24, 12);
    g.fillStyle(0xffffff).fillCircle(24, 24, 4);
    g.generateTexture("salida", 48, 48).clear();

    // Enemigo
    const pinchos = [];
    for (let i = 0; i < 16; i++) {
      const r = i % 2 ? 9 : 15;
      const a = (i / 16) * Math.PI * 2;
      pinchos.push(new Phaser.Geom.Point(15 + Math.cos(a) * r, 15 + Math.sin(a) * r));
    }
    g.fillStyle(0xff1744).fillPoints(pinchos, true);
    g.fillStyle(0xffffff).fillCircle(11, 13, 3).fillCircle(19, 13, 3);
    g.fillStyle(0x000000).fillCircle(11, 14, 1.5).fillCircle(19, 14, 1.5);
    g.generateTexture("enemigo", 30, 30).clear();

    g.destroy();
  }
}
