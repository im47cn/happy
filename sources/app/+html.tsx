import { ScrollViewStyleReset } from 'expo-router/html';
import '../unistyles';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />

        {/* PWA Status Bar */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Theme color for PWA */}
        <meta name="theme-color" content="#18171C" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#F5F5F5" media="(prefers-color-scheme: light)" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}

/* PWA Safe Area handling */
:root {
  --sat: env(safe-area-inset-top, 0px);
  --sar: env(safe-area-inset-right, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
}

/* PWA Standalone mode specific styles */
@media (display-mode: standalone) {
  body {
    /* Prevent overscroll bounce */
    overscroll-behavior: none;
    /* Enable safe area padding */
    padding-top: var(--sat);
    padding-bottom: var(--sab);
    padding-left: var(--sal);
    padding-right: var(--sar);
  }
}

/* iOS PWA specific */
@supports (-webkit-touch-callout: none) {
  @media (display-mode: standalone) {
    body {
      /* Fix iOS PWA viewport issues */
      min-height: 100vh;
      min-height: -webkit-fill-available;
    }
  }
}

/* Touch optimization for mobile */
@media (hover: none) and (pointer: coarse) {
  /* Larger touch targets */
  button, a, [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }

  /* Disable text selection on interactive elements */
  button, a, [role="button"] {
    -webkit-user-select: none;
    user-select: none;
  }
}`;
