import Footer from './Footer';
import Navbar from './Navbar';

export default function Layout({ children, profile }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar profile={profile} />
      <main className="p-6 md:p-10 max-w-7xl mx-auto">
        {children}
      </main>
      <Footer />
    </div>
  );
}