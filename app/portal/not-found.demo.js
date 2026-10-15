import Link from 'next/link';
export default function NotFound() { return <section className='kp-empty'><h1>Workspace page not found.</h1><p>Choose a section from the portal navigation.</p><Link href='/portal'>Return to workspace</Link></section>; }
