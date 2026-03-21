import React from 'react';
import { Link } from 'react-router-dom';
import { blogPosts } from './blogData';

const BlogPage = () => {
  return (
    <div className="bg-white min-h-screen py-12 px-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-slate-900">הבלוג של CleanFry</h1>
        
        {/* רשת המלבנים (Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <Link to={`/blog/${post.id}`} key={post.id} className="group">
              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-300">
                <img src={post.image} alt={post.title} className="w-full h-48 object-contain bg-slate-50 group-hover:scale-105 transition duration-300" />
                <div className="p-6">
                  <span className="text-xs text-slate-400">{post.date}</span>
                  <h2 className="text-xl font-bold text-slate-900 mt-2 mb-3 group-hover:text-blue-600 transition">{post.title}</h2>
                  <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">{post.excerpt}</p>
                  <span className="text-blue-600 text-sm font-semibold mt-4 inline-block">קראו עוד ←</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogPage;
