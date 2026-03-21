import React from 'react';
import { Link } from 'react-router-dom';
import { blogPosts } from './blogData';

const BlogPage = () => {
  return (
    <div className="bg-white min-h-screen py-12 px-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12 text-slate-900 font-sans">הבלוג של CleanFry</h1>
        
        {/* רשת המלבנים (Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-right">
          {blogPosts.map((post) => (
            <Link to={`/blog/${post.id}`} key={post.id} className="group inline-block">
              {/* מלבן הבלוג המעוצב */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
                
                {/* תמונת המאמר */}
                <div className="overflow-hidden rounded-xl mb-6 bg-slate-50 h-48 flex items-center justify-center">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="max-h-full w-auto object-contain group-hover:scale-105 transition duration-500" 
                  />
                </div>

                {/* תוכן המאמר */}
                <div className="flex-grow">
                  <span className="text-xs font-medium text-slate-400 block mb-2">{post.date}</span>
                  <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                {/* כפתור קריאה עוד */}
                <div className="mt-6 pt-4 border-t border-slate-50">
                  <span className="text-blue-600 text-sm font-bold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    קראו עוד 
                    <span className="text-lg">←</span>
                  </span>
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
