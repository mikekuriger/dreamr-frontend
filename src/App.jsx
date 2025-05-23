import { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, LayoutDashboard, Home } from 'lucide-react';
// import DreamImageCarousel from './components/DreamImageCarousel';


export default function App() {
  const [view, setView] = useState('landing');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [message, setMessage] = useState('');
  const [dreams, setDreams] = useState([]);
  const [dreamText, setDreamText] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [dreamImage, setDreamImage] = useState('');
  const [expandedDreams, setExpandedDreams] = useState({});
  const [loadingSession, setLoadingSession] = useState(true);
  const [userName, setUserName] = useState('');
  const [timezone, setTimezone] = useState('');
// for button text to update
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(''); // 'analyzing', 'generating
// for images on landing page
  const [backgroundImages, setBackgroundImages] = useState([]);
  const fetchDreams = async () => {
    try {
      const res = await fetch('/api/dreams', { credentials: 'include' });
      const data = await res.json();
      setDreams(data);
    } catch {
      setDreams([]);
    }
  };

  function ProfileMenu({ onLogout, onProfile }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // This is inside the ProfileMenu function
    // Close dropdown on outside click
    useEffect(() => {
      function handleClickOutside(event) {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
  
    return (
      <div ref={menuRef} className="relative inline-block text-left">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:text-purple-300"
        >
          <Menu className="w-5 h-5" />
        </button>
  
        {isOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded shadow-lg z-50">
            <button
              onClick={() => {
                onProfile();
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Profile
            </button>
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    );
  }

  // This is inside the "app" function
  useEffect(() => {
    const verifyAuth = async () => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(tz);
      try {
        const res = await fetch('/api/check_auth', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUserName(data.first_name || 'Sleepyhead');
            await fetchDreams();
            setView('dashboard');  // moved here so that user is populated before going to dashboard
            return;
          }
        }
      } catch {
        // ignore
      } finally {
        setLoadingSession(false);
      }
      setView('landing');
    };

    // Fetch available image filenames for landing page
    const loadBackgroundImages = async () => {
      try {
        const res = await fetch('/api/images');
        const files = await res.json();
        // const shuffled = files.sort(() => 0.5 - Math.random()).slice(0, 30);
        const shuffled = files.sort(() => 0.5 - Math.random());
        setBackgroundImages(shuffled);
      } catch (err) {
        console.error('Error loading background images:', err);
      }
    };

    verifyAuth();
    loadBackgroundImages();
      
  }, []);

  // This is also inside the app function
  useEffect(() => {
    const match = window.location.pathname.match(/^\/confirm\/(.{36})$/);
    if (match) {
      const token = match[1];
      fetch(`/api/confirm/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setConfirmationMessage(data.error);
            setView('confirmation');
          } else {
            // success — user is logged in, go to dashboard
            setView('dashboard');
            window.history.replaceState({}, document.title, '/dashboard');
          }
        })
        .catch(() => {
          setConfirmationMessage("Error confirming your account.");
          setView('confirmation');
          window.history.replaceState({}, document.title, '/');
        });
    }
  }, []);


  if (loadingSession) return <div className="text-white p-8">Checking session...</div>;

  const toggleExpand = (id) => {
    setExpandedDreams((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // const register = async () => {
  //   try {
  //     const res = await fetch('/api/register', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         email,
  //         password,
  //         first_name: firstName,
  //         timezone
  //       }),
  //       credentials: 'include'
  //     });
  //     const data = await res.json();
  //     if (data.message) {
  //       setView('dashboard');
  //       if (data.first_name) setUserName(data.first_name);
  //       fetchDreams();
  //     } else setMessage(data.error);
  //   } catch (err) {
  //     setMessage('Error registering.');
  //   }
  // };


  const register = async () => {
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          timezone
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Check your email to confirm your Dreamr✨account.");
      } else {
        setMessage(data.error || "Registration failed.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setMessage("Something went wrong. Please try again.");
    }
  };
    
  const handleRegister = (e) => {
    e.preventDefault();
    register();
  };

  const login = async () => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.message) {
        setView('dashboard');
        fetchDreams();
      } else setMessage(data.error);
    } catch (err) {
      setMessage('Error logging in, try reloading the page');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    login();
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setView('landing');
      setEmail('');
      setPassword('');
      setFirstName('');
      setDreams([]);
    } catch {
      setMessage('Error logging out.');
    }
  };

  const submitDream = async () => {
    setLoading(true);
    setLoadingPhase('analyzing');
    setMessage('');
    setAiResponse('');
    setDreamImage('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: dreamText }),
        credentials: 'include'
      });

      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
      } else {
        //setMessage('Attempting to create an image of your dream');
        //setLoadingPhase('generating');
        setAiResponse(data.analysis);
        setDreamImage(data.image);
        
      }
    } catch (err) {
      setMessage('Failed to complete your dream analysis.  I\'m still working on the code.  Please try again.');
    } finally {
      setLoading(false);
      setLoadingPhase('');
      setDreamText('');
      fetchDreams();
    }
  };

  const Navigation = () => (
    <nav className="sticky top-0 z-50 bg-purple-950 text-white px-2 md:px-6 py-4 shadow flex justify-between items-center">
      <div className="font-bold text-xl flex flex-col md:flex-row md:items-center">
        <span>Welcome to Dreamr ✨</span>
        <span className="text-xs sm:text-sm text-purple-300 italic md:ml-2 mt-1 md:mt-0">
          Your personal AI-powered dream analysis
        </span>
      </div>
      <div className="space-x-4">
        {/* <button onClick={() => setView('dashboard')} className="hover:text-purple-300">Journal</button> */}
        {/* <button onClick={() => setView('profile')} className="hover:text-purple-300">P</button> */}
        {/* <button onClick={logout} className="hover:text-purple-300">L</button> */}
          {/* <button onClick={() => setView('profile')} className="hover:text-purple-300 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button> */}
        {/* <button
          onClick={() => setView('profile')}
          className="hover:text-purple-300 p-2 relative group"
        >
          <Menu className="w-5 h-5" />
          <span className="absolute bottom-full mb-1 text-xs text-white bg-black rounded px-2 py-1 opacity-0 group-hover:opacity-100">
            Profile
          </span>
        </button> */}
        <button onClick={() => {
                  setView('dashboard');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} className="p-2 hover:text-purple-300">
          <Home className="w-5 h-5" />
        </button>
        <ProfileMenu onLogout={logout} onProfile={() => setView('profile')} />
      </div>
    </nav>
  );

  if (view === 'dashboard') {
    const latestDream = dreams[dreams.length - 1];

    // <audio autoPlay loop volume="0.1">
    //   <source src="/audio/meditation-hum.mp3" type="audio/mpeg" />
    //   Your browser does not support the audio element.
    // </audio>

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-800 text-white">
        <Navigation />
        <div className="p-2 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="order-2 md:order-1">
            <h2 className="text-3xl font-bold mb-4">Dream Journal ✨</h2>
            <div className="grid gap-2">
              {dreams.length > 0 ? dreams.map(dream => (
                <div key={dream.id} className="bg-white text-gray-800 rounded p-4 shadow">
                  <p className="text-sm sm:text-base mb-2 font-semibold">
                    {dream.created_at ? new Date(dream.created_at).toLocaleString() : ''} - {dream.summary}
                  </p>
              
                  <div className="flex items-start gap-4">
                    {/* LOCKED-SIZE IMAGE GOES HERE */}
                    {dream.image_file && (
                      <a
                        href={dream.image_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Click to view full image"
                        style={{ display: 'inline-block', width: '48px', height: '48px', flexShrink: 0 }}
                      >
                        <img
                          src={dream.image_file}
                          alt="Dream Thumbnail"
                          style={{
                            display: 'block',
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                          }}
                        />
                      </a>
                    )}
              
                    {/* TEXT BLOCK */}
                    <div>
                        <div className="flex-grow cursor-pointer" onClick={() => toggleExpand(dream.id)}>
                          <p className="text-sm sm:text-base italic mb-2">{dream.text}</p>
                          {expandedDreams[dream.id] && dream.analysis && (
                            <p className="text-xs sm:text-sm text-purple-900 mt-2">{dream.analysis}</p>
                          )}
                        </div>
                    </div>
                  </div>
                </div>
              )) : <p>Your dreams will appear here.</p>}

            </div>
          </div>

          <div className="order-1 md:order-2">
            <h2 className="text-2xl  font-bold mb-2">Hello, {userName}</h2>
            <p className="text-sm text-purple-200 mb-4">
            Tell me about your dream in as much detail as you remember — characters, settings, emotions, anything that stood out. 
            After submitting, I will take a moment to analyze your dream and generate a personalized interpretation. 
            This may take a few seconds, so sit tight while the magic happens ✨
            </p>

            <textarea
              className="w-full h-40 p-2 text-gray-800 rounded mb-2"
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              placeholder="Describe your dream..."
            ></textarea>
            <button
              onClick={submitDream}
              disabled={loading}
              className={`flex items-center justify-center px-4 py-2 rounded w-full text-white transition ${
                loading
                  ? 'bg-purple-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  {loadingPhase === 'generating' ? 'Generating Image...' : 'Analyzing Dream...'}
                </>
              ) : (
                'Submit Dream'
              )}
            </button>

            {message && <p className="mt-2 text-sm text-red-300">{message}</p>}
            {loading && <p className="mt-4 text-white">Your dream analysis will appear here shortly.</p>}
            {aiResponse && (
              <div className="mt-6 p-4 bg-white text-gray-900 rounded shadow">
                <h3 className="font-bold text-lg mb-2">Dream Interpretation:</h3>
                <p className="italic">{aiResponse}</p>
                {dreamImage && (
                  <img src={dreamImage} alt="Dream" className="mt-4 rounded shadow" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // if (view === 'landing') {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-700 flex flex-col items-center justify-center text-white">
  //       <h1 className="text-4xl font-bold mb-6">Welcome to Dreamr ✨</h1>
  //       <p className="mb-8 text-lg">Your personal AI-powered dream analysis</p>
  //       <div className="space-x-4">
  //         <button className="bg-white text-purple-800 font-semibold px-6 py-2 rounded hover:bg-gray-200" onClick={() => setView('login')}>Log In</button>
  //         <button className="bg-transparent border border-white px-6 py-2 rounded hover:bg-white hover:text-purple-800" onClick={() => setView('register')}>Register</button>
  //       </div>
  //     </div>
  //   );
  // }

  // carosel slideshow 
  // if (view === 'landing') {
  //   const randomImages = [...backgroundImages].sort(() => 0.5 - Math.random());
  
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-700 flex flex-col items-center justify-center text-white relative">
  //       <h1 className="text-4xl font-bold mb-6">Welcome to Dreamr ✨</h1>
  //       <p className="mb-8 text-lg">Your personal AI-powered dream analysis</p>
  //       <div className="space-x-4">
  //         <button className="bg-white text-purple-800 font-semibold px-6 py-2 rounded hover:bg-gray-200" onClick={() => setView('login')}>Log In</button>
  //         <button className="bg-transparent border border-white px-6 py-2 rounded hover:bg-white hover:text-purple-800" onClick={() => setView('register')}>Register</button>
  //       </div>
  
  //       <div className="absolute bottom-0 w-full px-4 pb-6">
  //         <DreamImageCarousel images={randomImages} />
  //       </div>
  //     </div>
  //   );
  // }

  if (view === 'confirmation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-800 text-white flex items-center justify-center p-8">
        <div className="bg-white text-gray-900 p-6 rounded shadow text-center max-w-md">
          <h2 className="text-xl font-bold mb-4">Dreamr ✨ Account Confirmation</h2>
          <p>{confirmationMessage}</p>
          <button
            className="mt-4 px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-800"
            onClick={() => setView('login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
  
  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-0">
            {backgroundImages.map((img, i) => (
              <div key={i} className="w-full aspect-square">
                <img
                  src={`/static/images/dreams/${img}`}
                  className="w-full h-full object-cover opacity-60"
                  alt=""
                />
              </div>
            ))}
          </div>
        </div>
      
        {/* Foreground content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white text-center">
          <h1 className="text-4xl font-bold mb-6">Welcome to Dreamr ✨</h1>
          <p className="mb-8 text-lg">Your personal AI-powered dream analysis</p>
          <div className="space-x-4">
            <button className="bg-white text-purple-800 font-semibold px-6 py-2 rounded hover:bg-gray-200" onClick={() => setView('login')}>Log In</button>
            <button className="bg-transparent border border-white px-6 py-2 rounded hover:bg-white hover:text-purple-800" onClick={() => setView('register')}>Register</button>
          </div>
        </div>
      </div>
    );
  }
    
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Background tiles */}
        <div className="absolute inset-0 overflow-y-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-0">
            {backgroundImages.map((img, i) => (
              <div key={i} className="w-full aspect-square">
                <img
                  src={`/static/images/dreams/${img}`}
                  className="w-full h-full object-cover opacity-60"
                  alt=""
                />
              </div>
            ))}
          </div>
        </div>
  
        {/* Foreground content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Log In</h1>
          <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-full max-w-md text-gray-800">
            <input className="block w-full mb-2 p-2 border rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="block w-full mb-2 p-2 border rounded" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 w-full">Log In</button>
            {message && <p className="mt-2 text-center text-sm text-red-600">{message}</p>}
            <p className="mt-4 text-center text-sm text-purple-200 cursor-pointer" onClick={() => setView('register')}>Need an account? Register</p>
          </form>
        </div>
      </div>
    );
  }


if (view === 'register') {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background tiles */}
      <div className="absolute inset-0 overflow-y-auto">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-0">
          {backgroundImages.map((img, i) => (
            <div key={i} className="w-full aspect-square">
              <img
                src={`/static/images/dreams/${img}`}
                className="w-full h-full object-cover opacity-60"
                alt=""
              />
            </div>
          ))}
        </div>
      </div>

      {/* Foreground content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white text-center">
        <h1 className="text-2xl font-bold mb-4">Create Account</h1>
        <form onSubmit={handleRegister} className="bg-white p-6 rounded shadow-md w-full max-w-md text-gray-800">
          <input className="block w-full mb-2 p-2 border rounded" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <input className="block w-full mb-2 p-2 border rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="block w-full mb-2 p-2 border rounded" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 w-full">Register</button>
          {message && <p className="mt-2 text-center text-sm text-red-600">{message}</p>}
          <p className="mt-4 text-center text-sm text-purple-200 cursor-pointer" onClick={() => setView('login')}>Already have an account? Log in</p>
        </form>
      </div>
    </div>
  );
}


  if (view === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-800 text-white">
        <Navigation />
        <div className="p-8 max-w-xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Profile & Settings</h1>
          <p>Profile options will appear here.</p>
        </div>
      </div>
    );
  }

  return null;
}
