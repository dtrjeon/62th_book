const CACHE_NAME = "62th-cost-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./62th_cost_by_stage_live.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// 앱 셸(HTML/아이콘/매니페스트)은 캐시 우선, 그 외(특히 GAS 데이터 요청)는 항상 네트워크로
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isAppShell = event.request.method === "GET" && url.origin === self.location.origin;

  if (isAppShell) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const network = fetch(event.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
  // 구글 스크립트(script.google.com) 등 외부 데이터 요청은 그대로 네트워크로 통과
});
