import Image from "next/image";
import Link from "next/link";
import { InteractiveBackground } from "@/components/InteractiveBackground";

export default function ReturnPage() {
  return (
    <main className="subPage returnPage">
      <InteractiveBackground />
      <header className="simpleTopBar">
        <Link className="brandLockup" href="/" aria-label="Mirror home">
          <Image className="logoImage logoImageSmall" src="/CLEAR.png" width={50} height={50} alt="" aria-hidden="true" />
          <span>MIRROR</span>
        </Link>
      </header>

      <section className="returnContent" aria-labelledby="approval-title">
        <p className="eyebrow">Vana approval</p>
        <h1 id="approval-title">Approval received</h1>
        <p className="lede">
          Mirror will check your approval status as soon as the original tab is visible again.
        </p>
        <Link className="mirrorButton" href="/">
          Return to app
        </Link>
      </section>
    </main>
  );
}
