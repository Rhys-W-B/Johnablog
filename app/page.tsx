"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { db } from "./firebaseConfig";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import GaugeComponent from "react-gauge-component";

interface Post {
  id: string;
  title: string;
  text: string;
  image?: string;
  createdAt: string;
}

interface Gauge {
  id: string;
  title: string;
  value: number;
  type: "radial" | "semicircle";
  colors: string[]; // color array for arc
  side: "left" | "right";
  createdAt: string;
}

export default function Home() {
  // Posts state (unchanged)
  const [posts, setPosts] = useState<Post[]>([]);
  const postsRef = collection(db, "posts");

  // Modals & post form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  // Auth (same simple admin-password system you already had)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const ADMIN_PASSWORD = "pesto0322";

  // Menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Gauges state
  const [gauges, setGauges] = useState<Gauge[]>([]);
  const gaugesRef = collection(db, "gauges");

  // Gauge modals & form state
  const [isGaugeModalOpen, setIsGaugeModalOpen] = useState(false);
  const [isGaugeEditModalOpen, setIsGaugeEditModalOpen] = useState(false);
  const [isGaugeDeleteModalOpen, setIsGaugeDeleteModalOpen] = useState(false);

  const [gaugeTitle, setGaugeTitle] = useState("");
  const [gaugeValue, setGaugeValue] = useState(50);
  const [gaugeType, setGaugeType] = useState<"radial" | "semicircle">("semicircle");
  const [gaugeColors, setGaugeColors] = useState<string[]>(["#22c55e", "#facc15", "#ef4444"]);
  const [gaugeSide, setGaugeSide] = useState<"left" | "right">("left");

  const [editingGauge, setEditingGauge] = useState<Gauge | null>(null);
  const [gaugeToDelete, setGaugeToDelete] = useState<Gauge | null>(null);

  // --- Realtime Firestore Sync for posts & gauges ---
  useEffect(() => {
    const postsQuery = query(postsRef, orderBy("createdAt", "desc"));
    const unsubPosts = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Post, "id">),
      }));
      setPosts(postsData);
    });

    const gaugesQuery = query(gaugesRef, orderBy("createdAt", "desc"));
    const unsubGauges = onSnapshot(gaugesQuery, (snapshot) => {
      const gaugesData = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Gauge, "id">),
      }));
      setGauges(gaugesData);
    });

    return () => {
      unsubPosts();
      unsubGauges();
    };
  }, []);

  // --- Add Post (unchanged) ---
  const handleAddPost = async () => {
    if (!title.trim() || !text.trim()) {
      alert("Both title and text are required.");
      return;
    }

    await addDoc(postsRef, {
      title: title.trim(),
      text: text.trim(),
      image: image || "",
      createdAt: new Date().toISOString(),
    });

    setTitle("");
    setText("");
    setImage(undefined);
    setIsModalOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // --- Delete Post (unchanged) ---
  const handleDeleteClick = (post: Post) => {
    if (!isAuthenticated) return;
    setPostToDelete(post);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (postToDelete) {
      await deleteDoc(doc(db, "posts", postToDelete.id));
      setPostToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  // --- Auth (unchanged) ---
  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setIsPasswordModalOpen(false);
      setPasswordInput("");
    } else {
      alert("Incorrect password");
    }
  };

  // ---------- Gauges CRUD ----------

  // Add Gauge
  const handleAddGauge = async () => {
    if (!isAuthenticated) {
      alert("Login as admin to add gauges.");
      return;
    }
    if (!gaugeTitle.trim()) {
      alert("Gauge title required.");
      return;
    }

    await addDoc(gaugesRef, {
      title: gaugeTitle.trim(),
      value: gaugeValue,
      type: gaugeType,
      colors: gaugeColors,
      side: gaugeSide,
      createdAt: new Date().toISOString(),
    });

    // reset
    setGaugeTitle("");
    setGaugeValue(50);
    setGaugeType("semicircle");
    setGaugeColors(["#22c55e", "#facc15", "#ef4444"]);
    setGaugeSide("left");
    setIsGaugeModalOpen(false);
  };

  // Open edit modal prefilled
  const openGaugeEdit = (g: Gauge) => {
    if (!isAuthenticated) return;
    setEditingGauge(g);
    setGaugeTitle(g.title);
    setGaugeValue(g.value);
    setGaugeType(g.type);
    setGaugeColors(g.colors.length ? g.colors : ["#22c55e", "#facc15", "#ef4444"]);
    setGaugeSide(g.side);
    setIsGaugeEditModalOpen(true);
  };

  // Update gauge
  const handleUpdateGauge = async () => {
    if (!editingGauge) return;
    const gaugeRef = doc(db, "gauges", editingGauge.id);
    await updateDoc(gaugeRef, {
      title: gaugeTitle.trim(),
      value: gaugeValue,
      type: gaugeType,
      colors: gaugeColors,
      side: gaugeSide,
    });
    setEditingGauge(null);
    setIsGaugeEditModalOpen(false);
  };

  // Delete gauge
  const handleGaugeDeleteClick = (g: Gauge) => {
    if (!isAuthenticated) return;
    setGaugeToDelete(g);
    setIsGaugeDeleteModalOpen(true);
  };

  const confirmGaugeDelete = async () => {
    if (!gaugeToDelete) return;
    await deleteDoc(doc(db, "gauges", gaugeToDelete.id));
    setGaugeToDelete(null);
    setIsGaugeDeleteModalOpen(false);
  };

  // Helpers: separate gauges by side
  const leftGauges = gauges.filter((g) => g.side === "left");
  const rightGauges = gauges.filter((g) => g.side === "right");

  // Simple color inputs handler (3 colors max)
  const setColorAt = (index: number, color: string) => {
    setGaugeColors((prev) => {
      const copy = [...prev];
      copy[index] = color;
      return copy;
    });
  };

  return (
    <>
      {/* MOBILE MENU */}
      <div className="fixed top-4 right-4 z-50 sm:hidden">
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-md shadow-sm"
        >
          <div className="space-y-1">
            <div className="w-5 h-0.5 bg-black"></div>
            <div className="w-5 h-0.5 bg-black"></div>
            <div className="w-5 h-0.5 bg-black"></div>
          </div>
        </button>

        {isMenuOpen && (
          <div className="fixed inset-0 bg-black/30 z-50 flex justify-end">
            <div className="bg-white w-48 h-full shadow-lg p-4 flex flex-col">
              <button onClick={() => setIsMenuOpen(false)} className="self-end mb-6 text-gray-500 hover:text-black">
                ✕
              </button>
              <button
                onClick={() => {
                  setIsPasswordModalOpen(true);
                  setIsMenuOpen(false);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded-md text-sm"
              >
                {isAuthenticated ? "Logged In" : "Login"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="min-h-screen bg-white flex flex-col items-center p-4 font-sans mt-16 lg:mt-4">
        {/* DESKTOP LOGIN */}
        <button
          onClick={() => setIsPasswordModalOpen(true)}
          className="hidden sm:block fixed top-4 right-4 z-40 text-sm bg-gray-200 hover:bg-gray-300 text-black px-3 py-1.5 rounded-md"
        >
          {isAuthenticated ? "Logged In" : "Login"}
        </button>

        {/* NEW POST & NEW GAUGE BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none justify-center">
          {isAuthenticated && (
            <>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-md mt-6 mb-8 transition w-full max-w-xs sm:max-w-sm"
              >
                New Post
              </button>
              <button
                onClick={() => setIsGaugeModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md mt-6 mb-8 transition w-full max-w-xs sm:max-w-sm"
              >
                New Gauge
              </button>
            </>
          )}
        </div>

        {/* --- SWIPE CONTAINER --- */}
        <div className="flex w-full max-w-6xl h-[calc(100vh-8rem)] lg:h-auto">
          <div className="flex lg:flex-row flex-nowrap overflow-x-auto lg:overflow-visible snap-x snap-mandatory scroll-smooth w-full">
            {/* LEFT GAUGE PAGE (list of left gauges) */}
            <section className="snap-center shrink-0 w-full lg:w-1/3 flex flex-col gap-6 justify-start items-center p-6">
              {leftGauges.length === 0 && (
                <p className="text-gray-500 text-center text-sm sm:text-base">
                  No left gauges yet. {isAuthenticated ? "Create one!" : "Login to add gauges."}
                </p>
              )}
              {leftGauges.map((g) => (
                <div
                  key={g.id}
                  className="w-full bg-white rounded-xl shadow-sm p-4 flex flex-col items-center relative"
                >
                  {isAuthenticated && (
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button onClick={() => openGaugeEdit(g)} className="text-blue-600 hover:underline text-sm">
                        Edit
                      </button>
                      <button
                        onClick={() => handleGaugeDeleteClick(g)}
                        className="text-red-500 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold mb-3">{g.title}</h3>
                  <GaugeComponent
                    value={g.value}
                    type={g.type}
                    arc={{ colorArray: g.colors, width: 0.2 }}
                    pointer={{ color: "#000" }}
                    labels={{
                      valueLabel: { formatTextValue: (val) => `${val}%` },
                      tickLabels: { type: "outer", ticks: [{ value: 0 }, { value: 50 }, { value: 100 }] },
                    }}
                  />
                </div>
              ))}
            </section>

            {/* POSTS PAGE */}
            <section className="snap-center shrink-0 w-full lg:w-1/3 flex flex-col gap-6 overflow-y-auto p-4">
              {posts.length === 0 && (
                <p className="text-gray-500 text-center text-sm sm:text-base">
                  No posts yet. {isAuthenticated ? "Create one above!" : "Login to create posts."}
                </p>
              )}
              {posts.map((post) => (
                <div key={post.id} className="border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6 relative">
                  {isAuthenticated && (
                    <button
                      onClick={() => handleDeleteClick(post)}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  )}
                  <h2 className="text-xl sm:text-2xl font-semibold mb-1 text-gray-900">{post.title}</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mb-3">{new Date(post.createdAt).toLocaleString()}</p>
                  {post.image && (
                    <Image
                      src={post.image}
                      alt="Post image"
                      width={800}
                      height={400}
                      className="w-full h-auto rounded-md mb-3"
                    />
                  )}
                  <p className="text-gray-800 whitespace-pre-wrap text-sm sm:text-base">{post.text}</p>
                </div>
              ))}
            </section>

            {/* RIGHT GAUGE PAGE (list of right gauges) */}
            <section className="snap-center shrink-0 w-full lg:w-1/3 flex flex-col gap-6 justify-start items-center p-6 ">
              {rightGauges.length === 0 && (
                <p className="text-gray-500 text-center text-sm sm:text-base">
                  No right gauges yet. {isAuthenticated ? "Create one!" : "Login to add gauges."}
                </p>
              )}
              {rightGauges.map((g) => (
                <div
                  key={g.id}
                  className="w-full bg-white rounded-xl shadow-sm p-4 flex flex-col items-center relative"
                >
                  {isAuthenticated && (
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button onClick={() => openGaugeEdit(g)} className="text-blue-600 hover:underline text-sm">
                        Edit
                      </button>
                      <button
                        onClick={() => handleGaugeDeleteClick(g)}
                        className="text-red-500 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  <h3 className="text-lg font-semibold mb-3">{g.title}</h3>
                  <GaugeComponent
                    value={g.value}
                    type={g.type}
                    arc={{ colorArray: g.colors, width: 0.2 }}
                    pointer={{ color: "#000" }}
                    labels={{
                      valueLabel: { formatTextValue: (val) => `${val}%` },
                      tickLabels: { type: "outer", ticks: [{ value: 0 }, { value: 50 }, { value: 100 }] },
                    }}
                  />
                </div>
              ))}
            </section>
          </div>
        </div>

        {/* --- CREATE POST MODAL --- */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white w-full max-w-md rounded-xl p-6 sm:p-8 relative shadow-lg">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">Create a New Post</h2>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title"
                className="w-full border border-gray-300 rounded-md p-2 sm:p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
                required
              />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your post..."
                className="w-full border border-gray-300 rounded-md p-2 sm:p-3 mb-4 resize-none h-32 sm:h-40 focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
                required
              />
              <input type="file" accept="image/*" onChange={handleImageUpload} className="mb-4 text-sm" />
              {image && <Image src={image} alt="Preview" width={400} height={200} className="w-full rounded-md mb-4" />}
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-400 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button onClick={handleAddPost} className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800">
                  Add Post
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE POST MODAL */}
        {isDeleteModalOpen && postToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-sm rounded-xl p-6 text-center shadow-lg">
              <h2 className="text-lg font-semibold mb-3">Delete "{postToDelete.title}"?</h2>
              <p className="text-gray-600 mb-6 text-sm">This action cannot be undone.</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 border border-gray-400 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- CREATE GAUGE MODAL --- */}
        {isGaugeModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-md rounded-xl p-6 relative shadow-lg">
              <h2 className="text-lg font-semibold mb-4 text-center">Create a New Gauge</h2>

              <input
                type="text"
                value={gaugeTitle}
                onChange={(e) => setGaugeTitle(e.target.value)}
                placeholder="Gauge title"
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
              />

              <label className="block mb-2 text-sm font-medium">Value: {gaugeValue}</label>
              <input
                type="range"
                min="0"
                max="100"
                value={gaugeValue}
                onChange={(e) => setGaugeValue(Number(e.target.value))}
                className="w-full mb-4"
              />

              <label className="block mb-2 text-sm font-medium">Type</label>
              <select
                value={gaugeType}
                onChange={(e) => setGaugeType(e.target.value as "radial" | "semicircle")}
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
              >
                <option value="semicircle">Semicircle</option>
                <option value="radial">Radial</option>
              </select>

              <label className="block mb-2 text-sm font-medium">Side</label>
              <select
                value={gaugeSide}
                onChange={(e) => setGaugeSide(e.target.value as "left" | "right")}
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>

              <label className="block mb-2 text-sm font-medium">Colors (up to 3)</label>
              <div className="flex gap-2 mb-4">
                <input
                  type="color"
                  value={gaugeColors[0] || "#22c55e"}
                  onChange={(e) => setColorAt(0, e.target.value)}
                  className="w-12 h-8 p-0"
                />
                <input
                  type="color"
                  value={gaugeColors[1] || "#facc15"}
                  onChange={(e) => setColorAt(1, e.target.value)}
                  className="w-12 h-8 p-0"
                />
                <input
                  type="color"
                  value={gaugeColors[2] || "#ef4444"}
                  onChange={(e) => setColorAt(2, e.target.value)}
                  className="w-12 h-8 p-0"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setIsGaugeModalOpen(false)}
                  className="px-4 py-2 border border-gray-400 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddGauge}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Gauge
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- EDIT GAUGE MODAL --- */}
        {isGaugeEditModalOpen && editingGauge && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-md rounded-xl p-6 relative shadow-lg">
              <h2 className="text-lg font-semibold mb-4 text-center">Edit Gauge</h2>

              <input
                type="text"
                value={gaugeTitle}
                onChange={(e) => setGaugeTitle(e.target.value)}
                placeholder="Gauge title"
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
              />

              <label className="block mb-2 text-sm font-medium">Value: {gaugeValue}</label>
              <input
                type="range"
                min="0"
                max="100"
                value={gaugeValue}
                onChange={(e) => setGaugeValue(Number(e.target.value))}
                className="w-full mb-4"
              />

              <label className="block mb-2 text-sm font-medium">Type</label>
              <select
                value={gaugeType}
                onChange={(e) => setGaugeType(e.target.value as "radial" | "semicircle")}
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
              >
                <option value="semicircle">Semicircle</option>
                <option value="radial">Radial</option>
              </select>

              <label className="block mb-2 text-sm font-medium">Side</label>
              <select
                value={gaugeSide}
                onChange={(e) => setGaugeSide(e.target.value as "left" | "right")}
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>

              <label className="block mb-2 text-sm font-medium">Colors (up to 3)</label>
              <div className="flex gap-2 mb-4">
                <input
                  type="color"
                  value={gaugeColors[0] || "#22c55e"}
                  onChange={(e) => setColorAt(0, e.target.value)}
                  className="w-12 h-8 p-0"
                />
                <input
                  type="color"
                  value={gaugeColors[1] || "#facc15"}
                  onChange={(e) => setColorAt(1, e.target.value)}
                  className="w-12 h-8 p-0"
                />
                <input
                  type="color"
                  value={gaugeColors[2] || "#ef4444"}
                  onChange={(e) => setColorAt(2, e.target.value)}
                  className="w-12 h-8 p-0"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => {
                    setIsGaugeEditModalOpen(false);
                    setEditingGauge(null);
                  }}
                  className="px-4 py-2 border border-gray-400 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateGauge}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- DELETE GAUGE MODAL --- */}
        {isGaugeDeleteModalOpen && gaugeToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-sm rounded-xl p-6 text-center shadow-lg">
              <h2 className="text-lg font-semibold mb-3">Delete "{gaugeToDelete.title}"?</h2>
              <p className="text-gray-600 mb-6 text-sm">This action cannot be undone.</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setIsGaugeDeleteModalOpen(false)}
                  className="px-4 py-2 border border-gray-400 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmGaugeDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASSWORD MODAL (unchanged) */}
        {isPasswordModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-sm rounded-xl p-6 text-center shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Enter Admin Password</h2>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                placeholder="Password"
              />
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 border border-gray-400 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
