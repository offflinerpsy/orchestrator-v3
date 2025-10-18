import { HeaderBlock0 } from './_components/block-0';
import { HeaderBlock1 } from './_components/block-1';
import { HeaderBlock2 } from './_components/block-2';

export default function HeaderPage() {
  return (
    <main className="tilda-page" data-tilda-slug="header">
      <HeaderBlock0 />
      <HeaderBlock1 />
      <HeaderBlock2 />
    </main>
  );
}

export const metadata = {
  title: 'Header',
  description: 'Imported from Tilda: header',
};