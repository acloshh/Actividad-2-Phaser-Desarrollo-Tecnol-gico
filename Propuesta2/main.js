import Preload from "./scenes/Preload.js";
import Menu from "./scenes/Menu.js";
import Nivel from "./scenes/Nivel.js";
import FinDeJuego from "./scenes/FinDeJuego.js";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#000000",
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 800, height: 600 },
    max: { width: 1600, height: 1200 },
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 }, // vista desde arriba: sin gravedad
      debug: false,
    },
  },
  scene: [Preload, Menu, Nivel, FinDeJuego],
};

window.game = new Phaser.Game(config);
