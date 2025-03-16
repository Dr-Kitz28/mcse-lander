'use client';

import { useState, useEffect } from 'react';
import { Crimson_Text, Inter } from 'next/font/google';
import { LineChart, BarChart, RefreshCw, Clock, TrendingUp, TrendingDown, Calendar, AlertCircle, ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../../../firebase';
import Link from 'next/link';
import { useRef, useCallback } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

// In your component, add this function before the return statement
// Update the StockChart component with this fixed implementation

// Replace the current StockChart component with this version

// Update the StockChart component with this fixed implementation for v5.0


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

// Update the generateMockData function in your StockChart component

const StockChart = ({ stockSymbol, stockChange }) => {
    const chartContainerRef = useRef();
    const chartInstanceRef = useRef(null);
    const [chartType, setChartType] = useState('area');

    // Implement the generateMockData function properly
    const generateMockData = useCallback(() => {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Start at beginning of day
        currentDate.setDate(currentDate.getDate() - 50); // Start 50 days ago

        const basePrice = Math.random() * 200 + 50; // Random base price between 50 and 250
        let lastPrice = basePrice;

        const ohlcData = [];
        const lineData = [];
        const volumeData = [];

        for (let i = 0; i < 50; i++) {
            // Create a new date object for each day
            const date = new Date(currentDate);
            date.setDate(date.getDate() + i);

            // Format time as YYYY-MM-DD string format which is more reliable
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const timeStr = `${year}-${month}-${day}`;

            // Generate realistic price movements
            const volatility = Math.random() * 3; // 0-3% volatility
            const changePercent = (Math.random() * volatility * 2) - volatility;
            const change = lastPrice * (changePercent / 100);

            const open = lastPrice;
            const close = open + change;
            lastPrice = close;

            // Make high/low somewhat realistic
            const highLowRange = Math.abs(open - close) * (1 + Math.random());
            const high = Math.max(open, close) + (highLowRange / 2);
            const low = Math.min(open, close) - (highLowRange / 2);

            // Generate volume
            const volume = Math.floor(Math.random() * 1000000) + 100000;

            ohlcData.push({
                time: timeStr, // Using string format instead of timestamp
                open,
                high,
                low,
                close
            });

            lineData.push({
                time: timeStr, // Using string format instead of timestamp
                value: close
            });

            volumeData.push({
                time: timeStr, // Using string format instead of timestamp
                value: volume
            });
        }

        return { ohlcData, lineData, volumeData };
    }, []);

    useEffect(() => {
        console.log("Chart useEffect running with type:", chartType);

        // Helper function to clean up any existing chart
        const cleanupChart = () => {
            console.log("Cleaning up chart instance");
            if (chartInstanceRef.current) {
                try {
                    chartInstanceRef.current.remove();
                } catch (e) {
                    console.error("Error removing chart:", e);
                }
                chartInstanceRef.current = null;
            }

            // Extra cleanup to prevent duplicate charts
            if (chartContainerRef.current) {
                while (chartContainerRef.current.firstChild) {
                    chartContainerRef.current.removeChild(chartContainerRef.current.firstChild);
                }
            }
        };

        // Clean up first
        cleanupChart();

        // Exit if container is not available
        if (!chartContainerRef.current) {
            console.log("Chart container ref not available");
            return;
        }

        const handleResize = () => {
            if (chartInstanceRef.current && chartContainerRef.current) {
                const width = chartContainerRef.current.clientWidth;
                const height = chartContainerRef.current.clientHeight;
                chartInstanceRef.current.resize(width, height);
            }
        };

        // Fix v5.0 API usage and prevent duplicate charts
        async function setupChart() {
            try {
                console.log(`Setting up ${chartType} chart...`);
                // Generate mock data
                const { ohlcData, lineData, volumeData } = generateMockData();

                // Import the library dynamically to avoid SSR issues
                const lwc = await import('lightweight-charts');

                console.log("Creating chart instance...");
                // Create chart with improved container handling
                const chartInstance = lwc.createChart(chartContainerRef.current, {
                    layout: {
                        background: { type: 'solid', color: 'rgba(15, 23, 42, 0.0)' },
                        textColor: 'rgba(255, 255, 255, 0.7)',
                        fontSize: 12,
                        fontFamily: 'Inter, sans-serif',
                    },
                    grid: {
                        vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    },
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight - 10,
                    timeScale: {
                        timeVisible: true,
                        secondsVisible: false,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        rightOffset: 5,
                        leftOffset: 5,
                    },
                    rightPriceScale: {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        entireTextOnly: true,
                        scaleMargins: {
                            top: 0.1,
                            bottom: 0.2,
                        },
                    },
                });

                // Store the chart instance in our ref
                chartInstanceRef.current = chartInstance;
                console.log("Chart instance created successfully");

                try {
                    // Create chart based on selected type
                    switch (chartType) {
                        case 'candle':
                            console.log("Adding candlestick series...");
                            const candleSeries = chartInstance.addSeries(lwc.CandlestickSeries, {
                                upColor: 'rgba(74, 222, 128, 0.8)',
                                downColor: 'rgba(248, 113, 113, 0.8)',
                                borderUpColor: 'rgba(74, 222, 128, 0.8)',
                                borderDownColor: 'rgba(248, 113, 113, 0.8)',
                                wickUpColor: 'rgba(74, 222, 128, 0.8)',
                                wickDownColor: 'rgba(248, 113, 113, 0.8)',
                                lastValueVisible: false,
                            });
                            candleSeries.setData(ohlcData);

                            // Add volume histogram below
                            try {
                                const volumeSeries = chartInstance.addSeries(lwc.HistogramSeries, {
                                    color: 'rgba(76, 175, 80, 0.3)',
                                    priceFormat: {
                                        type: 'volume',
                                    },
                                }, {
                                    priceScaleId: '',
                                    scaleMargins: {
                                        top: 0.8,
                                        bottom: 0,
                                    },
                                });
                                volumeSeries.setData(volumeData);
                            } catch (e) {
                                console.log("Couldn't add volume:", e);
                            }
                            break;

                        case 'line':
                            console.log("Adding line series...");
                            const lineSeries = chartInstance.addSeries(lwc.LineSeries, {
                                color: 'rgba(59, 130, 246, 0.8)',
                                lineWidth: 2,
                                lastValueVisible: false,
                                priceLineVisible: false,
                            });
                            lineSeries.setData(lineData);
                            break;

                        case 'area':
                        default:
                            console.log("Adding area series...");
                            const areaSeries = chartInstance.addSeries(lwc.AreaSeries, {
                                lineColor: 'rgba(59, 130, 246, 0.8)',
                                topColor: 'rgba(59, 130, 246, 0.4)',
                                bottomColor: 'rgba(59, 130, 246, 0.0)',
                                lineWidth: 2,
                                lastValueVisible: false,
                                priceLineVisible: false,
                            });
                            areaSeries.setData(lineData);
                    }

                    // Safely fit content
                    try {
                        chartInstance.timeScale().fitContent();
                        console.log("Content fitted successfully");
                    } catch (error) {
                        console.log("Error fitting content:", error);
                    }

                } catch (error) {
                    console.error("Error setting up chart series:", error);

                    // Fallback to simple line series if any error occurs
                    try {
                        console.log("Trying fallback line series...");
                        const lineSeries = chartInstance.addSeries(lwc.LineSeries, {
                            color: 'rgba(59, 130, 246, 0.8)',
                            lineWidth: 2,
                        });

                        lineSeries.setData(lineData);
                        chartInstance.timeScale().fitContent();
                        console.log("Fallback line series added successfully");
                    } catch (fallbackError) {
                        console.error("All chart creation attempts failed:", fallbackError);
                    }
                }

                window.addEventListener('resize', handleResize);

            } catch (err) {
                console.error("Error creating chart:", err);
            }
        }

        // Use a flag to prevent multiple chart creations
        let isChartCreated = false;

        // Create chart with slight delay to ensure DOM is ready
        const chartCreationTimeout = setTimeout(() => {
            if (!isChartCreated) {
                isChartCreated = true;
                setupChart();
            }
        }, 100);

        // Cleanup function
        return () => {
            console.log("Chart useEffect cleanup running");
            clearTimeout(chartCreationTimeout);
            window.removeEventListener('resize', handleResize);
            cleanupChart();
        };
    }, [generateMockData, chartType]); // Added chartType as dependency

    return (
        <div className="bg-slate-900/40 rounded-lg p-3 h-[350px] border border-slate-700/30 flex flex-col">
            <div className="flex justify-between items-center mb-2 px-2">
                <div className="flex items-center">
                    <span className={`text-sm mr-2 text-white/70 ${inter.variable} font-inter`}>{stockSymbol}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${stockChange >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {stockChange >= 0 ? '+' : ''}{stockChange.toFixed(2)}%
                    </span>
                </div>
                {/* Replace time buttons with chart type selector */}
                <div className="flex space-x-2">
                    <button
                        onClick={() => setChartType('area')}
                        className={`text-xs px-2 py-0.5 rounded-md ${chartType === 'area'
                            ? 'bg-blue-600/30 text-blue-300'
                            : 'bg-blue-900/40 text-white/70'}`}
                    >
                        Area
                    </button>
                    <button
                        onClick={() => setChartType('line')}
                        className={`text-xs px-2 py-0.5 rounded-md ${chartType === 'line'
                            ? 'bg-blue-600/30 text-blue-300'
                            : 'bg-blue-900/40 text-white/70'}`}
                    >
                        Line
                    </button>
                    <button
                        onClick={() => setChartType('candle')}
                        className={`text-xs px-2 py-0.5 rounded-md ${chartType === 'candle'
                            ? 'bg-blue-600/30 text-blue-300'
                            : 'bg-blue-900/40 text-white/70'}`}
                    >
                        Candles
                    </button>
                </div>
            </div>
            <div
                ref={chartContainerRef}
                id="stock-chart-container"
                className="flex-grow relative"
                style={{ minHeight: '280px' }}  // Ensure minimum height for chart
            />
        </div>
    );
};
export default function StockDetails() {
    const params = useParams();
    const router = useRouter();
    const { uid, symbol } = params;

    // State for user authentication and data
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);
    const [stock, setStock] = useState(null);
    const [tradeType, setTradeType] = useState('buy'); // 'buy' or 'sell'
    const [quantity, setQuantity] = useState(1);
    const [pricePerStock, setPricePerStock] = useState('');

    // Mock data for clubs/companies (in a real app, this would be fetched from an API)
    const [allStocks, setAllStocks] = useState([
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

    // User authentication check and fetch stock data
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                // No user is logged in, redirect to home
                router.push('/');
                return;
            }

            if (currentUser.uid !== uid) {
                // User is trying to access someone else's dashboard
                router.push(`/dashboard/${currentUser.uid}/stocks/${symbol}`);
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

                // Find the stock by symbol
                const foundStock = allStocks.find(s => s.symbol === symbol);
                if (foundStock) {
                    setStock(foundStock);
                } else {
                    setError('Stock not found');
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Error loading data');
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [uid, symbol, router]);

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
    if (error || !stock) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-white">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className={`text-2xl mb-2 ${crimson.className}`}>Error Loading Stock Details</h2>
                <p className="text-white/70 mb-6">{error || "Stock not found"}</p>
                <Link href={`/dashboard/${uid}`} className="px-6 py-2 bg-blue-900/60 hover:bg-blue-800 rounded-lg transition-all">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    // Get related news
    const relatedNews = news.filter(item => !item.relatedStocks.length || item.relatedStocks.includes(stock.symbol));

    return (
        <div className="min-h-screen pt-8 pb-16 px-4 sm:px-6 lg:px-8 z-10">
            {/* Back to Dashboard Button */}
            <div className="max-w-7xl mx-auto mb-8">
                <Link
                    href={`/dashboard/${uid}`}
                    className="flex items-center text-white/70 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    <span className={`${inter.variable} font-inter`}>Back to Dashboard</span>
                </Link>

                {/* Stock Header */}
                <div className="flex flex-wrap items-center justify-between">
                    <div>
                        <h1 className={`text-3xl sm:text-4xl text-white font-bold ${crimson.className} flex items-center`}>
                            {stock.name}
                            <span className="text-white/50 text-2xl ml-2">{stock.symbol}</span>
                        </h1>
                        <div className={`flex items-center mt-2 ${inter.variable} font-inter`}>
                            <span className="text-2xl text-white font-semibold mr-3">
                                ₹{formatNumber(stock.value)}
                            </span>
                            <span className={`flex items-center ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {stock.change >= 0 ?
                                    <TrendingUp size={18} className="mr-1" /> :
                                    <TrendingDown size={18} className="mr-1" />
                                }
                                <span>
                                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                                    ({stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                                </span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center mt-4 sm:mt-0">
                        <button className="px-5 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg mr-3 transition-all">
                            Buy
                        </button>
                        <button className="px-5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all">
                            Sell
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Stock Info & Chart */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stock Stats */}
                    <div className="bg-slate-900/30 backdrop-blur-sm border border-white/10 rounded-lg p-6 shadow-lg">
                        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6 ${inter.variable} font-inter`}>
                            <div className="bg-slate-900/40 rounded-lg p-4">
                                <div className="text-xs text-white/50 mb-1">Open</div>
                                <div className="text-white text-lg">₹{formatNumber(stock.open)}</div>
                            </div>
                            <div className="bg-slate-900/40 rounded-lg p-4">
                                <div className="text-xs text-white/50 mb-1">High</div>
                                <div className="text-white text-lg">₹{formatNumber(stock.high)}</div>
                            </div>
                            <div className="bg-slate-900/40 rounded-lg p-4">
                                <div className="text-xs text-white/50 mb-1">Low</div>
                                <div className="text-white text-lg">₹{formatNumber(stock.low)}</div>
                            </div>
                            <div className="bg-slate-900/40 rounded-lg p-4">
                                <div className="text-xs text-white/50 mb-1">Prev Close</div>
                                <div className="text-white text-lg">₹{formatNumber(stock.prev)}</div>
                            </div>
                        </div>

                        {/* Large Chart */}
                        <StockChart
                            stockSymbol={stock.symbol}
                            stockChange={stock.changePercent}
                        />
                    </div>

                    {/* Related News */}
                    <div className="bg-slate-900/30 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-lg">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h2 className={`text-xl text-white ${crimson.className}`}>Related News</h2>
                            <div className="flex items-center">
                                <Calendar size={14} className="text-white/60 mr-1" />
                                <span className={`text-xs text-white/60 ${inter.variable} font-inter`}>
                                    March 12, 2025
                                </span>
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            {relatedNews.length > 0 ? (
                                relatedNews.map(item => (
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
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6">
                                    <p className={`text-white/60 ${inter.variable} font-inter`}>
                                        No news related to this stock
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Trade Info & History */}
                <div className="space-y-6">
                    <div className="bg-slate-900/30 backdrop-blur-sm border border-white/10 rounded-lg p-5 shadow-lg">
                        <h2 className={`text-xl text-white mb-4 ${crimson.className}`}>Trade {stock.symbol}</h2>

                        <div className="flex w-full mb-4">
                            <button
                                onClick={() => setTradeType('buy')}
                                className={`w-1/2 py-2 ${tradeType === 'buy'
                                        ? 'bg-green-500/30 text-green-400 font-medium'
                                        : 'bg-green-500/10 text-green-400/70 hover:bg-green-500/20'
                                    } rounded-l-lg transition-all`}
                            >
                                Buy
                            </button>
                            <button
                                onClick={() => setTradeType('sell')}
                                className={`w-1/2 py-2 ${tradeType === 'sell'
                                        ? 'bg-red-500/30 text-red-400 font-medium'
                                        : 'bg-red-500/10 text-red-400/70 hover:bg-red-500/20'
                                    } rounded-r-lg transition-all`}
                            >
                                Sell
                            </button>
                        </div>

                        <div className={`space-y-4 ${inter.variable} font-inter`}>
                            {/* Quantity input */}
                            <div>
                                <label className="text-white/70 text-sm block mb-1">Quantity</label>
                                <div className="flex">
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full bg-slate-800/60 border border-white/20 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Number of stocks"
                                    />
                                </div>
                            </div>

                            {/* Price per stock input */}
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-white/70 text-sm">Price per stock</label>
                                    <span className="text-xs text-white/60">
                                        Market price: ₹{formatNumber(stock.value)}
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-white/60">₹</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={pricePerStock}
                                        onChange={(e) => setPricePerStock(e.target.value)}
                                        className="w-full bg-slate-800/60 border border-white/20 rounded-md py-2 pl-7 pr-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder={`${tradeType === 'buy' ? 'Bid' : 'Ask'} price`}
                                    />
                                </div>

                                {/* Price suggestion buttons */}
                                <div className="flex space-x-2 mt-1">
                                    <button
                                        onClick={() => setPricePerStock((stock.value * 0.99).toFixed(2))}
                                        className="text-xs px-2 py-1 bg-slate-800/40 hover:bg-slate-700/40 text-white/70 rounded-md transition-all">
                                        -1%
                                    </button>
                                    <button
                                        onClick={() => setPricePerStock(stock.value.toFixed(2))}
                                        className="text-xs px-2 py-1 bg-slate-800/40 hover:bg-slate-700/40 text-white/70 rounded-md transition-all">
                                        Market
                                    </button>
                                    <button
                                        onClick={() => setPricePerStock((stock.value * 1.01).toFixed(2))}
                                        className="text-xs px-2 py-1 bg-slate-800/40 hover:bg-slate-700/40 text-white/70 rounded-md transition-all">
                                        +1%
                                    </button>
                                </div>
                            </div>

                            {/* Total calculation */}
                            <div className="pt-2">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-white/70">Total Cost</span>
                                    <span className="text-white">
                                        ₹{formatNumber(pricePerStock && quantity ? parseFloat(pricePerStock) * quantity : 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/60">Available Balance</span>
                                    <span className="text-white/60">₹10,000.00</span>
                                </div>
                            </div>
                        </div>

                        <button
                            className={`w-full py-3 mt-6 rounded-lg transition-all backdrop-blur-sm text-white ${tradeType === 'buy'
                                    ? 'bg-green-600/40 hover:bg-green-700/40'
                                    : 'bg-red-600/40 hover:bg-red-700/40'
                                }`}
                        >
                            {tradeType === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
                        </button>
                    </div>

                    {/* Top Trades */}
                    {/* Top Trades */}
                    <div className="bg-slate-900/30 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-lg">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h2 className={`text-xl text-white ${crimson.className}`}>Top Trades for {stock.symbol}</h2>
                            <div className="flex items-center">
                                <Clock size={14} className="text-white/60 mr-1" />
                                <span className={`text-xs text-white/60 ${inter.variable} font-inter`}>
                                    Live
                                </span>
                            </div>
                        </div>

                        <div className="p-4">
                            {/* Buy and Sell trades in a single table with improved spacing */}
                            <div className="bg-slate-900/40 rounded-lg overflow-hidden">
                                <div className={`text-xs text-white/70 grid grid-cols-5 px-3 py-2 border-b border-white/5 ${inter.variable} font-inter bg-slate-900/60`}>
                                    <div className="text-green-400">Buy Price</div>
                                    <div className="text-right text-green-400">Volume</div>
                                    {/* Empty column for spacing */}
                                    <div className="border-l border-slate-700/30"></div>
                                    <div className="text-red-400 pl-2">Sell Price</div>
                                    <div className="text-right text-red-400">Volume</div>
                                </div>
                                <div className="max-h-[250px] overflow-y-auto scrollbar-thin">
                                    {/* Generate 10 rows of mock trade data */}
                                    {[...Array(10)].map((_, i) => {
                                        // Generate realistic trade prices based on current stock price
                                        const buyPrice = stock.value * (1 - (Math.random() * 0.015));
                                        const sellPrice = stock.value * (1 + (Math.random() * 0.015));
                                        // Generate realistic volumes that are higher for prices closer to market price
                                        const buyVolume = Math.floor(Math.random() * 1000) + 100;
                                        const sellVolume = Math.floor(Math.random() * 1000) + 100;

                                        return (
                                            <div
                                                key={`trade-${i}`}
                                                className={`text-xs grid grid-cols-5 px-3 py-2 border-b border-white/5 hover:bg-blue-900/20 ${inter.variable} font-inter ${i === 0 ? 'bg-blue-900/30' : ''}`}
                                            >
                                                <div className="text-white">₹{formatNumber(buyPrice)}</div>
                                                <div className="text-right text-green-400">{buyVolume}</div>
                                                {/* Empty column with divider for spacing */}
                                                <div className="border-l border-slate-700/30"></div>
                                                <div className="text-white pl-2">₹{formatNumber(sellPrice)}</div>
                                                <div className="text-right text-red-400">{sellVolume}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Order Book Summary - keep as is */}
                            <div className="mt-4 px-2">
                                <div className="flex justify-between text-xs text-white/60 mb-2">
                                    <span className={`${inter.variable} font-inter`}>Total Buy Volume</span>
                                    <span className={`${inter.variable} font-inter text-green-400`}>
                                        {Math.floor(Math.random() * 50000) + 10000}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-white/60">
                                    <span className={`${inter.variable} font-inter`}>Total Sell Volume</span>
                                    <span className={`${inter.variable} font-inter text-red-400`}>
                                        {Math.floor(Math.random() * 50000) + 10000}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trade History (Optional, could be added) */}
                </div>
            </div>
        </div>
    );
}