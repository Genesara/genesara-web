export async function enableMocks() {
  if (!import.meta.env.VITE_USE_MOCK) return;
  const { worker } = await import('./browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });

  console.info('%c[genesara] MSW mock API is active', 'color:#C8A35E');
}
