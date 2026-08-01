import Image from "next/image";
import Link from "next/link";
import { ClaudeUploadZone } from "@/components/ClaudeUploadZone";

export default function ClaudeUploadPage() {
  return (
    <main className="subPage uploadPage">
      <header className="simpleTopBar">
        <Link className="brandLockup" href="/" aria-label="Mirror home">
          <Image className="logoImage logoImageSmall" src="/CLEAR.png" width={50} height={50} alt="" aria-hidden="true" />
          <span>MIRROR</span>
        </Link>
      </header>

      <section className="uploadGrid">
        <div>
          <p className="eyebrow">Claude import</p>
          <h1>Bring your Claude export.</h1>
          <p className="lede">
            Claude takes a manual export step today. Once you have the file, Mirror processes it through the same card
            pipeline as the ChatGPT flow.
          </p>
          <ol className="steps">
            <li>Open claude.ai, then Settings, Privacy, Export data.</li>
            <li>Download the ZIP from email and extract conversations.json.</li>
            <li>Drop that JSON file here to generate the card.</li>
          </ol>
        </div>
        <ClaudeUploadZone />
      </section>
    </main>
  );
}
