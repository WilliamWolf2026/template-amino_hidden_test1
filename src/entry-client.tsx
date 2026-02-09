// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";

// Wait for fonts to load before mounting to prevent FOUT on loading screen
document.fonts.ready.then(() => {
  mount(() => <StartClient />, document.getElementById("app")!);
});
