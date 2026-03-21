import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogPosts } from './blogData';

const BlogPostDetail = () => {
  const { id } = useParams();
  const post = blogPosts.find((p) => p.id === id);

  if (!post) {
    return (
      <div className="text-center py-24 bg-white min-h-screen" dir="rtl">
        <h1 className="text-2xl font-bold text-slate-800">המאמר לא נמצא.</h1>
        <Link to="/blog" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">← חזרה לבלוג</Link>
      </div>
    );
  }

  // פונקציה להפיכת הטקסט הגולמי לפסקאות HTML
  const renderContent = (content: string) => {
    return content.split('\n\n').map((paragraph, index) => (
      <p key={index} className="mb-6 leading-loose">
        {paragraph.split('\n').map((line, lineIndex) => (
          <React.Fragment key={lineIndex}>
            {line}
            {lineIndex < paragraph.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    ));
  };

  return (
    <div className="bg-white min-h-screen py-12 px-4 md:py-20" dir="rtl">
      <div className="max-w-3xl mx-auto">
        
        {/* כפתור חזרה */}
        <Link to="/blog" className="text-blue-600 hover:text-blue-800 mb-12 inline-flex items-center gap-2 font-medium transition-colors">
          <span>←</span> חזרה לבלוג
        </Link>
        
        {/* כותרת ותמונה */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-950 mb-4 leading-tight">
          {post.title}
        </h1>
        <p className="text-slate-400 mb-12 text-lg">{post.date}</p>
        
        {post.image && (
          <img 
            src={post.image} 
            alt={post.title} 
            className="w-full h-auto max-h-[400px] object-contain mb-16 rounded-2xl shadow-lg border border-slate-100" 
          />
        )}

        {/* תוכן המאמר המעוצב */}
        <div className="prose prose-lg prose-slate max-w-none text-slate-800 text-right leading-relaxed font-sans">
          {renderContent(post.content)}
        </div>

        {/* פוטר המאמר */}
        <div className="mt-20 pt-10 border-t border-slate-100 text-center">
          <p className="text-slate-600 mb-4">אהבתם את המאמר? שתפו אותו!</p>
          <a 
            href={`https://wa.me/?text=${encodeURIComponent(`תראו את המאמר הזה על CleanFry: ${window.location.href}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition"
          >
            שתפו ב-WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
};

export default BlogPostDetail;
