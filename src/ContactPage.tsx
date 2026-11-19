import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSEO } from './useSEO';
import { btnPrimary, field, notice, pageShell, pageTitle } from './home/layout';

const ContactPage = () => {
  const [status, setStatus] = useState<"IDLE" | "SUBMITTING" | "ERROR">("IDLE");
  const navigate = useNavigate();

  useSEO({
    title: 'צור קשר - CleanFry',
    description: 'יש לכם שאלה על CleanFry או על ההזמנה שלכם? צרו איתנו קשר ונחזור אליכם בהקדם.',
    path: '/contact'
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("SUBMITTING");

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("https://formspree.io/f/xvzwnrla", {
        method: "POST",
        body: data,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        navigate('/thanks');
      } else {
        setStatus("ERROR");
      }
    } catch (error) {
      setStatus("ERROR");
    }
  };

  const label = 'mb-1.5 block text-[15px] font-bold text-cf-navy';

  return (
    <div className={pageShell}>
      <div className="mx-auto grid max-w-[1040px] items-stretch gap-7 md:grid-cols-[1.4fr_1fr]">

        {/* טופס */}
        <div className="rounded-[28px] border border-cf-border bg-white p-[clamp(24px,4vw,48px)] md:rounded-[36px]">
          <h1 className={`${pageTitle} mb-3`}>דברו איתנו</h1>
          <p className="mb-8 mt-0 text-[17px] leading-relaxed text-cf-body">
            נשמח לשמוע מכם! מלאו את הפרטים ונחזור אליכם בהקדם.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="name" className={label}>שם מלא</label>
              <input type="text" name="name" id="name" required autoComplete="name" className={field} />
            </div>

            <div>
              <label htmlFor="email" className={label}>אימייל לחזרה</label>
              <input type="email" name="email" id="email" required autoComplete="email" className={field} />
            </div>

            <div>
              <label htmlFor="message" className={label}>איך נוכל לעזור?</label>
              <textarea name="message" id="message" rows={4} required className={`${field} resize-none`}></textarea>
            </div>

            <button type="submit" disabled={status === "SUBMITTING"} className={`${btnPrimary} w-full`}>
              {status === "SUBMITTING" ? "שולח..." : "שלח הודעה"}
            </button>

            {status === "ERROR" && (
              <p role="alert" className={`${notice.error} m-0 text-center`}>אופס! קרתה שגיאה. נסו שוב מאוחר יותר.</p>
            )}
          </form>
        </div>

        {/* פרטי התקשרות */}
        <aside aria-labelledby="contact-details-title" className="cf-on-navy flex flex-col justify-center gap-8 rounded-[28px] bg-cf-navy p-[clamp(24px,4vw,40px)] text-cf-cream md:rounded-[36px]">
          <h2 id="contact-details-title" className="m-0 text-2xl font-extrabold">פרטי התקשרות</h2>
          <div className="flex items-center gap-4">
            <span className="inline-flex h-14 w-14 flex-none items-center justify-center rounded-[18px] bg-cf-green-light text-cf-green-dark" aria-hidden="true">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <div>
              <p className="m-0 text-sm text-cf-on-navy">שלחו לנו מייל</p>
              <a href="mailto:info@cleanfry.co.il" className="text-lg font-bold text-cf-cream underline-offset-4 hover:underline">info@cleanfry.co.il</a>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default ContactPage;
