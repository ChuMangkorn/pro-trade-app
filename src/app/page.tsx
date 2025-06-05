import { redirect } from 'next/navigation';
import Image from "next/image";

export default function Home() {
  redirect('/trade/BTCUSDT');
  
  // This part will not be rendered due to the redirect.
  // We can leave it as a fallback or remove it.
  return null;
}
