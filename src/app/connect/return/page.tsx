import Image from "next/image";
import Link from "next/link";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { ReturnAutoClose } from "@/components/ReturnAutoClose";

type ReturnPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function flattenSearchParams(params: Record<string, string | string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(params).flatMap(([key, value]) => {
      if (typeof value === "string") return [[key, value]];
      if (Array.isArray(value) && typeof value[0] === "string") return [[key, value[0]]];
      return [];
    }),
  );
}

export default async function ReturnPage({ searchParams }: ReturnPageProps) {
  const query = flattenSearchParams(await searchParams);

  return (
    <main className="subPage returnPage">
      <InteractiveBackground />
      <header className="simpleTopBar">
        <Link className="brandLockup" href="/" aria-label="Mirror home">
          <Image className="logoImage logoImageSmall" src="/CLEAR.png" width={50} height={50} alt="" aria-hidden="true" />
          <span>MIRROR</span>
        </Link>
      </header>

      <ReturnAutoClose query={query} />
    </main>
  );
}
