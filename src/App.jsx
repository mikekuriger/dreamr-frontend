import { useState, useRef, useEffect } from 'react';
import { Menu, LogOut, LayoutDashboard, Home } from 'lucide-react';
import { timezones } from './timezones';

export default function App() {
  const [view, setView] = useState('landing');
  console.log("Current view:", view);
  
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
  
  // to handle view changes
  const handleViewChange = (newView) => {
    setView(newView);
    window.history.pushState({}, '', `/${newView}`);
  };


  function ProfileMenu({ onGallery, onLogout, onProfile }) {
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
                onGallery();
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Gallery
            </button>
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
            handleViewChange('dashboard');  // moved here so that user is populated before going to dashboard
            return;
          }
        }
      } catch {
        // ignore
      } finally {
        setLoadingSession(false);
      }
      handleViewChange('landing');
    };

    // Fetch available image filenames for landing page
    const loadBackgroundImages = async () => {
      try {
        const res = await fetch('/api/images');
        const files = await res.json();
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
            handleViewChange('confirmation');
          } else {
            // success — user is logged in, go to dashboard
            handleViewChange('dashboard');
            // window.history.replaceState({}, document.title, '/dashboard');
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .catch(() => {
          setConfirmationMessage("Error confirming your account.");
          handleViewChange('confirmation');
          window.history.replaceState({}, document.title, '/');
        });
    }
  }, []);

  // inside app, this will make the URL pretty
  useEffect(() => {
    // On initial load, set view based on the path
    const path = window.location.pathname.replace('/', '') || 'dashboard';
    setView(path);
  }, []);

  // inside app, to handle browser back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname.replace('/', '') || 'dashboard';
      setView(path);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);


  // For the profle view
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    birthdate: '',
    gender: '',
    timezone: '',
    avatar: null,
  });
  
  useEffect(() => {
    if (view === 'profile') {
      fetch('/api/profile', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          setFormData({
            email: data.email || '',
            firstName: data.first_name || '',
            birthdate: data.birthdate || '',
            gender: data.gender || '',
            timezone: data.timezone || '',
            avatar: null  // file uploads can't be prefilled
          });
        })
        .catch(err => console.error("Failed to load profile:", err));
    }
  }, [view]);



  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'avatar') {
      setFormData({ ...formData, avatar: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    for (const key in formData) {
      if (formData[key]) form.append(key, formData[key]);
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        body: form,
        credentials: 'include'
      });
  
      if (res.ok) {
        const data = await res.json();
        setUserName(data.first_name || 'Sleepyhead');
        //alert('Profile updated!');
        handleViewChange('dashboard');  // 👈 redirect to dashboard
      } else {
        alert('Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    }
  };


  
  if (loadingSession) return <div className="text-white p-8">Checking session...</div>;

  const toggleExpand = (id) => {
    setExpandedDreams((prev) => ({ ...prev, [id]: !prev[id] }));
  };


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
        handleViewChange('dashboard');
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
      handleViewChange('landing');
      setEmail('');
      setPassword('');
      setFirstName('');
      setDreams([]);
    } catch {
      setMessage('Error logging out.');
    }
  };

  // Dream submission
  const submitDream = async () => {
    setLoading(true);
    setLoadingPhase('analyzing');
    setMessage('');
    setAiResponse('');
    setDreamImage('');
  
    try {
      // Step 1: Send dream to /api/chat
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: dreamText }),
        credentials: 'include'
      });
  
      const data = await res.json();
  
      if (!res.ok || data.error) {
        setMessage(data.error || 'Unexpected error during dream analysis.');
        return;
      }
  
      setAiResponse(data.analysis);
      const dreamId = data.dream_id;
      const dreamTone = data.tone;
  
      setLoadingPhase('generating');
      //mrk, 538
      setMessage([
        `Your dream feels "${dreamTone || 'mysterious'}".`,
        'Please keep this window open while I create your dream image...'
      ]);
  
      // Step 2: Send dream_id to /api/image_generate
      const imgRes = await fetch('/api/image_generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dream_id: dreamId }),
        credentials: 'include'
      });
  
      const imgData = await imgRes.json();
  
      if (!imgRes.ok || imgData.error) {
        setMessage(imgData.error || 'Image generation failed.');
        return;
      }
  
      setDreamImage(imgData.image);
  
    } catch (err) {
      console.error("Error in submitDream:", err);
      setMessage("Failed to complete your dream analysis. Please try again.");
    } finally {
      setMessage('');
      setLoading(false);
      setLoadingPhase('');
      setDreamText('');
      fetchDreams();  // Refresh dream history
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
        <button onClick={() => {
                  handleViewChange('dashboard');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} className="p-2 hover:text-purple-300">
          <Home className="w-5 h-5" />
        </button>
        <ProfileMenu
          onProfile={() => handleViewChange('profile')}
          onGallery={() => handleViewChange('gallery')}
          onLogout={logout}
        />
      </div>
    </nav>
  );


  
  if (view === 'dashboard') {
    const latestDream = dreams[dreams.length - 1];
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
                          src={dream.image_tile}
                          alt="Dream Thumbnail"
                          loading="lazy"
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
            Your dream interpretation takes a few moments, but your dream image will take me a minute or so to create.
            So sit tight while the magic happens ✨
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
                  {loadingPhase === 'generating' ? 'Creating dream image...' : 'Analyzing Dream...'}
                </>
              ) : (
                'Submit Dream'
              )}
            </button>

            {message && Array.isArray(message) ? (
              <div className="mt-2 text-sm text-red-300">
                {message.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-red-300">{message}</p>
            )}
            {loading && loadingPhase === 'analyzing' && (
              <p className="mt-4 text-white">Your dream analysis will appear here shortly.</p>
            )}
            {
            /* {loading && loadingPhase === 'generating' && (
              <p className="mt-4 text-white">Creating dream image...</p>
            )} */
            }

            {aiResponse && (
              <div className="mt-6 p-4 bg-white text-gray-900 rounded shadow">
                <h3 className="font-bold text-lg mb-2">Dream Interpretation: </h3>
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


  if (view === 'confirmation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-800 text-white flex items-center justify-center p-8">
        <div className="bg-white text-gray-900 p-6 rounded shadow text-center max-w-md">
          <h2 className="text-xl font-bold mb-4">Dreamr ✨ Account Confirmation</h2>
          <p>{confirmationMessage}</p>
          <button
            className="mt-4 px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-800"
            onClick={() => handleViewChange('login')}
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
                  src={`/static/images/tiles/${img}`}
                  className="w-full h-full object-cover opacity-60"
                  alt=""
                  style={{ filter: 'blur(1px)' }}
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
            <button className="bg-white text-purple-800 font-semibold px-6 py-2 rounded hover:bg-gray-200" onClick={() => handleViewChange('login')}>Log In</button>
            <button className="bg-transparent border border-white px-6 py-2 rounded hover:bg-white hover:text-purple-800" onClick={() => handleViewChange('register')}>Register</button>
          </div>
          <a href="/login/google" className="mt-6">
            <button className="bg-white text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-100 flex items-center justify-center">
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google"
                className="w-5 h-5 mr-3"
              />
              Continue with Google
            </button>
          </a>
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
                  src={`/static/images/tiles/${img}`}
                  className="w-full h-full object-cover opacity-60"
                  alt=""
                  style={{ filter: 'blur(1px)' }}
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
            <p className="mt-4 text-center text-sm text-purple-200 cursor-pointer" onClick={() => handleViewChange('register')}>Need an account? Register</p>
          </form>
          <a href="/login/google" className="mt-6">
            <button className="bg-white text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-100 flex items-center justify-center">
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google"
                className="w-5 h-5 mr-3"
              />
              Login with Google
            </button>
          </a>
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
                  src={`/static/images/tiles/${img}`}
                  className="w-full h-full object-cover opacity-60"
                  alt=""
                  style={{ filter: 'blur(1px)' }}
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
            <p className="mt-4 text-center text-sm text-purple-200 cursor-pointer" onClick={() => handleViewChange('login')}>Already have an account? Log in</p>
          </form>
          <a href="/login/google" className="mt-6">
            <button className="bg-white text-gray-800 px-4 py-2 rounded shadow hover:bg-gray-100 flex items-center justify-center">
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google"
                className="w-5 h-5 mr-3"
              />
              Register with Google
            </button>
          </a>
        </div>
      </div>
    );
  }


  if (view === 'profile') {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        
        {/* 🔹 Tile background (lowest layer) */}
        <div className="absolute inset-0 z-0">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-0">
            {backgroundImages.map((img, i) => (
              <div key={i} className="w-full aspect-square">
                <img
                  src={`/static/images/tiles/${img}`}
                  className="w-full h-full object-cover opacity-50"
                  alt=""
                />
              </div>
            ))}
          </div>
        </div>
  
        {/* 🔹 Foreground gradient + profile form */}
        <div className="relative z-10">
          <Navigation />
          {/* Translucent gradient wrapper */}
          <div className="p-8 max-w-xl mx-auto mt-8 rounded-xl shadow-xl" style={{
            background: 'linear-gradient(to bottom right, rgba(8, 28, 135, 0.8), rgba(67, 56, 202, 0.1))'
          }}>
            
            {/* Fully opaque form inside */}
            <div className="text-white">
              <h1 className="text-2xl font-bold mb-4">Profile</h1>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* All your input fields remain unchanged */}
                <label className="block">
                  Email
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full mt-1 p-2 text-black rounded"
                  />
                </label>
                <label className="block">
                  First Name
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="block w-full mt-1 p-2 text-black rounded"
                  />
                </label>
                <label className="block">
                  Birthdate
                  <input
                    type="date"
                    name="birthdate"
                    value={formData.birthdate}
                    onChange={handleChange}
                    className="block w-full mt-1 p-2 text-black rounded"
                  />
                </label>
                <label className="block">
                  Gender
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="block w-full mt-1 p-2 text-black rounded"
                  >
                    {/* <option value="">Select</option> */}
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    {/* <option value="nonbinary">Nonbinary</option> */}
                    <option value="prefer not to say">Prefer not to say</option>
                  </select>
                </label>
                {/* <label className="block">
                  Timezone
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    className="block w-full mt-1 p-2 text-black rounded"
                  >
                    <option value="">Select your timezone</option>
                    {timezones.map((tz, idx) => (
                      <option key={idx} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </label> */}
                {/* <label className="block">
                  Profile Photo (optional)
                  <input
                    type="file"
                    name="avatar"
                    onChange={handleChange}
                    className="block mt-1 text-white"
                    accept="image/*"
                  />
                </label> */}
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Save Profile
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

    if (view === 'gallery') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-800 text-white">
        <Navigation />
        <div className="w-full p-4">
          <h2 className="text-3xl font-bold mb-4 text-center">Dream Gallery ✨</h2>
        
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {dreams.map((dream, i) => (
              <div key={i} className="w-full">
                {/* <a href={dream.image_file} target="_blank" rel="noopener noreferrer"> */}
                  <img
                    src={dream.image_file}
                    alt="Dream"
                    loading="lazy"
                    className="w-full h-auto rounded-lg"
                  />
                {/* </a> */}
                <p className="text-sm text-gray-300">{dream.summary}</p>
                <div className="flex gap-2 mt-1">
                  {/* <button onClick={() => shareToSocial(dream, 'facebook')} className="text-blue-400 text-xs underline hover:text-blue-200">Share to Facebook</button> */}
                  {/* <button onClick={() => shareToSocial(dream, 'twitter')} className="text-blue-400 text-xs underline hover:text-blue-200">Twitter</button> */}
                  {/* <button onClick={() => shareToSocial(dream, 'pinterest')} className="text-blue-400 text-xs underline hover:text-blue-200">Pinterest</button> */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }


  if (view === 'dream' && selectedDream) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <Navigation />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <img
            src={selectedDream.image_file}
            alt="Dream"
            className="w-full max-w-screen-xl h-auto"
          />
        </div>
      </div>
    );
  }


  return null;
}
