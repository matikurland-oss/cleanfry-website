import React from 'react';
import { Link } from 'react-router-dom';
import { blogPosts } from './blogData';
import { useSEO } from './useSEO';
import { pageShell, pageTitle } from './home/layout';

const BlogPage = () => {
  useSEO({
    title: 'הבלוג של CleanFry — טיפים לניקיון וטיפול בשמן בישול',
    description: 'מאמרים על טיפול נכון בשמן טיגון משומש, חיסכון בעלויות אינסטלציה וניקיון, וידידותיות לסביבה — הבלוג הרשמי של CleanFry.',
    path: '/blog'
  });

  return (
    <div className={pageShell}>
      <div className="mx-auto max-w-[1180px]">
        <h1 className={`${pageTitle} mb-10 text-center`}>הבלוג של CleanFry</h1>

        <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <li key={post.id}>
              <Link
                to={`/blog/${post.id}`}
                className="group flex h-full flex-col gap-4 rounded-[28px] border border-cf-border bg-white p-5 text-cf-navy no-underline transition-colors hover:border-cf-green/50"
              >
                <div className="flex h-48 items-center justify-center overflow-hidden rounded-[20px] bg-cf-green-light">
                  <img
                    src={post.image}
                    alt=""
                    loading="lazy"
                    className="max-h-full w-auto object-contain transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                  />
                </div>

                <div className="flex flex-grow flex-col gap-2 px-1">
                  <span className="text-[13px] font-medium text-cf-muted">{post.date}</span>
                  <h2 className="m-0 text-[21px] font-extrabold leading-snug transition-colors group-hover:text-cf-green-dark">{post.title}</h2>
                  <p className="m-0 line-clamp-3 text-[15px] leading-relaxed text-cf-body">{post.excerpt}</p>
                </div>

                <span className="mt-auto inline-flex items-center gap-1 border-t border-cf-border px-1 pt-4 text-[15px] font-bold text-cf-green-dark transition-all group-hover:gap-2">
                  קראו עוד <span aria-hidden="true">←</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BlogPage;
