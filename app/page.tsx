"use client";

import { useState } from "react";
import Image from "next/image";

interface Post {
  id: number;
  title: string;
  text: string;
  image?: string;
  createdAt: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);

  const handleAddPost = () => {
    if (!title.trim() || !text.trim()) {
      alert("Both title and text are required.");
      return;
    }

    const newPost: Post = {
      id: Date.now(),
      title: title.trim(),
      text: text.trim(),
      image,
      createdAt: new Date().toLocaleString(),
    };

    setPosts([newPost, ...posts]);
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

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-4 font-sans">
      {/* Header */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-black text-white px-6 py-2 rounded-md mt-6 mb-8 hover:bg-gray-800 transition w-full max-w-xs sm:max-w-sm"
      >
        New Post
      </button>

      {/* Blog Posts */}
      <div className="w-full max-w-2xl flex flex-col gap-6 pb-12">
        {posts.length === 0 && (
          <p className="text-gray-500 text-center text-sm sm:text-base">No posts yet. Create one above!</p>
        )}
        {posts.map((post) => (
          <div key={post.id} className="border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold mb-1 text-gray-900">{post.title}</h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-3">{post.createdAt}</p>

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

      {/* Modal */}
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
    </div>
  );
}
