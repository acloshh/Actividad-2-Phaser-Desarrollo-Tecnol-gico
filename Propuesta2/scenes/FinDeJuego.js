export default class FinDeJuego extends Phaser.Scene {
  constructor() {
    super("fin");
  }

  init(data) {
    this.gano = data.gano;
    this.puntaje = data.puntaje ?? 0;
    this.nivel = data.nivel ?? 1;
  }

  create() {
    const { width } = this.scale;
    this.add.image(400, 300, "cielo").setTint(this.gano ? 0xccffcc : 0xffbbbb);
    this.cameras.main.fadeIn(500);
    this.sound.play(this.gano ? "ganar" : "perder");

    this.add
      .text(width / 2, 150, this.gano ? "¡GANASTE!" : "PERDISTE", {
        fontFamily: "Arial Black, Arial", fontSize: "72px",
        color: this.gano ? "#76ff03" : "#ff1744", stroke: "#000", strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2, 240,
        this.gano ? "Escapaste de los 3 laberintos." : `Te atraparon en el nivel ${this.nivel}.`,
        { fontFamily: "Arial", fontSize: "26px", color: "#fff", stroke: "#000", strokeThickness: 4 }
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, 320, `Puntaje total: ${this.puntaje}`, {
        fontFamily: "Arial", fontSize: "42px", color: "#ffeb3b", stroke: "#000", strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 460, "R: jugar de nuevo     M: menú", {
        fontFamily: "Arial", fontSize: "24px", color: "#fff", backgroundColor: "#00000088", padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5);

    this.input.keyboard.once("keydown-R", () =>
      this.scene.start("nivel", { nivel: 0, puntaje: 0, vidas: 3 })
    );
    this.input.keyboard.once("keydown-M", () => this.scene.start("menu"));
  }
}
