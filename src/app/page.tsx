import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-accent-400">
      <Image
        src="/homepage.jpg"
        alt="Dcharge Landing Page"
        width={1920}
        height={1080}
      />
    </div>
  );
}
