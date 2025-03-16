import Navbar from './Navbar';
import Footer from './Footer';
import PageLoader from './PageLoader';
import ContactHelp from './ContactHelp';
import BackgroundVideo from './BackgroundVideo';

export default function Lander({ children }) {
    return (
        <div className="min-h-screen flex flex-col relative">
            <PageLoader />
            <BackgroundVideo />
            <Navbar />
            <main className="flex-grow z-10">
                {children}
            </main>
            <Footer />
            <ContactHelp />
        </div>
    );
}