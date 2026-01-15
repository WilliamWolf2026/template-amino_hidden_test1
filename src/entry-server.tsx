// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
          <link rel="icon" href="/favicon.ico" />
          {assets}
          <script innerHTML={`
            (function() {
              function setVH() {
                var vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--dynamic-vh', vh + 'px');
              }
              setVH();
              window.addEventListener('resize', setVH);
              window.addEventListener('orientationchange', function() {
                setTimeout(setVH, 100);
              });
            })();
          `} />
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
