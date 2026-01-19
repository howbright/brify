type Props = {
    title: string;
    message: string;
    bullets: string[];
  };
  
  export default function ProcessingStatus({ title, message, bullets }: Props) {
    return (
      <section className="rounded-3xl border bg-blue-50 p-4">
        <p className="font-semibold mb-2">{title}</p>
        <p className="text-sm mb-3">{message}...</p>
        <ul className="list-disc list-inside text-xs space-y-1">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </section>
    );
  }
  