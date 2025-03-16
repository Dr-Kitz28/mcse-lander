'use client';

import { useState, useEffect } from 'react';
import { Crimson_Text, Inter } from 'next/font/google';
import {
    Newspaper, Send, List, ArrowUpRight, Clock, Calendar, Edit, Trash2,
    CheckCircle, AlertCircle, XCircle, BarChart4, FileText
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, addDoc, query, where, orderBy, getDocs, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../../contexts/AuthContext';

// Load fonts
const crimson = Crimson_Text({
    subsets: ['latin'],
    weight: ['400', '600', '700'],
    variable: '--font-crimson',
});

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

export default function CompanyDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('publish');
    const [loading, setLoading] = useState(true);
    const [companyData, setCompanyData] = useState(null);
    const [error, setError] = useState(null);

    // News publishing form state
    const [newsTitle, setNewsTitle] = useState('');
    const [newsContent, setNewsContent] = useState('');
    const [newsImpact, setNewsImpact] = useState('low');
    const [publishLoading, setPublishLoading] = useState(false);
    const [publishSuccess, setPublishSuccess] = useState(false);

    // News listing state
    const [companyNews, setCompanyNews] = useState([]);
    const [newsLoading, setNewsLoading] = useState(false);

    // Stats state
    const [stockValue, setStockValue] = useState(0);
    const [stockChange, setStockChange] = useState(0);
    const [totalTrades, setTotalTrades] = useState(0);
    const [newsCount, setNewsCount] = useState(0);

    // Auth protection
    const { isAuthenticated, isCompany, loading: authLoading, currentUser } = useAuth();

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/company/login');
            return;
        }

        if (!authLoading && !isCompany) {
            router.push('/login');
            return;
        }
    }, [authLoading, isAuthenticated, isCompany, router]);

    // Fetch company data
    useEffect(() => {
        const fetchCompanyData = async () => {
            if (!currentUser) return;

            try {
                const companyDoc = await getDoc(doc(db, 'companies', currentUser.uid));
                if (companyDoc.exists()) {
                    setCompanyData(companyDoc.data());

                    // Set mock stock data
                    setStockValue((Math.random() * 100 + 50).toFixed(2));
                    setStockChange(((Math.random() * 6) - 3).toFixed(2));
                    setTotalTrades(Math.floor(Math.random() * 1000 + 300));
                } else {
                    setError('Company data not found');
                }

                // Fetch company news
                await fetchCompanyNews(currentUser.uid);
            } catch (err) {
                console.error('Error fetching company data:', err);
                setError('Error loading company data');
            } finally {
                setLoading(false);
            }
        };

        fetchCompanyData();
    }, [currentUser]);

    const handlePublishNews = async (e) => {
        e.preventDefault();
        setPublishLoading(true);
        setPublishSuccess(false);
        setError(null); // Clear any previous errors

        try {
            // Get the current user
            const user = auth.currentUser;
            if (!user) {
                throw new Error('Not authenticated');
            }

            console.log("Publishing with user ID:", user.uid);

            const newsData = {
                title: newsTitle,
                content: newsContent,
                impact: newsImpact,
                companyId: user.uid,  // Make sure companyId is set correctly
                companyName: companyData.companyName,
                symbol: companyData.symbol,
                timestamp: serverTimestamp(),
                status: 'published',  // Ensure this is set
                date: new Date().toISOString(),
                views: 0  // Initialize with 0 views
            };

            console.log("News data:", JSON.stringify(newsData));

            // Use the company's UID as part of the path for better organization
            // Instead of adding directly to 'news' collection
            const docRef = await addDoc(collection(db, 'news'), newsData);

            console.log("Document written with ID: ", docRef.id);

            // Reset form
            setNewsTitle('');
            setNewsContent('');
            setNewsImpact('low');
            setPublishSuccess(true);

            // Refresh news list
            await fetchCompanyNews(user.uid);

            // Show success for 3 seconds
            setTimeout(() => {
                setPublishSuccess(false);
            }, 3000);
        } catch (err) {
            console.error('Error publishing news:', err);
            setError(`Failed to publish news: ${err.message}`);
        } finally {
            setPublishLoading(false);
        }
    };

    // Update your fetchCompanyNews function as well:
    const fetchCompanyNews = async (companyId) => {
        setNewsLoading(true);
        try {
            console.log("Fetching news for company ID:", companyId);

            const newsQuery = query(
                collection(db, 'news'),
                where('companyId', '==', companyId),
                orderBy('timestamp', 'desc')
            );

            const newsSnapshot = await getDocs(newsQuery);
            console.log("News query returned:", newsSnapshot.size, "items");

            const newsList = [];

            newsSnapshot.forEach((doc) => {
                newsList.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            setCompanyNews(newsList);
            setNewsCount(newsList.length);
        } catch (err) {
            console.error('Error fetching news:', err);
            setError(`Failed to fetch news: ${err.message}`);
        } finally {
            setNewsLoading(false);
        }
    };

    // Delete news
    const handleDeleteNews = async (newsId) => {
        if (!confirm('Are you sure you want to delete this news item?')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'news', newsId));
            // Refresh news list
            await fetchCompanyNews(currentUser.uid);
        } catch (err) {
            console.error('Error deleting news:', err);
            setError('Failed to delete news item.');
        }
    };

    // Format date-time
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
    };

    // Loading state
    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className={`text-2xl mb-2 ${crimson.className}`}>Error Loading Dashboard</h2>
                <p className="text-white/70 mb-6">{error}</p>
                <Link href="/company/login" className="px-6 py-2 bg-blue-900/60 hover:bg-blue-800 rounded-lg transition-all">
                    Return to Login
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8 z-10">
            {/* Dashboard Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex flex-wrap items-center justify-between">
                    <div>
                        <h1 className={`text-3xl sm:text-4xl text-white font-bold ${crimson.className}`}>
                            Company Dashboard
                        </h1>
                        <p className={`text-white/70 mt-1 ${inter.variable} font-inter`}>
                            {companyData?.companyName} <span className="text-blue-400">${companyData?.symbol}</span>
                        </p>
                    </div>

                    <div className="flex items-center mt-4 sm:mt-0">
                        <div className={`bg-${Number(stockChange) >= 0 ? 'green' : 'red'}-900/20 backdrop-blur-sm border border-${Number(stockChange) >= 0 ? 'green' : 'red'}-500/20 rounded-lg px-4 py-2 flex items-center`}>
                            <div className={`${inter.variable} font-inter text-white`}>
                                <div className="text-xs text-white/60">Current Stock Value</div>
                                <div className="text-lg font-medium flex items-center">
                                    ₹{stockValue}
                                    <span className={`ml-2 text-sm ${Number(stockChange) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {Number(stockChange) >= 0 ? '+' : ''}{stockChange}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="flex border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('publish')}
                        className={`px-5 py-3 flex items-center transition-colors relative ${activeTab === 'publish' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
                    >
                        <Send size={18} className="mr-2" />
                        <span className={`${crimson.className}`}>Publish News</span>
                        {activeTab === 'publish' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400"></span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('news')}
                        className={`px-5 py-3 flex items-center transition-colors relative ${activeTab === 'news' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
                    >
                        <FileText size={18} className="mr-2" />
                        <span className={`${crimson.className}`}>My News</span>
                        {activeTab === 'news' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400"></span>
                        )}
                    </button>
                </div>
                {error && (
                    <div className="mt-4">
                        <div className="bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-md flex items-center">
                            <AlertCircle size={20} className="mr-2" />
                            {error}
                        </div>
                    </div>
                )}
            </div>



            {/* Main Content Based on Active Tab */}
            <div className="max-w-7xl mx-auto">

                {/* Publish News Tab */}
                {activeTab === 'publish' && (
                    <div className="bg-slate-900/30 backdrop-blur-sm border border-white/10 rounded-lg p-6 shadow-lg">
                        <h2 className={`text-2xl text-white mb-6 ${crimson.className}`}>Publish Company News</h2>

                        {publishSuccess && (
                            <div className="bg-green-900/30 border border-green-500/30 text-green-400 px-4 py-3 rounded-md flex items-center mb-6">
                                <CheckCircle size={20} className="mr-2" />
                                News published successfully!
                            </div>
                        )}

                        <form onSubmit={handlePublishNews} className={`space-y-6 ${inter.variable} font-inter`}>
                            <div>
                                <label className="block text-white mb-2">News Title</label>
                                <input
                                    type="text"
                                    value={newsTitle}
                                    onChange={(e) => setNewsTitle(e.target.value)}
                                    className="w-full bg-slate-800/60 border border-white/20 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Enter news title"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-white mb-2">Content</label>
                                <textarea
                                    value={newsContent}
                                    onChange={(e) => setNewsContent(e.target.value)}
                                    className="w-full bg-slate-800/60 border border-white/20 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Enter news content"
                                    rows={6}
                                    required
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-white mb-2">Impact Level</label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="impact"
                                            value="low"
                                            checked={newsImpact === 'low'}
                                            onChange={() => setNewsImpact('low')}
                                            className="mr-2"
                                        />
                                        <span className="text-blue-400">Low</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="impact"
                                            value="medium"
                                            checked={newsImpact === 'medium'}
                                            onChange={() => setNewsImpact('medium')}
                                            className="mr-2"
                                        />
                                        <span className="text-yellow-400">Medium</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="impact"
                                            value="high"
                                            checked={newsImpact === 'high'}
                                            onChange={() => setNewsImpact('high')}
                                            className="mr-2"
                                        />
                                        <span className="text-red-400">High</span>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={publishLoading}
                                className={`py-3 px-6 rounded-lg transition-all backdrop-blur-sm text-white flex items-center ${publishLoading ? 'bg-blue-600/30 cursor-not-allowed' : 'bg-blue-600/40 hover:bg-blue-500/40'}`}
                            >
                                {publishLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                                        Publishing...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} className="mr-2" />
                                        Publish News
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* News History Tab */}
                {activeTab === 'news' && (
                    <div className="bg-slate-900/30 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h2 className={`text-xl text-white ${crimson.className}`}>My Published News</h2>
                            <div className="flex items-center">
                                <Calendar size={14} className="text-white/60 mr-1" />
                                <span className={`text-xs text-white/60 ${inter.variable} font-inter`}>
                                    All Time
                                </span>
                            </div>
                        </div>

                        {newsLoading ? (
                            <div className="py-16 flex justify-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : companyNews.length > 0 ? (
                            <div className="divide-y divide-white/5">
                                {companyNews.map(item => (
                                    <div key={item.id} className="p-4 hover:bg-white/5">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={`text-white font-medium ${inter.variable} font-inter`}>
                                                {item.title}
                                            </h3>
                                            <div className="flex space-x-2">
                                                <div className={`px-2 py-0.5 text-xs rounded-full ${item.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                                                    item.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {item.impact}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteNews(item.id)}
                                                    className="text-red-400 hover:text-red-300"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <p className={`text-white/70 text-sm mb-2 ${inter.variable} font-inter`}>
                                            {item.content}
                                        </p>

                                        <div className="flex justify-between items-center text-xs text-white/50">
                                            <div className="flex items-center">
                                                <Clock size={12} className="mr-1" />
                                                <span>{formatDateTime(item.date)}</span>
                                            </div>
                                            <span className="bg-green-900/30 text-green-400 px-2 py-0.5 rounded">Published</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 text-center">
                                <FileText size={36} className="text-white/20 mx-auto mb-3" />
                                <p className={`text-lg text-white ${crimson.className}`}>No news published yet</p>
                                <p className={`text-white/60 text-sm ${inter.variable} font-inter mt-1 mb-4`}>
                                    You haven't published any news items
                                </p>
                                <button
                                    onClick={() => setActiveTab('publish')}
                                    className="px-4 py-2 bg-blue-600/40 hover:bg-blue-500/40 text-white rounded-lg transition-all"
                                >
                                    Create Your First News
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}