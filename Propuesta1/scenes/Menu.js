export default class Menu extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  create() {
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, "cielo");
    this.add.image(width / 2, 90, "logo").setScale(0.8);

    this.add
      .text(width / 2, 180, "LLUVIA DE FIGURAS", {
        fontFamily: "Arial Black, Arial", fontSize: "44px", color: "#ffffff",
        stroke: "#000", strokeThickness: 6,
      })
      .setOrigin(0.5);

    const filas = [
      ["cuadrado", "Cuadrado: 10 pts"],
      ["triangulo", "Triángulo: 15 pts"],
      ["rombo", "Rombo: 20 pts"],
      ["bomba", "Bomba: RESTA puntos"],
    ];
    filas.forEach(([tex, texto], i) => {
      const y = 250 + i * 42;
      this.add.image(width / 2 - 120, y, tex);
      this.add.text(width / 2 - 90, y, texto, { fontFamily: "Arial", fontSize: "22px", color: "#fff" }).setOrigin(0, 0.5);
    });

    this.add
      .text(
        width / 2, 450,
        "Superá los 100 puntos antes de que se acabe el tiempo.\n" +
          "Cada rebote en el piso le quita 5 puntos a la figura.\n\n" +
          "← → para moverte   ↑ / ESPACIO para saltar",
        { fontFamily: "Arial", fontSize: "18px", color: "#ddd", align: "center" }
      )
      .setOrigin(0.5);

    const iniciar = this.add
      .text(width / 2, 550, "Presioná ENTER o hacé click para jugar", {
        fontFamily: "Arial", fontSize: "22px", color: "#ffeb3b",
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: iniciar, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    const empezar = () => this.scene.start("juego");
    this.input.keyboard.once("keydown-ENTER", empezar);
    this.input.once("pointerdown", empezar);
  }
}
