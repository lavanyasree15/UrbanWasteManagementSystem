import { useState } from "react";
import "./App.css";
import smartTrashLogo from "./assets/bin.png";
import recyclingImage from "./assets/recycling.png";
import homeHeroImage from "./assets/home-hero.png";

const API = "https://ecotrack-backend-zzpm.onrender.com/api";

function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [category, setCategory] = useState("Household Waste");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [coordinates, setCoordinates] = useState({ latitude: null, longitude: null });
  const [locationLoading, setLocationLoading] = useState(false);
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [showWorkerForm, setShowWorkerForm] = useState(false);
const [workerForm, setWorkerForm] = useState({
  name: "",
  email: "",
  phone: "",
  address: "",
  workerId: "",
  vehicleType: "",
  password: "",
  confirmPassword: ""
});
const [workerLoading, setWorkerLoading] = useState(false);
const [completionPhotos, setCompletionPhotos] = useState({});
const [completingId, setCompletingId] = useState("");

  const updateField = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  
async function handleAuth(e) {
  e.preventDefault();
  setError("");
  setMessage("");
  setLoading(true);

  try {
    const endpoint =
      page === "register" ? "/auth/register" : "/auth/login";

    const payload =
      page === "register"
        ? form
        : {
            email: form.email,
            password: form.password,
          };

    const response = await fetch(`${API}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed.");
    }

    if (page === "register") {
      setMessage("Registration successful. Please log in.");
      setPage("login");
      setForm({
        name: "",
        email: form.email,
        password: "",
      });
    } else {
      setToken(data.token);
      setUser(data.user);
      setPage("dashboard");
      setMessage(`Welcome, ${data.user.name}!`);

      await loadComplaints(data.token, data.user.role);

      if (data.user.role === "admin") {
        const workerResponse = await fetch(
          `${API}/complaints/workers`,
          {
            headers: {
              Authorization: `Bearer ${data.token}`,
            },
          }
        );

        const workerData = await workerResponse.json();

        if (!workerResponse.ok) {
          throw new Error(
            workerData.message || "Could not load workers."
          );
        }

        setWorkers(workerData.workers || []);
      } else {
        setWorkers([]);
      }
    }
  } catch (err) {
    setError(err.message || "Unable to connect to the server.");
  } finally {
    setLoading(false);
  }
}

  async function loadComplaints(activeToken = token, role = user?.role) {
    setError("");

    let endpoint = "/complaints/my";
    if (role === "admin") endpoint = "/complaints/all";
    if (role === "worker") endpoint = "/complaints/assigned";

    try {
      const response = await fetch(`${API}${endpoint}`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load complaints.");
      }

      setComplaints(data.complaints || []);
    } catch (err) {
      setError(err.message || "Could not load complaints.");
    }
  }
  
  async function loadWorkers() {
  try {
    const response = await fetch(`${API}/complaints/workers`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not load workers.");
    }

    setWorkers(data.workers || []);
  } catch (err) {
    setError(err.message || "Could not load workers.");
  }
}

  function handlePhotoChange(e) {
    const selectedFile = e.target.files?.[0];
    setError("");

    if (!selectedFile) {
      setPhoto(null);
      setPhotoPreview("");
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file.");
      e.target.value = "";
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }

    setPhoto(selectedFile);
    setPhotoPreview(URL.createObjectURL(selectedFile));
  }

  function captureLocation() {
    setError("");

    if (!navigator.geolocation) {
      setError("GPS location is not supported by this browser.");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setCoordinates({ latitude, longitude });
        setAddress((currentAddress) => currentAddress.trim() || `${latitude}, ${longitude}`);
        setMessage("GPS location captured. You can still edit the address.");
        setLocationLoading(false);
      },
      (geoError) => {
        const message = geoError.code === 1
          ? "Location permission denied. Allow location access in your browser or enter the address manually."
          : "Could not get your location. Please try again or enter the address manually.";
        setError(message);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function submitComplaint(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setComplaintLoading(true);

    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("description", description);
      formData.append("location", JSON.stringify({
        address: address.trim(),
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      }));
      if (photo) formData.append("photo", photo);

      const response = await fetch(`${API}/complaints`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Complaint submission failed.");
      }

      setMessage("Complaint submitted successfully!");
      setDescription("");
      setAddress("");
      setPhoto(null);
      setPhotoPreview("");
      setCoordinates({ latitude: null, longitude: null });
      const fileInput = document.getElementById("complaint-photo");
      if (fileInput) fileInput.value = "";
      await loadComplaints();
    } catch (err) {
      setError(err.message || "Could not submit complaint.");
    } finally {
      setComplaintLoading(false);
    }
  }

  async function updateStatus(id, status) {
    setError("");
    setMessage("");

    try {
  const endpoint =
    user?.role === "worker"
      ? `${API}/complaints/${id}/worker-status`
      : `${API}/complaints/${id}/status`;

  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Status update failed.");
      }

      setMessage("Complaint status updated.");
      await loadComplaints();
    } catch (err) {
      setError(err.message || "Could not update status.");
    }
  }
  
  async function completeComplaint(complaintId) {
  const completionPhoto = completionPhotos[complaintId];

  if (!completionPhoto) {
    setError("Please select a cleaning completion photo.");
    return;
  }

  setError("");
  setMessage("");
  setCompletingId(complaintId);

  try {
    const formData = new FormData();
    formData.append("completionPhoto", completionPhoto);

    const response = await fetch(
      `${API}/complaints/${complaintId}/complete`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not complete complaint.");
    }

    setMessage("Cleaning completed! Citizen acknowledgement recorded.");
    setCompletionPhotos((previous) => {
      const updated = { ...previous };
      delete updated[complaintId];
      return updated;
    });

    await loadComplaints();
  } catch (err) {
    setError(err.message || "Could not complete complaint.");
  } finally {
    setCompletingId("");
  }
}
async function assignComplaint(complaintId, workerId) {
  if (!workerId) return;

  setError("");
  setMessage("");

  try {
    const response = await fetch(
      `${API}/complaints/${complaintId}/assign`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ workerId })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Worker assignment failed.");
    }

    setMessage("Worker assigned successfully!");
    await loadComplaints();
  } catch (err) {
    setError(err.message || "Could not assign worker.");
  }
}

async function createWorker(e) {
  e.preventDefault();
  setError("");
  setMessage("");
  setWorkerLoading(true);

  try {
    const response = await fetch(`${API}/auth/workers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(workerForm)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not create worker.");
    }

    setMessage("Worker account created successfully!");
    setWorkerForm({ name: "", email: "", password: "" });
    setShowWorkerForm(false);
    await loadWorkers();
  } catch (err) {
    setError(err.message || "Could not create worker.");
  } finally {
    setWorkerLoading(false);
  }
}


  async function logout() {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      setToken("");
      setUser(null);
      setComplaints([]);
      setPage("login");
      setMessage("You have been logged out.");
      setError("");
      setForm({ name: "", email: "", password: "" });
    }
  }

  
  if (page === "home") {
    return (
      <div className="home-page">
        <nav className="home-navbar">
          <div className="home-brand">
  <img src={smartTrashLogo} alt="EcoTrack logo" />
  <span>EcoTrack</span>
</div>

          <div className="home-nav-links">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#contact">Contact</a>
            <button
              className="home-login-btn"
              onClick={() => {
                setError("");
                setMessage("");
                setPage("login");
              }}
            >
              Login
            </button>
          </div>
        </nav>

        <section
  className="home-hero"
  id="home"
  style={{ backgroundImage: `url(${homeHeroImage})` }}
>
  <div className="home-hero-text">
    <span className="eyebrow">
      CLEANER STREETS, BETTER FUTURE
    </span>

    <h1>A Cleaner City Starts With You.</h1>

    <p>
      Help keep your neighbourhood clean. Report waste,
      track complaints, and work together for a better future.
    </p>

    <button
      className="primary-btn home-cta"
      onClick={() => setPage("login")}
    >
      Report Waste →
    </button>
  </div>
</section>

        
<section className="home-about" id="about">
  <div className="about-heading">
    <span className="eyebrow">ABOUT ECOTRACK</span>
    <h2>Making Waste Management Smarter</h2>
    <p>
      EcoTrack connects citizens, administrators, and waste
      collection workers to make waste reporting and resolution
      easier, faster, and more transparent.
    </p>
  </div>

  <div className="about-intro-grid">
    <article className="about-info-card">
      <div className="about-icon">⚠️</div>
      <h3>The Problem</h3>
      <p>
        Unreported garbage, delayed collection, and difficulty
        tracking complaints can affect the cleanliness of our
        neighbourhoods.
      </p>
    </article>

    <div className="about-solution-arrow">→</div>

    <article className="about-info-card solution-card">
      <div className="about-icon">♻️</div>
      <h3>Our Solution</h3>
      <p>
        EcoTrack provides online waste reporting, complaint
        tracking, worker assignment, and resolution updates
        through one platform.
      </p>
    </article>
  </div>

  <div className="about-workflow">
    <div className="about-heading">
      <span className="eyebrow">OUR WORKFLOW</span>
      <h2>From Report to Resolution</h2>
      <p>Four simple steps to manage a waste complaint.</p>
    </div>

    <div className="workflow-diagram">
      <article className="workflow-step">
        <div className="workflow-number">01</div>
        <div className="workflow-icon">📸</div>
        <h3>Report Waste</h3>
        <p>
          Citizens submit a photo, location, category, and
          description of the waste.
        </p>
      </article>

      <div className="workflow-connector">→</div>

      <article className="workflow-step">
        <div className="workflow-number">02</div>
        <div className="workflow-icon">📝</div>
        <h3>Review & Assign</h3>
        <p>
          The administrator reviews the complaint and assigns
          a waste collection worker.
        </p>
      </article>

      <div className="workflow-connector">→</div>

      <article className="workflow-step">
        <div className="workflow-number">03</div>
        <div className="workflow-icon">🧹</div>
        <h3>Collect Waste</h3>
        <p>
          The assigned worker handles the complaint and
          updates its progress.
        </p>
      </article>

      <div className="workflow-connector">→</div>

      <article className="workflow-step">
        <div className="workflow-number">04</div>
        <div className="workflow-icon">✅</div>
        <h3>Resolve & Track</h3>
        <p>
          The completion status and cleaning photo help
          citizens track the outcome.
        </p>
      </article>
    </div>
  </div>

  <div className="about-features">
    <div className="about-heading">
      <span className="eyebrow">WHAT WE OFFER</span>
      <h2>Designed for Better Communities</h2>
    </div>

    <div className="about-feature-grid">
      <article className="about-feature-card">
        <span>📍</span>
        <h3>Location-Based Reports</h3>
        <p>Include an address and GPS coordinates in reports.</p>
      </article>

      <article className="about-feature-card">
        <span>🔎</span>
        <h3>Complaint Tracking</h3>
        <p>Follow complaint status from submission to resolution.</p>
      </article>

      <article className="about-feature-card">
        <span>👥</span>
        <h3>Role-Based Access</h3>
        <p>Separate workflows for citizens, admins, and workers.</p>
      </article>

      <article className="about-feature-card">
        <span>📊</span>
        <h3>Admin Monitoring</h3>
        <p>Review complaints and monitor their current status.</p>
      </article>
    </div>
  </div>
</section>


        
<section className="home-how" id="how-it-works">
  <h2>How It Works</h2>
  <p className="how-subtitle">
    Four simple steps towards a cleaner environment.
  </p>

  <div className="home-feature-grid">
    <article className="home-feature">
      <span>01</span>
      <h3>Report Waste</h3>
      <p>
        Submit the waste category, location, photo, and description.
      </p>
    </article>

    <article className="home-feature">
      <span>02</span>
      <h3>Review & Assign</h3>
      <p>
        The admin reviews the complaint and assigns a worker.
      </p>
    </article>

    <article className="home-feature">
      <span>03</span>
      <h3>Collect Waste</h3>
      <p>
        The assigned worker collects the waste and updates its status.
      </p>
    </article>

    <article className="home-feature">
      <span>04</span>
      <h3>Track Resolution</h3>
      <p>
        Citizens track the complaint until the issue is resolved.
      </p>
    </article>
  </div>
</section>


        <footer className="home-footer" id="contact">
          <h2>Let's Keep Our City Clean</h2>
          <p>Join the community and help make a difference.</p>
          <button
            className="primary-btn"
            onClick={() => setPage("login")}
          >
            Get Started
          </button>
        </footer>
      </div>
    );
  }

  if (page === "login" || page === "register") {
    const isRegister = page === "register";

    return (
      <main className="auth-page">
        <section className="auth-intro">
          <div className="brand">
<img
  src={smartTrashLogo}
  alt="SmartTrash logo"
  className="brand-logo"
/>            <span>EcoTrack</span>
          </div>
          <div className="intro-content">
            <span className="eyebrow">CLEANER STREETS, BETTER FUTURE</span>
            <h1>Let's build a cleaner community together.</h1>
            <p>
              Report waste, track collection progress, and help keep your
              neighbourhood clean.
            </p>
            <img
  src={recyclingImage}
  alt="People recycling waste"
  className="recycling-illustration"
/>
            
          </div>
          <p className="copyright">Urban Waste Reporting & Management System</p>
        </section>

        
<section className="auth-panel">
  <div className="auth-top-action">
    <span>
      {page === "register"
        ? "Already a user?"
        : "New User?"}
    </span>
    <button
      type="button"
      className="signup-btn"
      onClick={() => {
        setError("");
        setMessage("");
        setPage(page === "register" ? "login" : "register");
      }}
    >
      {page === "register" ? "Sign In" : "Sign Up"}
    </button>
  </div>

  <div className="auth-form-wrap">
    <h2>
      {isRegister ? "Create Account" : "Welcome Back!"}
    </h2>

    <p className="muted">
      {isRegister
        ? "Create an account to get started"
        : "Login to continue"}
    </p>

    {error && <div className="alert error">{error}</div>}
    {message && <div className="alert success">{message}</div>}

    <form onSubmit={handleAuth}>
      {isRegister && (
        <label>
          Full Name
          <input
            name="name"
            value={form.name}
            onChange={updateField}
            placeholder="Enter your full name"
            autoComplete="name"
            required
          />
        </label>
      )}

      <label>
        Email
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={updateField}
          placeholder="username@gmail.com"
          autoComplete="email"
          required
        />
      </label>

      <label>
        Password
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={updateField}
          placeholder="Enter your password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={isRegister ? 8 : undefined}
          required
        />
      </label>

      <div className="auth-actions">
        <button
          className="primary-btn login-btn"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Please wait..."
            : isRegister
              ? "Create Account"
              : "Login"}
        </button>

        {!isRegister && (
          <span className="forgot-password">
            Forgot Password?
          </span>
        )}
      </div>
    </form>

    {isRegister && (
      <p className="switch-auth">
        Already have an account?{" "}
        <button
          type="button"
          className="text-btn"
          onClick={() => {
            setError("");
            setMessage("");
            setPage("login");
          }}
        >
          Login
        </button>
      </p>
    )}
  </div>
</section>

      </main>
    );
  }

  const roleLabel = {
    citizen: "Citizen Portal",
    admin: "Admin Portal",
    worker: "Worker Portal",
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img
  src={smartTrashLogo}
  alt="EcoTrack logo"
  className="brand-logo"
/>
          <span>EcoTrack</span>
        </div>

        <div className="sidebar-label">WORKSPACE</div>
        <button className="nav-item active" onClick={() => loadComplaints()}>
          <span>▦</span> Dashboard
        </button>

        {user?.role === "citizen" && (
          <button
            className="nav-item"
            onClick={() => document.getElementById("complaint-form")?.scrollIntoView({ behavior: "smooth" })}
          >
            <span>＋</span> Report waste
          </button>
        )}

        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <strong>{user?.name}</strong>
              <small>{user?.role}</small>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            ↪ Sign out
          </button>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">URBAN WASTE MANAGEMENT</p>
            <h1>{roleLabel[user?.role] || "Dashboard"}</h1>
          </div>
          <div className="topbar-user">
            <span className="online-dot" />
            Signed in as <strong>{user?.role}</strong>
          </div>
        </header>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <section className="welcome-card">
          <div>
            <span className="eyebrow">YOUR COMMUNITY MATTERS</span>
            <h2>Hello, {user?.name} 👋</h2>
            <p>
              {user?.role === "citizen"
                ? "Report waste in your area and follow its progress."
                : user?.role === "admin"
                  ? "Manage complaints and keep waste collection moving."
                  : "Review your assigned complaints and update your progress."}
            </p>
          </div>
          <div className="welcome-symbol">♻</div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <span>Total shown</span>
            <strong>{complaints.length}</strong>
            <small>Complaints in this view</small>
          </article>
          <article className="stat-card">
            <span>Pending</span>
            <strong>{complaints.filter((c) => c.status === "Pending").length}</strong>
            <small>Awaiting action</small>
          </article>
          <article className="stat-card">
            <span>Resolved</span>
            <strong>{complaints.filter((c) => c.status === "Resolved").length}</strong>
            <small>Successfully completed</small>
          </article>
        </section>

        {user?.role === "admin" && (
  <section className="content-card">
    <div className="section-heading">
      <div>
        <span className="eyebrow">TEAM MANAGEMENT</span>
        <h2>Workers</h2>
        <p>Create accounts for waste collection workers.</p>
      </div>

      <button
        className="primary-btn"
        type="button"
        onClick={() => setShowWorkerForm(!showWorkerForm)}
      >
        {showWorkerForm ? "Cancel" : "+ Create Worker"}
      </button>
    </div>

    
{showWorkerForm && (
  <form className="complaint-form" onSubmit={createWorker}>
    <label>
      Worker Name
      <input
        type="text"
        value={workerForm.name}
        onChange={(e) =>
          setWorkerForm({ ...workerForm, name: e.target.value })
        }
        placeholder="Enter full name"
        required
      />
    </label>

    <label>
      Email Address
      <input
        type="email"
        value={workerForm.email}
        onChange={(e) =>
          setWorkerForm({ ...workerForm, email: e.target.value })
        }
        placeholder="worker@example.com"
        required
      />
    </label>

    <label>
      Phone Number
      <input
        type="tel"
        value={workerForm.phone}
        onChange={(e) =>
          setWorkerForm({ ...workerForm, phone: e.target.value })
        }
        placeholder="10-digit phone number"
        pattern="[0-9]{10}"
        maxLength={10}
        required
      />
    </label>

    <label>
      Address / Assigned Area
      <input
        type="text"
        value={workerForm.address}
        onChange={(e) =>
          setWorkerForm({ ...workerForm, address: e.target.value })
        }
        placeholder="Enter address or service area"
        required
      />
    </label>

    <label>
      Worker ID
      <input
        type="text"
        value={workerForm.workerId}
        onChange={(e) =>
          setWorkerForm({ ...workerForm, workerId: e.target.value })
        }
        placeholder="e.g. WRK001"
      />
    </label>

    <label>
      Vehicle Type
      <select
        value={workerForm.vehicleType}
        onChange={(e) =>
          setWorkerForm({
            ...workerForm,
            vehicleType: e.target.value
          })
        }
      >
        <option value="">Select Vehicle Type</option>
        <option value="Auto">Auto</option>
        <option value="Truck">Truck</option>
        <option value="Other">Other</option>
      </select>
    </label>

    <label>
      Password
      <input
        type="password"
        value={workerForm.password}
        onChange={(e) =>
          setWorkerForm({ ...workerForm, password: e.target.value })
        }
        placeholder="Minimum 8 characters"
        minLength={8}
        autoComplete="new-password"
        required
      />
    </label>

    <label>
      Confirm Password
      <input
        type="password"
        value={workerForm.confirmPassword}
        onChange={(e) =>
          setWorkerForm({
            ...workerForm,
            confirmPassword: e.target.value
          })
        }
        placeholder="Re-enter password"
        minLength={8}
        autoComplete="new-password"
        required
      />
    </label>

    <button
      className="primary-btn"
      type="submit"
      disabled={workerLoading}
    >
      {workerLoading ? "Creating..." : "Create Worker Account"}
    </button>
  </form>
)}


    <p>Registered workers: {workers.length}</p>
    {workers.map((worker) => (
      <p key={worker._id}>
        {worker.name} — {worker.email}
      </p>
    ))}
  </section>
)}

        {user?.role === "citizen" && (
          <section className="content-card" id="complaint-form">
            <div className="section-heading">
              <div>
                <span className="eyebrow">TAKE ACTION</span>
                <h2>Report waste</h2>
              </div>
            </div>
            <form className="complaint-form" onSubmit={submitComplaint}>
              <label>
                Waste category
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option>Household Waste</option>
                  <option>Plastic Waste</option>
                  <option>Industrial Waste</option>
                  <option>E-Waste</option>
                  <option>Construction Waste</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Location / address
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near college entrance"
                  required
                />
              </label>
              <div>
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={captureLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? "Getting location..." : "📍 Use my current GPS location"}
                </button>
                {coordinates.latitude !== null && (
                  <small style={{ display: "block", marginTop: 8 }}>
                    GPS captured: {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                  </small>
                )}
              </div>
              <label>
                Waste photo (image, max 5 MB)
                <input
                  id="complaint-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </label>
              {photoPreview && (
                <div style={{ margin: "8px 0 16px" }}>
                  <img
                    src={photoPreview}
                    alt="Selected waste preview"
                    style={{ width: "100%", maxWidth: 320, maxHeight: 240, objectFit: "cover", borderRadius: 10, border: "1px solid #e5e4e7" }}
                  />
                  <button
                    className="text-btn"
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setPhotoPreview("");
                      const fileInput = document.getElementById("complaint-photo");
                      if (fileInput) fileInput.value = "";
                    }}
                  >
                    Remove photo
                  </button>
                </div>
              )}
              <label>
                Description
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the waste issue..."
                  rows={3}
                  required
                />
              </label>
              <button className="primary-btn" type="submit" disabled={complaintLoading}>
                {complaintLoading ? "Submitting..." : "Submit complaint →"}
              </button>
            </form>
          </section>
        )}

        <section className="content-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LIVE RECORDS</span>
              <h2>
                {user?.role === "citizen"
                  ? "My complaints"
                  : user?.role === "admin"
                    ? "All complaints"
                    : "Assigned complaints"}
              </h2>
            </div>
            <button className="secondary-btn" onClick={() => loadComplaints()}>
              ↻ Refresh
            </button>
          </div>

          {complaints.length === 0 ? (
            <div className="empty-state">
              <span>♻</span>
              <h3>No complaints to display</h3>
              <p>New complaints will appear here when available.</p>
            </div>
          ) : (
            <div className="complaint-list">
              {complaints.map((complaint) => (
                <article className="complaint-row" key={complaint._id}>
                  <div className="complaint-icon">♻</div>
                  <div className="complaint-details">
                    <strong>{complaint.category}</strong>
                    <p>{complaint.description}</p>
                    <small>
                      {complaint.location?.address || "Location not provided"}
                    </small>
                    {complaint.location?.latitude != null && complaint.location?.longitude != null && (
                      <small>
                        GPS: {complaint.location.latitude}, {complaint.location.longitude}{" "}
                        · <a
                          href={`https://www.google.com/maps?q=${complaint.location.latitude},${complaint.location.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                        >View map</a>
                      </small>
                    )}
                    {complaint.photo && (
                      <div style={{ marginTop: 10 }}>
                        <a href={`https://ecotrack-backend-zzpm.onrender.com${complaint.photo}`} target="_blank" rel="noreferrer">
                          <img
                            src={`https://ecotrack-backend-zzpm.onrender.com${complaint.photo}`}
                            alt="Reported waste"
                            loading="lazy"
                            style={{ width: 160, maxHeight: 120, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e4e7" }}
                          />
                        </a>
                      </div>
                    )}

                    {user?.role === "citizen" && complaint.completionPhoto && (
  <div style={{ marginTop: 12 }}>
    <strong>✅ Cleaning completed</strong>

    <p>
      {complaint.acknowledgement ||
        "Your complaint has been resolved."}
    </p>

    <a
      href={`https://ecotrack-backend-zzpm.onrender.com${complaint.completionPhoto}`}
      target="_blank"
      rel="noreferrer"
    >
      <img
        src={`https://ecotrack-backend-zzpm.onrender.com${complaint.completionPhoto}`}
        alt="Cleaning completion proof"
        loading="lazy"
        style={{
          width: 200,
          maxHeight: 160,
          objectFit: "cover",
          borderRadius: 8,
          border: "1px solid #e5e4e7"
        }}
      />
    </a>

    {complaint.resolvedAt && (
      <small style={{ display: "block", marginTop: 6 }}>
        Resolved on: {new Date(complaint.resolvedAt).toLocaleString()}
      </small>
    )}
  </div>
)}
                    
{user?.role === "admin" && (
  <div style={{ marginTop: 10 }}>
    <small>
      Citizen: {complaint.citizen?.name || "Unknown"} · Worker:{" "}
      {complaint.assignedWorker?.name || "Unassigned"}
    </small>

    <div style={{ marginTop: 8 }}>
      <label>
        Assign worker:{" "}
        <select
          defaultValue=""
          onChange={(e) => {
            const workerId = e.target.value;
            if (workerId) {
              assignComplaint(complaint._id, workerId);
            }
          }}
        >
          <option value="">Select a worker</option>
          {workers.map((worker) => (
            <option key={worker._id} value={worker._id}>
              {worker.name} ({worker.email})
            </option>
          ))}
        </select>
      </label>
    </div>
  </div>
)}

                  </div>
                  <div className="complaint-actions">
                    {user?.role === "worker" &&
  complaint.status !== "Resolved" &&
  complaint.status !== "Rejected" && (
    <div style={{ marginTop: 12 }}>
      <label>
        Cleaning completion photo
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (!file) return;

            if (!file.type.startsWith("image/")) {
              setError("Please select an image file.");
              e.target.value = "";
              return;
            }

            if (file.size > 5 * 1024 * 1024) {
              setError("Image must be 5 MB or smaller.");
              e.target.value = "";
              return;
            }

            setError("");
            setCompletionPhotos((previous) => ({
              ...previous,
              [complaint._id]: file
            }));
          }}
        />
      </label>

      {completionPhotos[complaint._id] && (
        <p>
          Selected: {completionPhotos[complaint._id].name}
        </p>
      )}

      <button
        className="primary-btn"
        type="button"
        disabled={completingId === complaint._id}
        onClick={() => completeComplaint(complaint._id)}
      >
        {completingId === complaint._id
          ? "Completing..."
          : "Upload Photo & Complete"}
      </button>
    </div>
  )}
                    <span
                      className={`status status-${(complaint.status || "Pending")
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {complaint.status}
                    </span>
                    {(user?.role === "admin" || user?.role === "worker") && (
  <select
    aria-label="Update complaint status"
    value={complaint.status}
    onChange={(e) =>
      updateStatus(complaint._id, e.target.value)
    }
  >
    <option>Pending</option>
    <option>Assigned</option>
    <option>In Progress</option>
    {user?.role === "admin" && <option>Resolved</option>}
    {user?.role === "admin" && <option>Rejected</option>}
  </select>
)}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;
