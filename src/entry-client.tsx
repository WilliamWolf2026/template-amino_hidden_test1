// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";

// Load game font in parallel with app mount (ready before any Pixi Text is created)
const gameFont = new FontFace('Baloo', "url('/assets/fonts/Baloo-Regular.woff2')");
gameFont.load().then((loaded) => document.fonts.add(loaded));

mount(() => <StartClient />, document.getElementById("app")!);
