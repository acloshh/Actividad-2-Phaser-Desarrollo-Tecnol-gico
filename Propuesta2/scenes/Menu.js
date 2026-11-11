export default class Menu extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  create() {
    const { width } = this.scale;
    this.add.image(400, 300, "cielo");
    this.add.image(width / 2, 90, "logo").setScale(0.8);

    this.add
      .text(width / 2, 185, "LABERINTO ESTELAR", {
        fontFamily: "Arial Black, Arial", fontSize: "48px", color: "#fff",
        stroke: "#000", strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add.image(250, 270, "item");
    this.add.text(275, 270, "Juntá al menos 5 gemas por nivel", { fontFamily: "Arial", fontSize: "20px", color: "#fff" }).setOrigin(0, 0.5);
    this.add.image(250, 320, "salida").setScale(0.7);
    this.add.text(275, 320, "Llegá al portal para pasar de nivel", { fontFamily: "Arial", fontSize: "20px", color: "#fff" }).setOrigin(0, 0.5);
    this.add.image(250, 370, "enemigo");
    this.add.text(275, 370, "Esquivá a los enemigos (3 vidas)", { fontFamily: "Arial", fontSize: "20px", color: "#fff" }).setOrigin(0, 0.5);

    this.add
      .text(width / 2, 445, "Flechas o WASD para moverte\n3 niveles: el último es más grande que la pantalla", {
        fontFamily: "Arial", fontSize: "18px", color: "#ddd", align: "center",
      })
      .setOrigin(0.5);

    const iniciar = this.add
      .text(width / 2, 540, "Presioná ENTER o hacé click para jugar", { fontFamily: "Arial", fontSize: "22px", color: "#ffeb3b" })
      .setOrigin(0.5);
    this.tweens.add({ targets: iniciar, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    const empezar = () => this.scene.start("nivel", { nivel: 0, puntaje: 0, vidas: 3 });
    this.input.keyboard.once("keydown-ENTER", empezar);
    this.input.once("pointerdown", empezar);
  }
}
