'use client';

import { useState, useEffect } from 'react';
import { Crimson_Text, Inter } from 'next/font/google';
import { LineChart, BarChart, RefreshCw, Clock, TrendingUp, TrendingDown, Calendar, AlertCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
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

export default function Dashboard() {
    const params = useParams();
    const router = useRouter();
    const { uid } = params;

    // State for user authentication and data
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);
    const [selectedStock, setSelectedStock] = useState(null);
    const { isAuthenticated, userType } = useAuth();

    // Add after state declarations
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        if (!loading && userType === 'company') {
            router.push('/company/dashboard');
        }
    }, [loading, isAuthenticated, userType, router]);

    // Mock data for clubs/companies
    const [stocks, setStocks] = useState([
        { id: 1, name: 'Mathsoc', symbol: 'MATH', value: 142.58, change: 2.35, changePercent: 1.68, open: 140.23, high: 143.15, low: 139.76, prev: 140.23 },
        { id: 2, name: 'Robotics', symbol: 'RBTC', value: 98.75, change: -1.25, changePercent: -1.25, open: 100.00, high: 100.50, low: 98.00, prev: 100.00 },
        { id: 3, name: 'Equinox', symbol: 'EQNX', value: 210.42, change: 5.18, changePercent: 2.52, open: 205.24, high: 212.00, low: 204.50, prev: 205.24 },
        { id: 4, name: 'Mudra', symbol: 'MDRA', value: 68.30, change: -0.92, changePercent: -1.33, open: 69.22, high: 69.80, low: 67.95, prev: 69.22 },
        { id: 5, name: 'Mechanics', symbol: 'MECH', value: 155.80, change: 1.24, changePercent: 0.80, open: 154.56, high: 156.70, low: 153.90, prev: 154.56 },
        { id: 6, name: 'Literati', symbol: 'LITR', value: 87.65, change: 2.10, changePercent: 2.45, open: 85.55, high: 88.20, low: 85.30, prev: 85.55 },
        { id: 7, name: 'Culinary', symbol: 'CULI', value: 114.22, change: -3.45, changePercent: -2.93, open: 117.67, high: 118.10, low: 113.80, prev: 117.67 },
        { id: 8, name: 'Photosoc', symbol: 'PHOT', value: 92.15, change: 1.85, changePercent: 2.05, open: 90.30, high: 92.80, low: 90.10, prev: 90.30 },
        { id: 9, name: 'Toastmaster', symbol: 'TOAS', value: 78.40, change: 0.55, changePercent: 0.71, open: 77.85, high: 79.10, low: 77.60, prev: 77.85 },
        { id: 10, name: 'Dance Club', symbol: 'DANC', value: 125.75, change: -2.18, changePercent: -1.70, open: 127.93, high: 128.50, low: 125.10, prev: 127.93 },
        { id: 11, name: 'Fleetfeet', symbol: 'FEET', value: 104.30, change: 2.75, changePercent: 2.71, open: 101.55, high: 105.20, low: 101.30, prev: 101.55 },
        { id: 12, name: 'Designathon', symbol: 'DSGN', value: 187.92, change: -1.36, changePercent: -0.72, open: 189.28, high: 190.15, low: 186.90, prev: 189.28 },
        { id: 13, name: 'Cybernetics', symbol: 'CYBR', value: 231.15, change: 7.42, changePercent: 3.32, open: 223.73, high: 232.50, low: 223.20, prev: 223.73 },
        { id: 14, name: 'Mun Club', symbol: 'MUNC', value: 64.88, change: -0.37, changePercent: -0.57, open: 65.25, high: 65.50, low: 64.30, prev: 65.25 },
        { id: 15, name: 'Chess Club', symbol: 'CHSS', value: 93.67, change: 1.28, changePercent: 1.39, open: 92.39, high: 94.20, low: 92.15, prev: 92.39 },
    ]);

    // Mock news data
    const [news, setNews] = useState([
        {
            id: 1,
            title: 'Market Overview: Cybernetics leads today\'s rally',
            content: 'Cybernetics stock surged over 3% today, leading the market in a day of mixed trading. Analysts attribute the rise to recent technical innovations.',
            date: '2025-03-11T09:30:00',
            source: 'MarketWatch',
            impact: 'high',
            relatedStocks: ['CYBR', 'MECH']
        },
        {
            id: 2,
            title: 'Culinary Club announces partnership, stock falls',
            content: 'Culinary Club shares dropped nearly 3% following the announcement of a partnership that investors fear may dilute focus.',
            date: '2025-03-11T10:15:00',
            source: 'StockNews',
            impact: 'medium',
            relatedStocks: ['CULI']
        },
        {
            id: 3,
            title: 'Club Market Report: Volatility expected to increase',
            content: 'Market analysts predict higher volatility in the coming week as clubs prepare to announce quarterly performance results.',
            date: '2025-03-11T08:45:00',
            source: 'FinanceDaily',
            impact: 'low',
            relatedStocks: []
        },
        {
            id: 4,
            title: 'Mathsoc and Fleetfeet show strong momentum',
            content: 'Both Mathsoc and Fleetfeet demonstrated solid growth today, with technical indicators suggesting continued upward movement.',
            date: '2025-03-11T11:20:00',
            source: 'TradingView',
            impact: 'medium',
            relatedStocks: ['MATH', 'FEET']
        },
        {
            id: 5,
            title: 'Market closing summary: Mixed results across sectors',
            content: 'The market closed with mixed results today, with technical clubs generally outperforming arts and cultural organizations.',
            date: '2025-03-10T16:00:00',
            source: 'MarketWatch',
            impact: 'low',
            relatedStocks: []
        }
    ]);

    // User authentication check
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                // No user is logged in, redirect to home
                router.push('/');
                return;
            }

            if (currentUser.uid !== uid) {
                // User is trying to access someone else's dashboard
                router.push(`/dashboard/${currentUser.uid}`);
                return;
            }

            setUser(currentUser);

            try {
                // Get user data from Firestore
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                } else {
                    setError('User data not found');
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Error loading user data');
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [uid, router]);

    // Handle stock selection
    const handleSelectStock = (stock) => {
        // Navigate to the company-specific page
        router.push(`/dashboard/${uid}/stocks/${stock.symbol}`);
    };

    // Format numbers with commas for thousands
    const formatNumber = (num) => {
        return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
    if (loading) {
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
                <Link href="/" className="px-6 py-2 bg-blue-900/60 hover:bg-blue-800 rounded-lg transition-all">
                    Return Home
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
                            Trading Dashboard
                        </h1>
                        <p className={`text-white/70 mt-1 ${inter.variable} font-inter`}>
                            Welcome back, {userData?.name || 'Trader'}
                        </p>
                    </div>

                    <div className="flex items-center mt-4 sm:mt-0">
                        <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/20 rounded-lg px-4 py-2 flex items-center mr-4">
                            <div className={`${inter.variable} font-inter text-white`}>
                                <div className="text-xs text-white/60">Portfolio Value</div>
                                <div className="text-lg font-medium">₹10,000.00</div>
                            </div>
                        </div>

                        <button className="flex items-center bg-blue-900/40 hover:bg-blue-800/60 text-white rounded-lg px-3 py-2 transition-all backdrop-blur-sm">
                            <RefreshCw size={16} className="mr-2" />
                            <span className={`${inter.variable} font-inter text-sm`}>Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Watchlist Section - Takes 1/3 width on large screens */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-900/30 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-lg">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h2 className={`text-xl text-white ${crimson.className}`}>Stock Watchlist</h2>
                            <div className="flex items-center">
                                <Clock size={14} className="text-white/60 mr-1" />
                                <span className={`text-xs text-white/60 ${inter.variable} font-inter`}>Live</span>
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-blue-900/50 scrollbar-track-transparent">
                            {stocks.map(stock => (
                                <div
                                    key={stock.id}
                                    className={`p-4 border-b border-white/5 hover:bg-blue-900/20 transition-colors cursor-pointer ${selectedStock?.id === stock.id ? 'bg-blue-900/30' : ''}`}
                                    onClick={() => handleSelectStock(stock)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className={`text-white font-medium ${crimson.className}`}>
                                                {stock.name} <span className="text-white/50 text-sm">{stock.symbol}</span>
                                            </h3>
                                        </div>
                                        <div className={`text-right ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            <div className="flex items-center justify-end">
                                                {stock.change >= 0 ?
                                                    <TrendingUp size={14} className="mr-1" /> :
                                                    <TrendingDown size={14} className="mr-1" />
                                                }
                                                <span className={`${inter.variable} font-inter`}>
                                                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                                                </span>
                                            </div>
                                            <span className={`text-xs ${inter.variable} font-inter`}>
                                                {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className={`flex items-center mt-2 ${inter.variable} font-inter text-sm justify-between`}>
                                        <div className="text-white font-medium">₹{formatNumber(stock.value)}</div>
                                        <div className="text-white/60">
                                            <span className="mr-2">O: {formatNumber(stock.open)}</span>
                                            <span className="mr-2">H: {formatNumber(stock.high)}</span>
                                            <span className="mr-2">L: {formatNumber(stock.low)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Section (Stock Details + News) - Takes 2/3 width */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stock Details Panel */}
                    <div className="bg-slate-900/30 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-lg">
                        {selectedStock ? (
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className={`text-2xl text-white ${crimson.className}`}>
                                            {selectedStock.name} <span className="text-white/50">{selectedStock.symbol}</span>
                                        </h2>
                                        <div className={`flex items-center mt-1 ${inter.variable} font-inter`}>
                                            <span className="text-2xl text-white font-semibold mr-3">
                                                ₹{formatNumber(selectedStock.value)}
                                            </span>
                                            <span className={`flex items-center ${selectedStock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {selectedStock.change >= 0 ?
                                                    <TrendingUp size={16} className="mr-1" /> :
                                                    <TrendingDown size={16} className="mr-1" />
                                                }
                                                <span>
                                                    {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)}
                                                    ({selectedStock.change >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%)
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex">
                                        <button className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg mr-2 transition-all">
                                            Buy
                                        </button>
                                        <button className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all">
                                            Sell
                                        </button>
                                    </div>
                                </div>

                                {/* Stock Stats */}
                                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 ${inter.variable} font-inter`}>
                                    <div className="bg-slate-900/40 rounded-lg p-3">
                                        <div className="text-xs text-white/50 mb-1">Open</div>
                                        <div className="text-white">₹{formatNumber(selectedStock.open)}</div>
                                    </div>
                                    <div className="bg-slate-900/40 rounded-lg p-3">
                                        <div className="text-xs text-white/50 mb-1">High</div>
                                        <div className="text-white">₹{formatNumber(selectedStock.high)}</div>
                                    </div>
                                    <div className="bg-slate-900/40 rounded-lg p-3">
                                        <div className="text-xs text-white/50 mb-1">Low</div>
                                        <div className="text-white">₹{formatNumber(selectedStock.low)}</div>
                                    </div>
                                    <div className="bg-slate-900/40 rounded-lg p-3">
                                        <div className="text-xs text-white/50 mb-1">Prev Close</div>
                                        <div className="text-white">₹{formatNumber(selectedStock.prev)}</div>
                                    </div>
                                </div>

                                {/* Mock Chart */}
                                <div className="bg-slate-900/40 rounded-lg p-4 h-64 flex items-center justify-center mb-4 border border-slate-700/30">
                                    <div className="text-center">
                                        <LineChart size={36} className="text-blue-500/60 mx-auto mb-2" />
                                        <div className={`text-white/60 ${inter.variable} font-inter text-sm`}>
                                            Interactive chart will appear here
                                        </div>
                                    </div>
                                </div>

                                {/* Related News */}

                                {/* Related News and Top Trades */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Related News - Left column */}
                                    <div>
                                        <h3 className={`text-white text-lg mb-3 ${crimson.className}`}>Related News</h3>
                                        {news.filter(item => !item.relatedStocks.length || item.relatedStocks.includes(selectedStock.symbol))
                                            .slice(0, 2)
                                            .map(item => (
                                                <div key={item.id} className="bg-slate-900/40 rounded-lg p-3 mb-2">
                                                    <h4 className={`text-sm text-white font-medium mb-1 ${inter.variable} font-inter`}>
                                                        {item.title}
                                                    </h4>
                                                    <div className="text-white/60 text-xs mb-1">
                                                        {item.source} • {formatDateTime(item.date)}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>

                                    {/* Top Trades - Right column */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className={`text-white text-lg ${crimson.className}`}>Top Trades</h3>
                                            <div className="flex space-x-2">
                                                <button className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-md">Buy</button>
                                                <button className="text-xs px-2 py-0.5 bg-slate-800/50 text-white/70 rounded-md">Sell</button>
                                            </div>
                                        </div>

                                        {/* Top Buy Table */}
                                        <div className="bg-slate-900/40 rounded-lg overflow-hidden mb-3">
                                            <div className={`text-xs text-white/70 grid grid-cols-3 px-3 py-2 border-b border-white/5 ${inter.variable} font-inter bg-slate-900/60`}>
                                                <div>Stock</div>
                                                <div className="text-right">Price</div>
                                                <div className="text-right">Volume</div>
                                            </div>
                                            <div className="max-h-[140px] overflow-y-auto scrollbar-thin">
                                                {stocks.slice(0, 5).map((stock) => (
                                                    <div
                                                        key={`buy-${stock.id}`}
                                                        className={`text-xs grid grid-cols-3 px-3 py-1.5 border-b border-white/5 hover:bg-blue-900/20 ${inter.variable} font-inter`}
                                                    >
                                                        <div className="text-white">{stock.symbol}</div>
                                                        <div className="text-right text-white">₹{formatNumber(stock.value)}</div>
                                                        <div className="text-right text-green-400">{Math.floor(Math.random() * 1000) + 100}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Top Sell Table */}
                                        <div className="bg-slate-900/40 rounded-lg overflow-hidden">
                                            <div className={`text-xs text-white/70 grid grid-cols-3 px-3 py-2 border-b border-white/5 ${inter.variable} font-inter bg-slate-900/60`}>
                                                <div>Stock</div>
                                                <div className="text-right">Price</div>
                                                <div className="text-right">Volume</div>
                                            </div>
                                            <div className="max-h-[140px] overflow-y-auto scrollbar-thin">
                                                {stocks.slice(5, 10).map((stock) => (
                                                    <div
                                                        key={`sell-${stock.id}`}
                                                        className={`text-xs grid grid-cols-3 px-3 py-1.5 border-b border-white/5 hover:bg-blue-900/20 ${inter.variable} font-inter`}
                                                    >
                                                        <div className="text-white">{stock.symbol}</div>
                                                        <div className="text-right text-white">₹{formatNumber(stock.value)}</div>
                                                        <div className="text-right text-red-400">{Math.floor(Math.random() * 1000) + 100}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-10 text-center">
                                <div className="mb-3">
                                    <TrendingUp size={36} className="text-blue-500/60 mx-auto" />
                                </div>
                                <h3 className={`text-xl text-white mb-2 ${crimson.className}`}>
                                    Select a stock to view details
                                </h3>
                                <p className={`text-white/60 text-sm ${inter.variable} font-inter`}>
                                    Click on any stock in the watchlist to see detailed information
                                </p>
                            </div>
                        )}
                    </div>

                    {/* News Section */}
                    <div className="bg-slate-900/30 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-lg">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h2 className={`text-xl text-white ${crimson.className}`}>Market News</h2>
                            <div className="flex items-center">
                                <Calendar size={14} className="text-white/60 mr-1" />
                                <span className={`text-xs text-white/60 ${inter.variable} font-inter`}>
                                    March 11, 2025
                                </span>
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            {news.map(item => (
                                <div
                                    key={item.id}
                                    className="border-b border-white/5 pb-4 last:border-0 last:pb-0"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`text-white font-medium ${inter.variable} font-inter`}>
                                            {item.title}
                                        </h3>
                                        <div className={`ml-2 px-2 py-0.5 text-xs rounded-full ${item.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                                            item.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {item.impact}
                                        </div>
                                    </div>

                                    <p className={`text-white/70 text-sm mb-2 ${inter.variable} font-inter`}>
                                        {item.content}
                                    </p>

                                    <div className="flex justify-between items-center text-xs text-white/50">
                                        <span>{item.source}</span>
                                        <span>{formatDateTime(item.date)}</span>
                                    </div>

                                    {item.relatedStocks.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {item.relatedStocks.map(symbol => (
                                                <span
                                                    key={symbol}
                                                    className="bg-blue-900/30 text-blue-300 text-xs px-2 py-0.5 rounded-full"
                                                >
                                                    ${symbol}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}