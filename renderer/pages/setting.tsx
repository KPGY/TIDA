import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Home } from 'lucide-react';

export default function NextPage() {
  return (
    <React.Fragment>
      <Head>
        <title>TIDA</title>
      </Head>
      <header className='flex p-2 justify-between'>
        <div className='text-gray-950'>글꼴 사이즈</div>
        <Link className='text-gray-950' href='/home'>
          <Home />
        </Link>
      </header>
      <Image
        src='/images/fake.jpeg'
        className='mx-auto mt-20'
        width={400}
        height={400}
        alt='가짜이미지'
      />
      <p className='text-center text-gray-950 text-5xl mt-10 font-bold'>
        아직 미구현⭐
      </p>
    </React.Fragment>
  );
}
