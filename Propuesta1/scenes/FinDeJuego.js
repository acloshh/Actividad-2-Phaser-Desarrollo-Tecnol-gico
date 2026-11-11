// Mejora 6: escena única de fin de juego, para ganar y para perder
export default class FinDeJuego extends Phaser.Scene {
  constructor() {
    super("fin");
  }

  init(data) {
    this.gano = data.gano;
    this.puntaje = data.puntaje ?? 0;
    this.recolectados = data.recolectados ?? [];
    this.tiempoRestante = data.tiempoRestante ?? 0;
  }

  create() {
    const { width } = this.scale;
    this.add.image(400, 300, "cielo").setTint(this.gano ? 0xccffcc : 0xffbbbb);
    this.sound.play(this.gano ? "ganar" : "perder");

    this.add
      .text(width / 2, 120, this.gano ? "¡GANASTE!" : "PERDISTE", {
        fontFamily: "Arial Black, Arial", fontSize: "72px",
        color: this.gano ? "#76ff03" : "#ff1744", stroke: "#000", strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2, 205,
        this.gano
          ? `Superaste la meta con ${this.tiempoRestante} s de sobra.`
          : "Se terminó el tiempo...",
        { fontFamily: "Arial", fontSize: "24px", color: "#fff", stroke: "#000", strokeThickness: 4 }
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, 270, `Puntaje: ${this.puntaje}`, {
        fontFamily: "Arial", fontSize: "40px", color: "#ffeb3b", stroke: "#000", strokeThickness: 6,
      })
      .setOrigin(0.5);

    // Resumen del array de recolectados
    ["cuadrado", "triangulo", "rombo", "bomba"].forEach((tipo, i) => {
      const x = 250 + i * 100;
      const cantidad = this.recolectados.filter((r) => r.tipo === tipo).length;
      this.add.image(x, 350, tipo);
      this.add.text(x, 385, `x${cantidad}`, { fontFamily: "Arial", fontSize: "22px", color: "#fff" }).setOrigin(0.5);
    });

    this.add
      .text(width / 2, 480, "R: jugar de nuevo     M: menú", {
        fontFamily: "Arial", fontSize: "24px", color: "#fff", backgroundColor: "#00000088", padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5);

    this.input.keyboard.once("keydown-R", () => this.scene.start("juego"));
    this.input.keyboard.once("keydown-M", () => this.scene.start("menu"));
  }
}
