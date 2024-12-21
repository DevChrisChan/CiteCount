const texts = ["IB Extended Essay", "Research Papers", "IB Biology IA", "IB Chemistry IA", "IB Math IA"];
const gradients = [
  "linear-gradient(90deg, #ffb3b3, #ffcc99)",
  "linear-gradient(90deg, #ffccff, #ff99cc)",
  "linear-gradient(90deg, #b3e0ff, #66b3ff)",
  "linear-gradient(90deg, #ffffb3, #ffcc99)",
  "linear-gradient(90deg, #d9ffb3, #99ffcc)",
  "linear-gradient(90deg, #ffb3e6, #d99fff)"
];
let index = 0;
const changingText = document.getElementById("changing-text");

changingText.style.backgroundImage = gradients[index];

setInterval(() => {
  index = (index + 1) % texts.length;
  changingText.textContent = texts[index];
  changingText.style.backgroundImage = gradients[index];
  changingText.style.animation = 'none';
  changingText.offsetHeight; 
  changingText.style.animation = ''; 
}, 3000);