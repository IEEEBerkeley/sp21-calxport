let alertButton = document.getElementById('getCourse');
const MutationObserver = window.MutationObserver;
// const observer = new MutationObserver(function(mutations) {
//   mutations.forEach(function(mutation) {

//   })
// })
alertButton.addEventListener("click", function () {
  var firstCourseName = document.getElementsByClassName("ps_grid-cell$0");
  console.log(firstCourseName)
  console.log("clicked on grab classes!")
}); 
