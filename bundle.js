// Тестовый sandbox-плагин v1.3: handshake vks.plugin.* по MessagePort (rev3, типы с префиксом ns).
(function () {
  "use strict";
  var NS = "vks.plugin";
  var V = 1;
  var port = null;
  var grants = [];
  var seq = 0;
  function env(type, payload) {
    return { ns: NS, v: V, id: "m" + (++seq) + Date.now(), type: NS + "." + type, payload: payload };
  }
  function send(type, payload, requestId) {
    if (port) { var m = env(type, payload); if (requestId) m.request_id = requestId; port.postMessage(m); }
  }
  function render() {
    var root = document.getElementById("vks-test-plugin") || document.createElement("div");
    root.style.cssText = "font:14px sans-serif;padding:8px;color:#171";
    root.id = "vks-test-plugin";
    root.textContent = "plugin alive, grants: " + (grants.join(",") || "(none)") + " ";
    if (!document.getElementById("vks-plugin-egress")) {
      var b = document.createElement("button");
      b.id = "vks-plugin-egress";
      b.textContent = "egress test";
      b.onclick = function () {
        send("invoke", { capability: "network.egress",
          payload: { url: "https://api.github.com/zen", method: "GET" } }, "req-egress-1");
      };
      root.appendChild(b);
    }
    (document.body || document.documentElement).appendChild(root);
  }
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.ns !== NS || d.type !== NS + ".port" || !e.ports || !e.ports[0]) return;
    port = e.ports[0];
    port.onmessage = function (m) {
      var md = m.data;
      if (!md || md.ns !== NS) return;
      if (md.type === NS + ".session" || md.type === NS + ".session_update") {
        grants = (md.payload && md.payload.grants) || grants; render();
      }
      if (md.type === NS + ".result" || md.type === NS + ".error") {
        var el = document.getElementById("vks-test-plugin");
        if (el) el.textContent = md.type.slice(NS.length + 1) + ": " + JSON.stringify(md.payload).slice(0, 200);
      }
      if (md.type === NS + ".disabled") { port.close(); var el2 = document.getElementById("vks-test-plugin"); if (el2) el2.textContent = "disabled"; }
    };
    port.postMessage(env("hello", { nonce: d.payload && d.payload.nonce }));
  });
  window.parent.postMessage(env("ready", {}), "*");
})();
