# GeoVector CAD Mobile 🗺️📐

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android%208.0%2B%20(API%2026--34)-green.svg" alt="Platform" />
  <img src="https://img.shields.io/badge/Language-Kotlin%201.9-blue.svg" alt="Kotlin" />
  <img src="https://img.shields.io/badge/UI-Jetpack%20Compose%20%7C%20Material%203-purple.svg" alt="Jetpack Compose" />
  <img src="https://img.shields.io/badge/Architecture-MVVM%20%2B%20Clean%20Architecture-orange.svg" alt="Architecture" />
  <img src="https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue.svg" alt="GitHub CI" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License" />
</p>

تطبيق أندرويد احترافي كامل متكامل لتحويل الصور الجوية والأقمار الصناعية والمخططات الخطية إلى خرائط CAD و GIS متجهة حقيقية قابلة للتحرير والتصدير محلياً 100% دون الحاجة إلى خوادم أو إنترنت.

---

## 🚀 المميزات الرئيسية (Core Features)

1. **معالجة الصور واستخراج المتجهات (Computer Vision Pipeline)**:
   - خوارزميات Otsu وAdaptive Thresholding لتجزيء الصور تلقائياً.
   - كشف الحواف الدقيق عبر مرشحات Sobel وCanny.
   - عمليات مورفولوجية (Closing, Dilation, Skeletonization) لتنقية الطرق والمباني.
   - تتبع الكنتورات (Moore-Neighbor Tracing) مع تبسيط هندسي فائق الدقة عبر **Douglas-Peucker**.
   - تسوية زوايا المباني هندسياً إلى 90 درجة (Orthogonal Snapping).
   - تصنيف المعالم آلياً: `BUILDINGS`، `ROADS`، `PARCELS`، `VEGETATION`، `WATER`، و`OTHER`.

2. **بيئة تحرير CAD مدمجة (In-App CAD Vector Editor)**:
   - أدوات: Select, Move, Polyline, Polygon, Rectangle, Vertex Edit, Trim, Split, Join.
   - محرك الالتصاق الهندسي (Object Snapping): نقاط النهاية، المنتصف، الرؤوس، وشبكة الإحداثيات.
   - سجل تراجع وإعادة (Undo/Redo) غير محدود.
   - أدوات قياس المسافات المترية والمساحات بـ $m^2$.

3. **الإسناد الجغرافي (Georeferencing & GCPs)**:
   - دعم كامل لأنظمة الإحداثيات المرجعية الدولية والمحلية (WGS84, Web Mercator, UTM 36N--39N, Egypt ETM, Saudi Ain el Abd).
   - حل مصفوفة التحويل الأفيني 2D Affine Transformation وحساب خطأ الجذر التربيعي المتوسط (Total RMS Error).
   - توليد وتصدير ملف الإسناد العالمي **ESRI World File** (`.tfw`).

4. **تصدير CAD وGIS حقيقي 100% (Not Raster)**:
   - **AutoCAD DXF R2013+**: كيانات `LWPOLYLINE` حقيقية بالمتر مع طبقات ACI.
   - **ESRI Shapefile Suite**: حزمة ZIP كاملة تضم ملفات `.shp` و`.shx` و`.dbf` و`.prj`.
   - **GeoJSON**: متوافق مع معيار RFC 7946.
   - **Google Earth KML**: مع أنماط الألوان والارتفاعات.
   - **CSV**: إحداثيات الرؤوس وملخص المعالم.

5. **شاشة المقارنة المزدوجة (Dual-View Comparison)**:
   - شريط تمرير سحب تفاعلي لمقارنة الصورة الجوية الأصلية مع المخطط الخطي الأبيض المتجه.

---

## 🏗️ هيكلية المشروع (Clean Architecture + MVVM)

```
app/
├── data/                    # طبقة البيانات
│   ├── local/               # Room Database, SharedPreferences
│   ├── remote/              # Exporters (DXF, Shapefile, GeoJSON, KML)
│   └── repository/          # مستودعات البيانات (VectorRepository)
├── domain/                  # منطق الأعمال (Business Logic)
│   ├── model/               # كيانات المجال (VectorFeature, Layer, GCP, GeoTransform)
│   └── usecase/             # حالات الاستخدام (VectorizeUseCase, ExportUseCase)
├── presentation/            # طبقة العرض
│   ├── ui/                  # شاشات Jetpack Compose, Material 3, CadCanvas
│   └── viewmodel/           # ViewModels (CadViewModel, GeoreferenceViewModel)
├── di/                      # حقن التبعيات (Hilt)
└── utils/                   # خوارزميات OpenCV والأدوات المساعدة (Resource Sealed Class)
```

---

## 📦 سير العمل في GitHub (GitHub Actions CI/CD)

يتم بناء التطبيق وتوليد ملف **APK** تلقائياً عند كل عملية `push` أو `pull_request` عبر سير العمل:
`.github/workflows/android.yml`

### خطوات سير العمل:
1. استنساخ المستودع (Checkout Repository).
2. إعداد بيئة Java JDK 17 (Temurin).
3. التحقق من صلاحيات Gradle Wrapper.
4. تشغيل الاختبارات الآلية (Unit Tests).
5. بناء تطبيق أندرويد بصيغة Debug APK (`./gradlew assembleDebug`).
6. رفع ملف الـ APK كـ Artifact جاهز للتحميل المباشر من تبويب **Actions** في GitHub!

---

## 🛠️ تعليمات التثبيت والتشغيل المحلي

### المتطلبات:
- **Android Studio** Hedgehog (2023.1.1) أو أحدث
- **Java JDK 17**
- **Android SDK Platform 34** (Min SDK 26)

### أوامر Git والربط مع GitHub:
```bash
git init
git add .
git commit -m "Initial commit: GeoVector CAD Mobile - Android App"
git branch -M main
git remote add origin https://github.com/[USERNAME]/[REPO-NAME].git
git push -u origin main
```

### أمر بناء الـ APK من الطرفية:
```bash
# لأنظمة Linux و macOS
chmod +x gradlew
./gradlew assembleDebug

# لأنظمة Windows
gradlew.bat assembleDebug
```

مسار ملف الـ APK الناتج:
`app/build/outputs/apk/debug/app-debug.apk`

---

## 📄 الترخيص (License)
هذا المشروع مرخص تحت رخصة **MIT**. راجع ملف [LICENSE](LICENSE) لمزيد من التفاصيل.
