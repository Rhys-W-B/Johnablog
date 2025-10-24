"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { db } from "./firebaseConfig";
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp, deleteDoc, doc } from "firebase/firestore";

interface Post {
  id: string;
  title: string;
  text: string;
  image?: string;
  createdAt: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);

  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const postsRef = collection(db, "posts");
  const ADMIN_PASSWORD = "pesto0322"; // <--- change this to whatever you want

  // Listen for real-time updates
  useEffect(() => {
    const q = query(postsRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Post, "id">),
      }));
      setPosts(postsData);
    });
    return () => unsubscribe();
  }, []);

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

  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setIsPasswordModalOpen(false);
      setPasswordInput("");
    } else {
      alert("Incorrect password");
    }
  };

  return (
    <>
      {/* --- MOBILE HAMBURGER MENU (fixed to viewport) --- */}
      <div className="fixed top-4 right-4 z-50 sm:hidden">
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-md shadow-sm focus:outline-none"
        >
          <div className="space-y-1">
            <div className="w-5 h-0.5 bg-black"></div>
            <div className="w-5 h-0.5 bg-black"></div>
            <div className="w-5 h-0.5 bg-black"></div>
          </div>
        </button>

        {/* Slide-out menu */}
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
      <div className="min-h-screen bg-white flex flex-col items-center p-4 font-sans mt-16 lg:mt-4">
        {/* --- DESKTOP LOGIN BUTTON --- */}
        <button
          onClick={() => setIsPasswordModalOpen(true)}
          className="hidden sm:block fixed top-4 right-4 z-40 text-sm bg-gray-200 hover:bg-gray-300 text-black px-3 py-1.5 rounded-md"
        >
          {isAuthenticated ? "Logged In" : "Login"}
        </button>

        {/* Blog Posts */}
        <div className="w-full max-w-2xl flex flex-col gap-6 pb-12">
          {posts.length === 0 && (
            <p className="text-gray-500 text-center text-sm sm:text-base">
              No posts yet. {isAuthenticated ? "Create one above!" : "Login to create posts."}
            </p>
          )}
          {posts.map((post) => (
            <div key={post.id} className="border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6 relative">
              {/* Delete Button */}
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
        </div>

        {/* Create Post Modal */}
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

              {image && (
                <Image src={image} alt="Preview" width={400} height={200} className="w-full h-auto rounded-md mb-4" />
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-400 rounded-md hover:bg-gray-100 w-full sm:w-auto text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPost}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 w-full sm:w-auto text-sm sm:text-base"
                >
                  Add Post
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
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

        {/* Password Modal */}
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
