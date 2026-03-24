function sendMessage(){

let input=document.getElementById("userInput").value;

let chatBox=document.getElementById("chatBox");

let userMsg="<p><b>You:</b> "+input+"</p>";

let aiMsg="<p><b>AI:</b> I will help you understand this topic.</p>";

chatBox.innerHTML+=userMsg+aiMsg;

document.getElementById("userInput").value="";
}

function login(){
window.location="dashboard.html";
}