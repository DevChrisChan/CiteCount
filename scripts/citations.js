
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

