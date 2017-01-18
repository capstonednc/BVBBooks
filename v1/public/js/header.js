var navLinks = document.querySelectorAll("li");

function selectNavButton(){
	for (var i = 0; i < navLinks.length; i++){
		navLinks[i].addEventListener("click", function(){
			navLinks[0].classList.remove("selected");
			navLinks[1].classList.remove("selected");
			navLinks[2].classList.remove("selected");
			navLinks[3].classList.remove("selected");
			navLinks[4].classList.remove("selected");
			navLinks[5].classList.remove("selected");
			this.classList.toggle("selected");	
		});
	}
}

selectNavButton();