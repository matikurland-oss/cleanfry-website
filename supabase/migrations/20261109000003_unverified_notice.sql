-- הודעת "ממתין לאימות" לבעל האתר נשמרת בנפרד ממייל האישור על תשלום מאומת
alter table public.orders add column unverified_notice_sent_at timestamptz;
