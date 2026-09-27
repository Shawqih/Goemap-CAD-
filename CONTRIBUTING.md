# إرشادات المساهمة في مشروع GeoVector CAD Mobile 🤝

نشكر اهتمامك بالمساهمة في تطوير مشروع **GeoVector CAD Mobile**! نحن نرحب بمساهمات المطورين والمهندسين.

## خطوات المساهمة

1. قم بعمل **Fork** للمستودع على حسابك الشخصي.
2. أنشئ فرعاً جديداً لميزتك أو لإصلاح الخطأ:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. التزم بمعايير الكود:
   - لغة البرمجة: **Kotlin** مع مراعاة نمط **Clean Architecture** و**MVVM**.
   - الواجهات: **Jetpack Compose** مع **Material 3**.
   - لا تستخدم أي مكتبات خارجية تتطلب اتصالاً بالإنترنت؛ يجب أن يعمل التطبيق محلياً 100%.
4. اكتب اختبارات الوحدة المناسبة (Unit Tests) للميزات الجديدة.
5. قم بتنفيذ Commit واضح لرسائلك:
   ```bash
   git commit -m "feat: Add Helmert 4-parameter conformal transformation"
   ```
6. ارفع التغييرات إلى فرعك:
   ```bash
   git push origin feature/amazing-feature
   ```
7. افتح **Pull Request** وانتظر مراجعة الكود واكتمال اختبارات الـ CI في GitHub Actions!
