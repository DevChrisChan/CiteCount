const texts = ["Extended Essay", "Biology IA", "Chemistry IA", "Math IA", "Economics IA"];
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
          changingText.style.transform = 'translateY(-100%)';
          changingText.style.opacity = 0;

          setTimeout(() => {
            changingText.textContent = texts[index];
            changingText.style.backgroundImage = gradients[index];
            changingText.style.transform = 'translateY(100%)';

            requestAnimationFrame(() => {
              changingText.style.transform = 'translateY(-100%)';
              changingText.style.opacity = 0;

              setTimeout(() => {
                changingText.style.transform = 'translateY(0)';
                changingText.style.opacity = 1;
              }, 50);
            });
          }, 500);
        }, 3000);