export default function AdjPage() {
  return (
    <main style={{ height: '100dvh', minHeight: 640, background: '#f4f7fa' }}>
      <iframe
        src="/adj/index.html"
        title="ADJ Builder"
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
      />
    </main>
  );
}
