import { useState, useEffect } from 'react';

export default function App() {
  const [view, setView] = useState('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [message, setMessage] = useState('');
  const [dreams, setDreams] = useState([]);
  const [dreamText, setDreamText] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [dreamImage, setDreamImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedDreams, setExpandedDreams] = useState({});
  const [loadingSession, setLoadingSession] = useState(true);
  const [userName, setUserName] = useState('');
  const [timezone, setTimezone] = useState('');


  const fetchDreams = async () => {
    try {
      const res = await fetch('/api/dreams', { credentials: 'include' });
      const data = await res.json();
      setDreams(data);
    } catch {
      setDreams([]);
    }
  };

  useEffect(() => {
    const verifyAuth = async () => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(tz);
      try {
        const res = await fetch('/api/check_auth', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setView('dashboard');
            setUserName(data.first_name || '');
            await fetchDreams();
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

    verifyAuth();
  }, []);

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
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.message) {
        setView('dashboard');
        if (data.first_name) setUserName(data.first_name);
        fetchDreams();
      } else setMessage(data.error);
    } catch (err) {
      setMessage('Error registering.');
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
      setMessage('Error logging in.');
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
    setMessage('');
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
        setAiResponse(data.analysis);
        setDreamImage(data.image);
        setDreamText('');
        fetchDreams();
      }
    } catch (err) {
      setMessage('Failed to submit dream.');
    } finally {
      setLoading(false);
    }
  };

  const Navigation = () => (
    <nav className="bg-purple-950 text-white px-6 py-4 shadow flex justify-between items-center">
      <div className="font-bold text-xl">
        Welcome to Dreamr ✨ <span className="text-sm text-purple-300 italic ml-2">Your personal AI-powered dream analysis</span>
      </div>
      <div className="space-x-4">
        <button onClick={() => setView('dashboard')} className="hover:text-purple-300">Journal</button>
        <button onClick={() => setView('profile')} className="hover:text-purple-300">{userName}'s Profile</button>
        <button onClick={logout} className="hover:text-purple-300">Log Out</button>
      </div>
    </nav>
  );

  if (view === 'dashboard') {
    const latestDream = dreams[dreams.length - 1];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-800 text-white">
        <Navigation />
        <div className="p-8 grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-4">{userName}'s Dream Journal ✨</h2>
            <div className="grid gap-4">
              {dreams.length > 0 ? dreams.map(dream => (
                <div key={dream.id} className="bg-white text-gray-800 rounded p-4 shadow">
                  <p className="mb-2 font-semibold">
                    {dream.created_at ? new Date(dream.created_at).toLocaleString() : ''}
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
                    <div className="flex-grow cursor-pointer" onClick={() => toggleExpand(dream.id)}>
                      <p className="italic mb-2">{dream.text}</p>
                      {expandedDreams[dream.id] && dream.analysis && (
                        <p className="text-sm text-purple-900 mt-2">{dream.analysis}</p>
                      )}
                    </div>
                  </div>
                </div>
              )) : <p>Your dreams will appear here.</p>}

            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Submit a New Dream</h2>
            <textarea
              className="w-full h-40 p-2 text-gray-800 rounded mb-2"
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              placeholder="Describe your dream..."
            ></textarea>
            <button
              onClick={submitDream}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white w-full"
            >
              Submit Dream
            </button>
            {message && <p className="mt-2 text-sm text-red-300">{message}</p>}
            {loading && <p className="mt-4 text-white">Analyzing your dream...</p>}
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

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-700 flex flex-col items-center justify-center text-white">
        <h1 className="text-4xl font-bold mb-6">Welcome to Dreamr ✨</h1>
        <p className="mb-8 text-lg">Your personal AI-powered dream analysis</p>
        <div className="space-x-4">
          <button className="bg-white text-purple-800 font-semibold px-6 py-2 rounded hover:bg-gray-200" onClick={() => setView('login')}>Log In</button>
          <button className="bg-transparent border border-white px-6 py-2 rounded hover:bg-white hover:text-purple-800" onClick={() => setView('register')}>Register</button>
        </div>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-700 flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">Log In</h1>
        <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-full max-w-md text-gray-800">
          <input className="block w-full mb-2 p-2 border rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="block w-full mb-2 p-2 border rounded" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 w-full">Log In</button>
          {message && <p className="mt-2 text-center text-sm text-red-600">{message}</p>}
          <p className="mt-4 text-center text-sm text-purple-200 cursor-pointer" onClick={() => setView('register')}>Need an account? Register</p>
        </form>
      </div>
    );
  }

  if (view === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-700 flex flex-col items-center justify-center text-white">
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
