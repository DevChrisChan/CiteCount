
var citationsCounter = document.getElementById("Citations");

citationsCounter.onclick = function() {
	citationsModal.classList.add("show");
}

var citationsModal = document.getElementById("citationsModal");
var citationsBtn = document.querySelector(".citations-link"); // Add this class to your citations counter
var citationsSpan = document.getElementsByClassName("close")[1]; // Assuming this is the second modal

citationsSpan.onclick = function() {
	citationsModal.classList.remove("show");
}

