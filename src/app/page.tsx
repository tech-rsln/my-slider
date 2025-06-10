"use client";
import { useState } from "react";

interface ITopic {
  id: number;
  title: string;
  description: string;
}

interface IPost {
  id: number;
  user: {
    id: number;
    name: string;
  };
  description: string;
  createdDate: string;
}

const topics: ITopic[] = Array.from({ length: 30 }, (_, index) => ({
  id: index + 1,
  description: `This is a test topic number ${index + 1}.`,
  title: `Topic ${index + 1}`,
}));

const initialPosts: IPost[] = Array.from({ length: 30 }, (_, index) => ({
  id: index + 1,
  user: {
    id: 100 + (index % 10),
    name: `User ${index % 10}`,
  },
  description: `This is a test post number ${index + 1}.`,
  createdDate: new Date(Date.now() - index * 86400000).toISOString(),
}));

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [posts, setPosts] = useState(initialPosts);
  const [draggedPost, setDraggedPost] = useState<IPost | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleDragStart = (post: IPost, index: number) => {
    setDraggedPost(post);
    setDraggingIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const handleDrop = (index: number) => {
    if (draggedPost) {
      const newPosts = posts.filter((post) => post.id !== draggedPost.id);
      newPosts.splice(index, 0, draggedPost);
      setPosts(newPosts);
      setDraggedPost(null);
      setDraggingIndex(null);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-12 gap-4  ">
        <div className="sticky top-20 z-20 shadow-md col-span-3 custom-height rounded-md overflow-auto">
          <h2 className="sticky top-0 text-xl font-bold mb-4 bg-[#fafafa] z-30  p-2">
            Gündemdeki Maddeler
          </h2>
          <ul className="space-y-2 p-2">
            {topics.map((topic) => (
              <li key={topic.id} className="p-2 border-b border-gray-200">
                <a className="text-blue-500 hover:underline">{topic.title}</a>
                <p className="text-sm text-gray-600">{topic.description}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-span-9 flex flex-col gap-4">
          <div className="flex justify-end items-center w-full gap-1">
            <a
              href="/announcement"
              className="bg-blue-500 text-white p-2 rounded-md"
            >
              Duyuru Oluştur
            </a>
            <button
              onClick={handleOpenModal}
              className="bg-blue-500 text-white p-2 rounded-md"
            >
              Ekle
            </button>
          </div>
          {posts.map((post, index) => (
            <div
              key={post.id}
              draggable
              onDragStart={() => handleDragStart(post, index)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              className={`flex items-center gap-1 pb-4 pt-4  shadow-lg border-l-4 border-blue-300 rounded-md ${
                draggingIndex === index ? "shadow-2xl bg-white" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                className="size-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
                />
              </svg>

              <p>{post.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{ display: isModalOpen ? "flex" : "none" }}
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      >
        <div className="bg-white p-6 rounded-md shadow-lg">
          <h2 className="text-xl font-bold mb-4">Modal Başlığı</h2>
          <p>Bu bir modal içerik örneğidir.</p>
          <button
            onClick={handleCloseModal}
            className="mt-4 bg-red-500 text-white p-2 rounded-md"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
