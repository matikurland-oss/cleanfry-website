import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogPosts } from './blogData';
import { useSEO } from './useSEO';
import { btnPrimary, pageShell, pageTitle } from './home/layout';

const backLink = 'inline-flex min-h-11 items-center gap-2 font-bold text-cf-green-dark no-underline hover:underline';

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
      <div className={`${pageShell} text-center`}>
        <h1 className={pageTitle}>המאמר לא נמצא.</h1>
        <Link to="/blog" className={`${backLink} mt-6`}><span aria-hidden="true">→</span> חזרה לבלוג</Link>
      </div>
    );
  }

  // הפונקציה הקריטית שהופכת את הטקסט למעוצב באתר
  const renderContent = (content: string) => {
    return content.split('\n\n').map((paragraph, index) => (
      <p
        key={index}
        className="mb-7 mt-0 text-lg leading-loose text-cf-body [&_b]:font-extrabold [&_b]:text-cf-navy"
        dangerouslySetInnerHTML={{ __html: paragraph.replace(/\n/g, '<br />') }}
      />
    ));
  };

  return (
    <div className={pageShell}>
      <article className="mx-auto max-w-[760px]">
        <Link to="/blog" className={`${backLink} mb-8`}>
          <span aria-hidden="true">→</span> חזרה לבלוג
        </Link>

        <h1 className={`${pageTitle} mb-3`}>{post.title}</h1>
        <p className="mb-10 mt-0 text-base font-medium text-cf-muted">{post.date}</p>

        {post.image && (
          <div className="mb-12 flex justify-center overflow-hidden rounded-[28px] border border-cf-border bg-cf-green-light">
            <img src={post.image} alt={post.title} className="h-auto max-h-[450px] w-full object-contain" />
          </div>
        )}

        <div className="max-w-none">
          {renderContent(post.content)}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 rounded-[28px] border border-cf-border bg-white p-8 text-center">
          <p className="m-0 text-lg font-bold">אהבתם את המאמר? שתפו אותו!</p>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`תראו את המאמר הזה על CleanFry: ${window.location.href}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={btnPrimary}
          >
            שתפו ב-WhatsApp
          </a>
        </div>
      </article>
    </div>
  );
};

export default BlogPostDetail;
