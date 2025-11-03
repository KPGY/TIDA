import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NextPage() {
  return (
    <React.Fragment>
      <Head>
        <title>TIDA</title>
      </Head>
      <main className='flex p-2 justify-between'>
        <div className='text-gray-950'>글꼴 사이즈</div>
        <Link className='text-gray-950' href='/home'>
          <Home />
        </Link>
      </main>
    </React.Fragment>
  );
}
