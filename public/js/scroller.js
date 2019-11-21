//jshint esversion: 6
console.log("auto scroller here");

let messagesDiv = document.querySelector('.messages');
console.log(messagesDiv);
messagesDiv.scrollTop = messagesDiv.scrollHeight;