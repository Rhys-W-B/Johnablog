"use client";

import { useState } from "react";
import Image from "next/image";

interface Post {
  id: number;
  text: string;
  image?: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);

  const handleAddPost = () => {
    if (!text.trim()) return alert("Text is required.");

    const newPost: Post = {
      id: Date.now(),
      text: text.trim(),
      image,
    };
    setPosts([newPost, ...posts]);
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
        className="bg-black text-white px-6 py-2 rounded-md mt-6 mb-8 hover:bg-gray-800 transition"
      >
        New Post
      </button>

      {/* Blog Posts */}
      <div className="w-full max-w-2xl flex flex-col gap-6">
        {posts.length === 0 && <p className="text-gray-500 text-center">No posts yet. Create one above!</p>}
        {posts.map((post) => (
          <div key={post.id} className="border border-gray-200 rounded-xl shadow-sm p-4">
            {post.image && (
              <Image
                src={post.image}
                alt="Post image"
                width={800}
                height={400}
                className="w-full h-auto rounded-md mb-3"
              />
            )}
            <p className="text-gray-800 whitespace-pre-wrap">{post.text}</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-xl p-6 relative">
            <h2 className="text-xl font-semibold mb-4">Create a New Post</h2>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write something..."
              className="w-full border border-gray-300 rounded-md p-2 mb-4 resize-none h-32 focus:outline-none focus:ring-2 focus:ring-black"
              required
            />

            <input type="file" accept="image/*" onChange={handleImageUpload} className="mb-4" />

            {image && (
              <Image src={image} alt="Preview" width={400} height={200} className="w-full h-auto rounded-md mb-4" />
            )}

            <div className="flex justify-end gap-3">
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
    </div>
  );
}
