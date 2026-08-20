/**
 * Persona 5 Mask Randomizer
 * Randomly selects and renders one of the available P5 masks (Joker, Ann, Akechi).
 */

const P5_MASKS = [
  '../assets/Joker Mask.png',
  '../assets/Ann Mask.png',
  '../assets/Akechi Mask.png'
];

function getRandomMask() {
  const randomIndex = Math.floor(Math.random() * P5_MASKS.length);
  return P5_MASKS[randomIndex];
}

function initRandomMasks() {
  const maskElements = document.querySelectorAll('.p5-mask, [data-random-mask]');
  if (maskElements.length === 0) return;

  const chosenMask = getRandomMask();
  maskElements.forEach(img => {
    img.src = chosenMask;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initRandomMasks();
});
