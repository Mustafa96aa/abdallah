# موقع عبد الله — معرض أعمال وخدمات

موقع عربي (RTL) لعرض خدمات التصوير التجاري وصناعة المحتوى وإدارة الحملات الإعلانية.
مبني بـ React 19 + Vite + Tailwind 4 + TypeScript، ويستخدم Supabase لحفظ المشاريع والصور وطلبات العملاء.

## التشغيل على جهازك

```bash
bun install        # أو: npm install
cp .env.example .env.local   # ثم عبّئ قيم Supabase
bun run dev        # أو: npm run dev
```

## الإعداد (مرة واحدة)

1. **Supabase ← SQL Editor**: الصق محتوى `supabase/schema.sql` وشغّله.
   - قبلها غيّر الإيميل داخل دالة `is_admin()` إلى إيميلك الذي ستسجّل به الدخول.
2. **Supabase ← Authentication ← Sign In / Providers**: عطّل خيار السماح بتسجيل مستخدمين جدد
   (Allow new users to sign up)، ثم أنشئ حسابك يدوياً من Authentication ← Users ← Add user.
3. **Vercel ← Settings ← Environment Variables**: أضف `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`
   (من Supabase ← Project Settings ← API) ثم أعد النشر (Redeploy).

## إدارة المعرض

- افتح الموقع بالرابط `https://موقعك/#admin` لتظهر أزرار الإدارة (تظهر لك أنت فقط).
- سجّل الدخول، ثم أضف المشاريع والصور أو احذفها.
- الصور تُصغَّر وتُضغط تلقائياً قبل الرفع.

## طلبات العملاء

- أي طلب من الفورم يُحفظ في جدول `leads` في Supabase (Table Editor ← leads).
- لتصلك رسالة عند كل طلب جديد: Supabase ← Database ← Webhooks، أو أضف خدمة مثل Resend لاحقاً.

## قبل النشر

- استبدل الأرقام والمشاريع والشهادة التجريبية في `src/data/landingData.ts` ببياناتك الحقيقية
  (ابحث عن كلمة `TODO`).
- أضف صورة مشاركة (`og:image`) ورابط الموقع (`canonical`) في `index.html`.
