import Image from "next/image";

export function Logo() {
  return (
    <div className="flex flex-col items-center">
      <Image
        src="/images/ummy-logo.png"
        alt="Ummy Logo"
        width={140}
        height={140}
      />
    </div>
  );
}