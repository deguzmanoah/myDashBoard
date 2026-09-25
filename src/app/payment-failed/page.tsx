import Image from 'next/image';

export default function PaymentFailed() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col gap-1 text-center">

        <Image
          src="/icons/icon-close-circle-solid.svg"
          alt="Payment Failed"
          width={180}
          height={180}
          priority
          className='max-w-[210px] mx-auto mb-16'
        />

        <h1 className="text-2xl font-bold text-center">
          Payment Unsuccessful
        </h1>

        <p>Please retry or contact support</p>
      </div>
    </div>
  );
}
