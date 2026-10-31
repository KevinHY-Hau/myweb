/* nav.js: puts "Home" and "Games" buttons at the top of every chapter page.
   Put this file in the site root (next to index.html) and add ONE line before </body> in each chapter:
       <script src="../nav.js"></script>
   To change a label, icon or link, edit the three lines marked EDIT HERE; every chapter updates at once. */
(function () {
  if (window.__navDone) return; window.__navDone = true;
  var BUTTONS = [                                              // EDIT HERE
    { text: "🏠 Home",  href: "../index.html" },
    { text: "🎮 Games", href: "../games.html" }
  ];
  function add() {
    var header = document.querySelector("header");
    if (!header) return;
    var tools = header.querySelector(".tools");
    if (!tools) { tools = document.createElement("div"); tools.className = "tools"; header.appendChild(tools); }
    tools.style.cssText += ";display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-top:.8rem";
    var first = tools.firstChild;
    BUTTONS.forEach(function (b) {
      var a = document.createElement("a");
      a.className = "btn"; a.href = b.href; a.textContent = b.text;
      a.style.textDecoration = "none";                         // style.css underlines links on hover
      a.addEventListener("keydown", function (e) { e.stopPropagation(); }, true);
      tools.insertBefore(a, first);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", add); else add();
})();
