import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogPosts } from './blogData';

const BlogPostDetail = () => {
  const { id } = useParams();
  const post = blogPosts.find((p) => p.id === id);

  if (!post) return <div className="text-center py-20">המאמר לא נמצא.</div>;

  return (
    <div className="bg-white min-h-screen py-12 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <Link to="/blog" className="text-blue-600 mb-8 inline-block">← חזרה לבלוג</Link>
        <img src={post.image} alt={post.title} className="w-full h-64 object-contain mb-8" />
        <h1 className="text-4xl font-bold text-slate-900 mb-4">{post.title}</h1>
        <p className="text-slate-400 mb-8">{post.date}</p>
        <div className="prose prose-lg max-w-none text-slate-700 leading-loose text-right">
          {post.content}
        </div>
      </div>
    </div>
  );
};

export default BlogPostDetail;
