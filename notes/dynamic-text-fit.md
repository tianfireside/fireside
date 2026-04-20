# Dynamic Text Fitting for Hero Title

## Problem
CSS cannot measure how wide a specific word will render in a specific font, so `font-size` in `vw` units requires manual calibration per breakpoint.

## JS Solution (future)
Measure the rendered text width at runtime and back-calculate the correct font-size to fill the container exactly.

```js
function fitText(el) {
  const parent = el.parentElement;
  let size = parseFloat(getComputedStyle(el).fontSize);
  el.style.whiteSpace = 'nowrap';

  while (el.scrollWidth > parent.clientWidth && size > 8) {
    size -= 0.5;
    el.style.fontSize = size + 'px';
  }
}

fitText(document.querySelector('.hero-line1'));
fitText(document.querySelector('.hero-law'));
```

Place in a `DOMContentLoaded` listener and re-run on `window.resize`.

## Why not needed now
`font-size: 14vw` is calibrated to the narrowest common phone (320px iPhone SE) and matches desktop proportions. Safe without JS.
