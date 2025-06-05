import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/trade/BTCUSDT');
  
  // This part will not be rendered due to the redirect.
  // We can leave it as a fallback or remove it.
  return null;
}