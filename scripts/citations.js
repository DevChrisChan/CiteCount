
var citationsCounter = document.getElementById("Citations");

citationsCounter.onclick = function() {
	citationsModal.classList.add("show");
}

var citationsModal = document.getElementById("citationsModal");
var citationsBtn = document.querySelector(".citations-link");
var citationsSpan = document.getElementsByClassName("close")[1];

citationsSpan.onclick = function() {
	citationsModal.classList.remove("show");
}

document.addEventListener('keydown', function(event) {
	if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
		citationsModal.classList.add("show");
		event.preventDefault();
	}
});

document.querySelectorAll('.counter').forEach(counter => {
	counter.addEventListener('click', function() {
	  const countValue = this.getAttribute('data-value');
	  
	  // Create a temporary textarea to hold the count value
	  const tempInput = document.createElement('textarea');
	  tempInput.value = countValue;
	  document.body.appendChild(tempInput);
	  tempInput.select();
	  document.execCommand('copy');
	  document.body.removeChild(tempInput);
	
	});
  });


