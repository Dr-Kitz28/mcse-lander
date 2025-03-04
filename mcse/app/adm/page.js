'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  
  
  // Admin logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };
  
  // Fetch users based on payment status
  // Update your fetchUsers function
// Modified fetchUsers function to handle missing index
const fetchUsers = async (status = 'pending') => {
    setLoading(true);
    setActiveTab(status);
    setError(null); 
    
    try {
      // Ensure user is authenticated before proceeding
      if (!auth.currentUser) {
        console.error("No authenticated user");
        setError('Authentication error. Please log in again.');
        setLoading(false);
        return;
      }
      
      console.log("Current user:", auth.currentUser?.email);
      console.log("Fetching users with status:", status);
      
      let usersList = [];
      
      try {
        // First try with basic query (no ordering) which should require fewer indexes
        const basicQuery = query(
          collection(db, 'users'), 
          where('paymentStatus', '==', status)
        );
        
        const querySnapshot = await getDocs(basicQuery);
        console.log("Query executed, doc count:", querySnapshot.size);
        
        querySnapshot.forEach((doc) => {
          usersList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Sort the results in memory instead of using orderBy
        usersList.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt) - new Date(a.createdAt); // Descending order
          }
          return 0;
        });
        
      } catch (err) {
        console.error("Query error:", err.code, err.message);
        
        if (err.code === 'permission-denied') {
          throw new Error('Access denied. Your account does not have admin permissions.');
        } else {
          throw err;
        }
      }
      
      setUsers(usersList);
      console.log("Users fetched:", usersList.length);
    } catch (err) {
      console.error('Error fetching users:', err.code, err.message);
      
      if (err.code === 'permission-denied' || err.message.includes('permission')) {
        setError('Access denied. Your account does not have admin permissions.');
      } else if (err.message.includes('index')) {
        setError('This query requires an index that is being built. Please try again in a few minutes.');
      } else {
        setError(`Failed to load payment data: ${err.message}`);
      }
    }
    
    setLoading(false);
  };
  
const handleAdminLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  
  try {
    const email = adminEmail.trim();
    const password = adminPassword;
    
    // Check if this is a valid admin email
    if (email !== 'mcseattop@mcse.com' && email !== 'admin@mathsocmu.com') {
      setError('This email does not have admin privileges');
      setLoading(false);
      return;
    }
    
    // Sign in with credentials
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Authentication successful");
    
    // Wait a moment for the auth state to fully update
    setTimeout(() => {
      setIsAuthenticated(true);
      fetchUsers();
    }, 500);
  } catch (err) {
    console.error("Auth error:", err.code, err.message);
    
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email' || err.code === 'auth/user-not-found') {
      setError('Invalid email or password');
    } else if (err.code === 'auth/too-many-requests') {
      setError('Too many failed login attempts. Please try again later.');
    } else {
      setError(`Login error: ${err.message}`);
    }
  }
  
  setLoading(false);
};
  
  // Update payment status
  const updatePaymentStatus = async (userId, newStatus) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        paymentStatus: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser.email // Track who made the change
      });
      
      // Remove the user from the current list
      setUsers(users.filter(user => user.id !== userId));
      setSuccessMessage(`Payment status updated to ${newStatus}`);
      
      // Optionally refetch the current tab after a short delay
      setTimeout(() => {
        fetchUsers(activeTab);
      }, 1500);
      
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError(`Failed to update payment status: ${err.message}`);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setIsAuthenticated(true);
        fetchUsers('pending');
      } else {
        setIsAuthenticated(false);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-900 p-6 text-gray-200">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-indigo-300 border-b border-gray-700 pb-4">MCSE Admin Panel</h1>
        
        {!isAuthenticated ? (
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md mx-auto border border-gray-700">
            <h2 className="text-2xl font-semibold mb-6 text-white">Admin Login</h2>
            
            {error && (
              <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded mb-6">
                {error}
              </div>
            )}
            
            <form onSubmit={handleAdminLogin}>
              <div className="mb-5">
                <label className="block text-gray-300 mb-2 font-medium">Email</label>
                <input
                  type="email"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-300 mb-2 font-medium">Password</label>
                <input
                  type="password"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
              
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium shadow-md"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : 'Login'}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div className="flex space-x-3">
                <button 
                  className={`px-5 py-2.5 rounded-md shadow-md transition-all ${activeTab === 'pending' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                  onClick={() => fetchUsers('pending')}
                >
                  Pending
                </button>
                <button 
                  className={`px-5 py-2.5 rounded-md shadow-md transition-all ${activeTab === 'failed' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                  onClick={() => fetchUsers('failed')}
                >
                  Failed
                </button>
                <button 
                  className={`px-5 py-2.5 rounded-md shadow-md transition-all ${activeTab === 'success' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                  onClick={() => fetchUsers('success')}
                >
                  Success
                </button>
              </div>
              
              <button
                className="bg-gray-700 text-gray-200 px-5 py-2.5 rounded-md hover:bg-gray-600 transition-colors shadow-md flex items-center"
                onClick={handleLogout}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm1 4h12v1H4V7zm0 3h12v1H4v-1zm0 3h12v1H4v-1z" clipRule="evenodd" />
                </svg>
                Logout
              </button>
            </div>
            
            {error && (
              <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-md mb-6">
                {error}
              </div>
            )}
            
            {successMessage && (
              <div className="bg-green-900/50 border border-green-500/50 text-green-200 p-4 rounded-md mb-6">
                {successMessage}
              </div>
            )}
            
            {loading ? (
              <div className="text-center py-16 bg-gray-800 rounded-md shadow-md border border-gray-700">
                <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">Loading payment data...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="bg-gray-800 p-8 rounded-md shadow-md border border-gray-700 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-400 text-lg">No {activeTab} payments found.</p>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">University</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Payment Details</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Screenshot</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-750">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-white">{user.name}</div>
                              <div className="text-indigo-400 text-sm">{user.email}</div>
                              <div className="text-gray-500 text-sm">@{user.username}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-300">
                              {user.university === 'mahindra-university' ? 'Mahindra University' : user.universityName}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {user.paymentDetails ? (
                              <div>
                                <div className="text-sm font-medium text-gray-200">
                                  Transaction ID: <span className="text-indigo-400">{user.paymentDetails.transactionId}</span>
                                </div>
                                {user.paymentDetails.remarks && (
                                  <div className="text-sm text-gray-400 mt-1">
                                    Remarks: {user.paymentDetails.remarks}
                                  </div>
                                )}
                                <div className="text-xs text-gray-500 mt-1">
                                  Submitted: {new Date(user.paymentDetails.submittedAt).toLocaleString()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">No payment details</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {user.paymentDetails?.screenshotData ? (
                              <div>
                                <a 
                                  href={user.paymentDetails.screenshotData} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-indigo-400 hover:text-indigo-300 flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  View Full Size
                                </a>
                                <div className="mt-2">
                                  <img 
                                    src={user.paymentDetails.screenshotData} 
                                    alt="Payment screenshot" 
                                    className="h-24 object-cover rounded-md border border-gray-600 shadow-md hover:border-indigo-500 transition-all cursor-pointer" 
                                    onClick={() => window.open(user.paymentDetails.screenshotData, '_blank')}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">No screenshot</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              {activeTab === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updatePaymentStatus(user.id, 'success')}
                                    className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-sm rounded-md hover:shadow-lg transition-all flex items-center"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => updatePaymentStatus(user.id, 'failed')}
                                    className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-md hover:shadow-lg transition-all flex items-center"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Reject
                                  </button>
                                </>
                              )}
                              {activeTab === 'failed' && (
                                <button
                                  onClick={() => updatePaymentStatus(user.id, 'pending')}
                                  className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white text-sm rounded-md hover:shadow-lg transition-all flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Mark Pending
                                </button>
                              )}
                              {activeTab === 'success' && (
                                <button
                                  onClick={() => updatePaymentStatus(user.id, 'pending')}
                                  className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white text-sm rounded-md hover:shadow-lg transition-all flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Mark Pending
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>MCSE Admin Panel © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}