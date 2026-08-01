import Link from "next/link";

export default function ReturnPage() {
  return (
    <main className="container">
      <h1>Approval received</h1>
      <p>You can close this tab and return to Mirror.</p>
      <Link href="/">Return to app</Link>
    </main>
  );
}
