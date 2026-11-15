import React, { useState } from 'react';
import { container, gutter } from './layout';

// טופס ההרשמה הקיים ל-MailerLite (הועבר מה-footer). לוגיקת השליחה זהה לקודמת.
export default function CommunitySection() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('fields[email]', email);
    formData.append('ml-submit', '1');
    formData.append('anticsrf', 'true');

    try {
      await fetch('https://assets.mailerlite.com/jsonp/2287697/forms/192459816098071872/subscribe', {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      });

      setIsSubmitted(true);
      setEmail('');
    } catch (error) {
      console.error('MailerLite subscription error:', error);
    }
  };

  return (
    <section aria-labelledby="community-title" className={`${gutter} pb-[clamp(56px,7vw,88px)]`}>
      <div className={`${container} flex flex-wrap items-center justify-between gap-6 border-t border-cf-border pt-12`}>
        <div className="min-w-0 flex-[1_1_360px]">
          <h2 id="community-title" className="m-0 text-[30px] font-black">הצטרפו לקהילה</h2>
        </div>
        <div className="min-w-0 flex-[1_1_420px]">
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-2.5">
            <label htmlFor="cf-email" className="sr-only">כתובת אימייל</label>
            <input
              id="cf-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="האימייל שלך"
              className="min-h-14 min-w-0 flex-[1_1_240px] rounded-full border-2 border-cf-navy bg-white px-[22px] text-right text-base text-cf-navy placeholder:text-cf-muted"
            />
            <button type="submit" className="min-h-14 rounded-full bg-cf-navy px-[30px] text-[17px] font-extrabold text-cf-cream transition-transform hover:-translate-y-0.5 motion-reduce:transform-none">
              שלח
            </button>
          </form>
          <p role="status" className="mb-0 mt-2 min-h-6 text-sm font-bold text-cf-green-dark">
            {isSubmitted ? '✓ נרשמתם בהצלחה!' : ''}
          </p>
        </div>
      </div>
    </section>
  );
}
