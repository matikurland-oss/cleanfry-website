import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogPosts } from './blogData';
import { useSEO } from './useSEO';

const BlogPostDetail = () => {
  const { id } = useParams();
  const post = blogPosts.find((p) => p.id === id);

  // ה-hook נקרא תמיד (גם אם המאמר לא נמצא) כדי לא לשבור את סדר הקריאה ל-hooks בין רינדורים
  useSEO({
    title: post ? post.title : 'המאמר לא נמצא',
    description: post ? post.excerpt : 'המאמר המבוקש אינו קיים באתר CleanFry.',
    path: `/blog/${id ?? ''}`,
    image: post?.image
  });

  if (!post) {
    return (
      <div className="text-center py-24 bg-white min-h-screen" dir="rtl">
        <h1 className="text-2xl font-bold text-slate-800">המאמר לא נמצא.</h1>
        <Link to="/blog" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">← חזרה לבלוג</Link>
      </div>
    );
  }

  // הפונקציה הקריטית שהופכת את הטקסט למעוצב באתר
  // כותרות סעיף (<h2>...</h2>) מוצגות כ-heading אמיתי, לא עטופות ב-<p> - כדי שהמבנה הסמנטי
  // יהיה נכון גם לקוראי מסך וגם למנועי חיפוש (ראו blogData.ts)
  const renderContent = (content: string) => {
    return content.split('\n\n').map((paragraph, index) => {
      const headingMatch = paragraph.match(/^<h2>(.*)<\/h2>$/);
      if (headingMatch) {
        return (
          <h2 key={index} className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-12 mb-4">
            {headingMatch[1]}
          </h2>
        );
      }
      return (
        <p
          key={index}
          className="mb-8 leading-loose text-lg text-slate-700"
          dangerouslySetInnerHTML={{ __html: paragraph.replace(/\n/g, '<br />') }}
        />
      );
    });
  };

  const relatedPosts = blogPosts.filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <div className="bg-white min-h-screen py-12 px-4 md:py-20" dir="rtl">
      <div className="max-w-3xl mx-auto">
        
        <Link to="/blog" className="text-blue-600 hover:text-blue-800 mb-12 inline-flex items-center gap-2 font-medium transition-colors">
          <span>←</span> חזרה לבלוג
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-950 mb-4 leading-tight">
          {post.title}
        </h1>
        <p className="text-slate-400 mb-12 text-lg">{post.date}</p>
        
        {post.image && (
          <img
            src={post.image}
            alt={post.title}
            width={post.imageWidth}
            height={post.imageHeight}
            className="w-full h-auto max-h-[450px] object-contain mb-16 rounded-2xl shadow-lg border border-slate-100"
          />
        )}

        {/* כאן קורה הקסם שמציג את ההדגשות והקו התחתי */}
        <div className="prose prose-lg prose-slate max-w-none text-right font-sans">
          {renderContent(post.content)}
        </div>

        {relatedPosts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-slate-100">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-6">עוד מדריכים שיעניינו אתכם</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {relatedPosts.map((p) => (
                <Link
                  key={p.id}
                  to={`/blog/${p.id}`}
                  className="block bg-slate-50 hover:bg-slate-100 rounded-2xl p-5 transition-colors"
                >
                  <p className="font-bold text-slate-800 mb-2 leading-snug">{p.title}</p>
                  <p className="text-sm text-slate-500">{p.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-20 pt-10 border-t border-slate-100 text-center">
          <p className="text-slate-600 mb-4">אהבתם את המאמר? שתפו אותו!</p>
          <a 
            href={`https://wa.me/?text=${encodeURIComponent(`תראו את המאמר הזה על CleanFry: ${window.location.href}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition shadow-md"
          >
            שתפו ב-WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
};

export default BlogPostDetail;
