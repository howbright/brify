export default function ResultPreview({ result }: { result: any }) {
    return (
      <section className="rounded-3xl bg-white p-6 border">
        <h3 className="font-semibold mb-2">Result (Mock)</h3>
        <pre className="text-xs bg-neutral-900 text-white p-3 rounded-xl overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      </section>
    );
  }
  