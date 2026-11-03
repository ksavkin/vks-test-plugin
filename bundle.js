// Тестовый sandbox-плагин v1.3: handshake vks.plugin.* по MessagePort (rev3).
(function () {
  "use strict";
  var NS = "vks.plugin";
  var port = null;
  var grants = [];
  function send(type, payload) {
    if (port) port.postMessage({ ns: NS, v: 1, id: "m" + Date.now(), type: type, request_id: null, payload: payload });
  }
  function render() {
    var root = document.createElement("div");
    root.style.cssText = "font:14px sans-serif;padding:8px;border:1px solid #4a6;color:#4a6";
    root.id = "vks-test-plugin";
    root.textContent = "plugin alive, grants: " + grants.join(",");
    var b = document.createElement("button");
    b.id = "vks-plugin-egress";
    b.textContent = "egress test";
    b.onclick = function () {
      send("invoke", { request_id: "r" + Date.now(), capability: "network.egress",
        payload: { url: "https://api.github.com/zen", method: "GET" } });
    };
    root.appendChild(b);
    (document.body || document.documentElement).appendChild(root);
  }
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.ns !== NS || d.type !== "bootstrap" || !e.ports || !e.ports[0]) return;
    port = e.ports[0];
    port.onmessage = function (m) {
      var md = m.data;
      if (!md || md.ns !== NS) return;
      if (md.type === "session") { grants = (md.payload && md.payload.grants) || []; render(); }
      if (md.type === "result") {
        var el = document.getElementById("vks-test-plugin");
        if (el) el.textContent = "result: " + JSON.stringify(md.payload).slice(0, 200);
      }
      if (md.type === "error" && document.getElementById("vks-test-plugin")) {
        document.getElementById("vks-test-plugin").textContent = "error: " + JSON.stringify(md.payload).slice(0, 200);
      }
      if (md.type === "disabled") { port.close(); }
    };
    port.postMessage({ ns: NS, v: 1, id: "h1", type: "hello", request_id: null, payload: { nonce: d.payload && d.payload.nonce } });
  });
  window.parent.postMessage({ ns: NS, v: 1, id: "r1", type: "ready", request_id: null, payload: {} }, "*");
})();
