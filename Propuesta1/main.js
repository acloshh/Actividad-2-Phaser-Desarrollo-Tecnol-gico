import Preload from "./scenes/Preload.js";
import Menu from "./scenes/Menu.js";
import Juego from "./scenes/Juego.js";
import FinDeJuego from "./scenes/FinDeJuego.js";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#000000",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 800, height: 600 },
    max: { width: 1600, height: 1200 },
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  // La primera escena de la lista es la que arranca
  scene: [Preload, Menu, Juego, FinDeJuego],
};

window.game = new Phaser.Game(config);
