import Image from 'next/image';

export default function PaymentSuccess() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col gap-1 text-center">

        <Image
          src="/success.png"
          alt="Payment Success"
          width={210}
          height={210}
          priority
          className='max-w-[210px] mx-auto mb-20'
        />

        <h1 className="text-2xl font-bold text-center">
          Payment Success!
        </h1>

        <p>Do not refresh this page, go back to DCharge app and start to charge.</p>
      </div>
    </div>
  );
}
