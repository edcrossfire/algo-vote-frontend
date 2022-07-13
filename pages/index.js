import Head from 'next/head';
import App from "../components/App";

export default function Home() {
  return (
    <div className=" bg-slate-700 pt-3">
      <Head>
        <title>Algo Vote</title>
      </Head>
      <App />
    </div>
  )
}
