import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ContactPage = () => {
  const [status, setStatus] = useState<"IDLE" | "SUBMITTING" | "ERROR">("IDLE");
  const navigate = useNavigate();

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
        // הצלחה! מעבירים לדף התודה המעוצב שלנו
        navigate('/thanks');
      } else {
        setStatus("ERROR");
      }
    } catch (error) {
      setStatus("ERROR");
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-4 font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100">
          
          {/* צד שמאל - טופס */}
          <div>
            <h1 className="text-3xl font-extrabold text-slate-950 mb-2">דברו איתנו</h1>
            <p className="text-slate-600 mb-8 leading-relaxed">
              נשמח לשמוע מכם! מלאו את הפרטים ונחזור אליכם בהקדם.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">שם מלא</label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">אימייל לחזרה</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-1">איך נוכל לעזור?</label>
                <textarea
                  name="message"
                  id="message"
                  rows={4}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={status === "SUBMITTING"}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-md ${
                  status === "SUBMITTING" ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 transform hover:-translate-y-0.5'
                }`}
              >
                {status === "SUBMITTING" ? "שולח..." : "שלח הודעה"}
              </button>

              {status === "ERROR" && (
                <p className="text-red-500 text-sm mt-2 text-center">אופס! קרתה שגיאה. נסו שוב מאוחר יותר.</p>
              )}
            </form>
          </div>

          {/* צד ימין - פרטי קשר וצד ויזואלי */}
          <div className="bg-slate-900 rounded-2xl p-8 text-white flex flex-col justify-between relative overflow-hidden">
             {/* רקע עיצובי קטן */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
             
             <div>
                <h2 className="text-2xl font-bold mb-6">פרטי התקשרות</h2>
                <div className="space-y-6">
                   <div className="flex items-start gap-4">
                      <div className="bg-slate-800 p-3 rounded-lg text-blue-400">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                      <div>
                         <p className="text-slate-400 text-sm">שלחו לנו מייל</p>
                         <p className="font-medium">info@cleanfry.co.il</p>
                      </div>
                   </div>
                   
                   <div className="flex items-start gap-4">
                      <div className="bg-slate-800 p-3 rounded-lg text-blue-400">
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <div>
                         <p className="text-slate-400 text-sm">המיקום שלנו</p>
                         <p className="font-medium">כפר סבא, ישראל</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="mt-12">
                <img src="/logo.png" alt="CleanFry" className="h-12 w-auto brightness-0 invert opacity-50" />
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactPage;
