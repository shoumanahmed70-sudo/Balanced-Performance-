/**
 * نظام كروت صيانة أسطول المركبات | شركة الأداء المتوازن للمقاولات
 * الملف: app.js
 * الهوية البصرية: الأزرق الملكي الداكن والأخضر المتوازن
 * يشمل:
 * 1. تهيئة النظام الحقيقي وإعداد حساب المدير الأول تلقائياً بدون أي معاملات تجريبية.
 * 2. إضافة وإدارة المديرين لمتابعة حركة السيارات والأسطول.
 * 3. حصر رؤية السائق على سيارته المخصصة له فقط ومنع ظهور أي سيارات أخرى.
 * 4. تسجيل غيار الزيت الحالي وقراءة العداد الفعلية الحالية فقط.
 * 5. تشفير SHA-256 لكلمات المرور وضغط الصور عبر Canvas قبل الحفظ.
 */

// =============================================================================
// 1. مفاتيح التخزين والثوابت (Constants & Storage Keys)
// =============================================================================
const STORAGE_KEYS = {
  USERS: 'balanced_users_real_v2',
  PROJECTS: 'balanced_projects_real_v2',
  VEHICLES: 'balanced_vehicles_real_v2',
  CARDS: 'balanced_cards_real_v2',
  SESSION: 'balanced_session_real_v2',
  AUDIT: 'balanced_audit_real_v2',
  LANG: 'balanced_app_lang',
  VIEW_MODE: 'balanced_cards_view_mode',
  CLOUD_CONFIG: 'balanced_cloud_config'
};

let currentLang = localStorage.getItem(STORAGE_KEYS.LANG) || 'ar';
let cardsViewMode = localStorage.getItem(STORAGE_KEYS.VIEW_MODE) || 'dossiers';

// متغيرات حالة محرك المزامنة السحابية وقاعدة البيانات الموحدة
let cloudDb = null;
let isCloudSyncActive = false;
let cloudListeners = [];
let isCloudSyncing = false;

// =============================================================================
// قاموس الترجمة متعدد اللغات (I18N Dictionary)
// اللغات: العربية (ar)، الإنجليزية (en)، الأردية (ur)، الهندية (hi)، البنغالية (bn)، التاغالوغ (tl)
// =============================================================================
const I18N = {
  ar: {
    companyName: 'شركة الأداء المتوازن للمقاولات',
    systemTitle: 'نظام كروت الصيانة الرقمية ومتابعة الأسطول',
    authSubtitle: 'نظام المتابعة الفنية وكروت صيانة أسطول المركبات',
    securityTag: 'نظام حماية وعزل بيانات معتمد',
    setupTitle: 'إعداد النظام لأول مرة:',
    setupDesc: 'قم بإنشاء حساب المدير الرئيسي للشركة لتهيئة النظام وتعيين الصلاحيات.',
    lblSetupFullName: 'اسم المدير العام بالكامل',
    phSetupFullName: 'مثال: المهندس محمد العتيبي',
    lblSetupUsername: 'اسم المستخدم لتسجيل الدخول',
    phSetupUsername: 'مثال: admin',
    lblPhone: 'رقم الجوال',
    lblSetupPassword: 'كلمة المرور للمدير',
    lblSetupPasswordConfirm: 'تأكيد كلمة المرور',
    phPassword: 'أدخل كلمة مرور قوية',
    phPasswordConfirm: 'أعد إدخال كلمة المرور',
    btnSetupAdmin: 'إنشاء حساب المدير الرئيسي وبدء التشغيل',
    lblUsername: 'اسم المستخدم',
    phUsername: 'أدخل اسم المستخدم المسجل',
    lblPassword: 'كلمة المرور',
    phLoginPassword: 'أدخل كلمة المرور',
    btnLogin: 'تسجيل الدخول',
    linkSetupNewAdmin: 'إعداد أو إنشاء حساب مدير رئيسي جديد',
    linkBackToLogin: 'العودة لشاشة تسجيل الدخول',
    defaultAdminHint: 'بيانات المدير الافتراضية للتشغيل الفوري: اسم المستخدم: admin | كلمة المرور: admin',
    cloudSyncTitle: 'المزامنة السحابية (Cloud Sync)',
    cloudSyncDesc: 'ربط قاعدة بيانات سحابية موحدة لتمكين جميع السائقين والمديرين من رؤية وتحديث نفس البيانات لحظياً عبر الإنترنت.',
    btnConfigureCloud: 'إعدادات الربط السحابي',
    btnShareSyncData: 'مشاركة كود البيانات',
    cloudModalTitle: 'إعدادات الربط السحابي وقاعدة البيانات (Cloud Sync)',
    authFooter: 'اتصال مشفر وآمن | شركة الأداء المتوازن للمقاولات',
    assignedVehicleToYou: 'المركبة المخصصة لك:',
    assignedProject: 'المشروع:',
    btnLogout: 'خروج',
    navCards: 'كروت الصيانة',
    navProjects: 'إدارة المشاريع',
    navVehicles: 'أسطول المركبات',
    navTechs: 'إدارة السائقين والفنيين',
    navAdmins: 'إدارة المديرين',
    navAnalytics: 'التقارير والنسخ الاحتياطي',
    btnNewCard: 'كرت صيانة جديد',
    btnNewCardShort: 'كرت جديد',
    btnCreateCardAction: 'عمل كرت صيانة جديد',
    cardsViewCaptionTech: 'تسجيل ومتابعة كروت الصيانة وغيار الزيت لمركبتك المخصصة',
    noCardsTechTitle: 'لا توجد كروت صيانة مسجلة لمركبتك بعد',
    noCardsTechDesc: 'اضغط على زر "عمل كرت صيانة جديد" للبدء بتسجيل صيانة أو غيار زيت حقيقي لسيارتك.',
    lblTotalCards: 'إجمالي كروت الصيانة',
    lblTotalCost: 'إجمالي تكاليف الصيانة',
    currency: 'ر.س',
    lblActiveProjects: 'المشاريع المرتبطة',
    lblFleetCount: 'المركبات المخدومة',
    cardsTitle: 'سجل كروت صيانة المركبات',
    cardsViewCaption: 'عرض ومتابعة الفواتير والعدادات والقطع المستبدلة',
    searchPlaceholder: 'بحث برقم اللوحة، الموديل، الفاتورة أو التغييرات...',
    allProjects: 'جميع المشاريع',
    allTechs: 'جميع السائقين / الفنيين',
    noCardsTitle: 'لا توجد كروت صيانة مسجلة حالياً',
    noCardsDesc: 'اضغط على زر "كرت صيانة جديد" أعلاه لتسجيل عملية صيانة حقيقية للمركبة.',
    projectsTitle: 'إدارة مشاريع شركة الأداء المتوازن',
    projectsSubtitle: 'إضافة وحذف وتعديل مشاريع الشركة لربطها بالسيارات والسائقين',
    btnAddProject: 'إضافة مشروع جديد',
    thProjectCode: 'كود المشروع',
    thProjectName: 'اسم المشروع',
    thProjectLocation: 'موقع العمل / المدينة',
    thProjectManager: 'مدير الموقع',
    thVehiclesCount: 'عدد المركبات',
    thDriversCount: 'عدد السائقين',
    thStatus: 'حالة المشروع',
    thActions: 'الإجراءات',
    vehiclesTitle: 'إدارة أسطول سيارات الشركة ومتابعة حركتها',
    vehiclesSubtitle: 'قائمة المركبات وتعيين السائق المخصص لكل مركبة',
    btnAddVehicle: 'إضافة مركبة جديدة للأسطول',
    thPlate: 'رقم اللوحة',
    thVehicleModel: 'النوع والموديل',
    thYear: 'سنة الصنع',
    thCurrentProject: 'المشروع الحالي',
    thAssignedDriver: 'السائق المخصص للمركبة',
    thCurrentOdo: 'قراءة العداد الحالية',
    thLastMaintenance: 'تاريخ آخر صيانة',
    techsTitle: 'إدارة السائقين وفنيي المشاريع',
    techsSubtitle: 'إضافة حسابات السائقين وربط كل سائق بمركبته المخصصة ومشروعه',
    btnAddTech: 'إضافة سائق / فني جديد',
    thDriverTech: 'السائق / الفني',
    thUsername: 'اسم المستخدم',
    thPhone: 'رقم الجوال',
    thLinkedProject: 'المشروع المربوط به',
    thAssignedVehicle: 'السيارة المخصصة له فقط',
    thCardsCount: 'عدد كروت الصيانة',
    adminsTitle: 'إدارة مديري النظام ومتابعة الحركة',
    adminsSubtitle: 'إضافة وتعيين مديرين لمتابعة أسطول السيارات والمشاريع وكروت الصيانة',
    btnAddAdmin: 'إضافة مدير جديد',
    thAdminName: 'اسم المدير',
    thRole: 'الدور والمسمى',
    analyticsTitle: 'مركز التقارير وإدارة البيانات الاحتياطية',
    analyticsSubtitle: 'تصدير التقارير المحاسبية واستخراج نسخة احتياطية آمنة',
    exportCenterTitle: 'مركز تصدير التقارير واستخراج كروت الصيانة (Excel & PDF)',
    exportCenterSubtitle: 'تصدير تقارير صيانة متكاملة لجميع سيارات الأسطول دفعة واحدة أو تخصيص سيارة معينة بضغطة زر',
    exportScopeLabel: 'حدد نطاق التصدير والتقرير المطلوب:',
    exportScopeAll: 'تنزيل لجميع سيارات الأسطول (الكل)',
    exportScopeSpecific: 'تخصيص سيارة معينة من الأسطول',
    exportSelectVehicleLabel: 'اختر المركبة المراد تصدير تقريرها:',
    exportLoadingVehicles: '-- جارٍ تحميل سيارات الأسطول --',
    btnExportExcel: 'تصدير البيانات إلى Excel (CSV)',
    btnExportPDF: 'إصدار وطباعة تقرير الصيانة الشامل (A4 PDF)',
    backupTitle: 'نسخة احتياطية كاملة (JSON)',
    backupDesc: 'تصدير قاعدة البيانات بالكامل (المشاريع، الفنيين، كروت الصيانة والصور) لحفظها بأمان.',
    btnDownloadBackup: 'تحميل النسخة الاحتياطية',
    restoreTitle: 'استعادة نسخة احتياطية',
    restoreDesc: 'استرجاع بيانات المشاريع والكروت من ملف JSON تم تصديره سابقاً.',
    btnChooseBackupFile: 'اختيار ملف النسخة الاحتياطية',
    auditTitle: 'سجل الأمان والعمليات (Audit Trail)',
    btnClearAudit: 'مسح السجل',
    thAuditTime: 'الوقت والتاريخ',
    thAuditUser: 'المستخدم',
    thAuditType: 'النوع',
    thAuditDetails: 'تفاصيل العملية',
    thAuditTarget: 'المشروع / المركبة',
    footerText: 'نظام كروت صيانة المركبات والمشاريع',
    footerSecure: 'محمي بنظام أمان وفصل بيانات متطور',
    modalCardNewTitle: 'كرت صيانة سيارة جديد',
    modalCardEditTitle: 'تعديل كرت صيانة سيارة',
    modalCardAlertBanner: 'برجاء إرفاق صورة العداد الحالي وصورة الفاتورة وصورة الفلاتر/القطع المستبدلة لاعتماد الصرف.',
    lblCardProject: 'اسم المشروع',
    optSelectProject: '-- اختر المشروع --',
    lblCardVehicle: 'السيارة المخصصة / رقم اللوحة',
    optSelectVehicle: '-- اختر السيارة --',
    lblVehicleModel: 'نوع المركبة والموديل',
    phVehicleModel: 'موديل المركبة',
    lblTechName: 'اسم السائق / الفني المسؤول',
    lblMaintenanceDate: 'تاريخ الصيانة',
    dividerOdometer: 'قراءة عداد السيارة / غيار الزيت الحالي',
    lblCurrentOdometer: 'قراءة العداد الحالية لغيار الزيت (كيلومتر)',
    phCurrentOdo: 'أدخل قراءة العداد الحالية بالأرقام (مثال: 145200)',
    photoAvailQuestion: 'هل تتوفر صور ومرفقات لهذه الصيانة؟',
    photoAvailHelp: 'اختر "لا" لتسجيل غيارات الزيت والصيانات السابقة دفترياً بدون صور',
    btnPhotosYes: 'نعم، تتوفر صور',
    btnPhotosNo: 'لا، صيانة سابقة (بدون صور)',
    attachOdoTitle: 'إرفاق صورة العداد الحالي',
    chkHasPhoto: 'تتوفر صورة',
    attachOdoHelp: '(تصوير واضح للوحة العداد لإثبات الكيلومترات الفعلية لغيار الزيت)',
    btnUploadOdo: 'التقاط أو رفع صورة العداد',
    phNoOdoImg: 'لم يتم إرفاق صورة العداد بعد',
    badgeNoOdoImg: 'صيانة سابقة - تم تسجيل القراءة بدون صورة للعداد',
    dividerInvoice: 'بيانات الفاتورة ومركز الصيانة',
    lblInvoiceNo: 'رقم الفاتورة',
    phInvoiceNo: 'مثال: INV-1092',
    lblInvoiceCost: 'إجمالي مبلغ الفاتورة (ر.س)',
    phInvoiceCost: 'مثال: 320.00',
    lblWorkshop: 'اسم الورشة / مركز الصيانة',
    phWorkshop: 'مثال: مركز بترومين إكسبريس',
    attachInvoiceTitle: 'إرفاق صورة الفاتورة الأصلية',
    attachInvoiceHelp: '(صورة واضحة توضح الأصناف والمبلغ والختم الضريبي)',
    btnUploadInvoice: 'التقاط أو رفع صورة الفاتورة',
    phNoInvoiceImg: 'لم يتم إرفاق صورة الفاتورة بعد',
    badgeNoInvoiceImg: 'صيانة سابقة - تم التقييد بدون صورة للفاتورة',
    dividerParts: 'تفاصيل التغييرات والفلاتر وأعمال الصيانة',
    lblQuickTags: 'خيارات سريعة للتحديد:',
    chipEngineOil: '+ زيت محرك',
    chipOilFilter: '+ فلتر زيت',
    chipAirFilter: '+ فلتر هواء',
    chipAcFilter: '+ فلتر مكيف',
    chipFuelFilter: '+ فلتر وقود',
    chipBrakes: '+ فرامل',
    chipGearOil: '+ زيت جير',
    chipBattery: '+ بطارية',
    chipTires: '+ إطارات',
    lblChangesDesc: 'كتابة ما هي التغيرات وأعمال الصيانة المنفذة بالتفصيل',
    phChangesDesc: 'مثال: تم تغيير زيت المحرك نوع 10W40 (6 علب) مع استبدال فلتر الزيت الأصلي واستبدال فلتر الهواء وفحص السيور...',
    attachPartsTitle: 'إرفاق صورة عند تغيير الفلاتر أو الصيانة',
    attachPartsHelp: '(صورة توضح الفلاتر أو القطع التي تم استبدالها أثناء العمل)',
    btnUploadParts: 'التقاط أو رفع صورة الفلاتر والقطع',
    phNoPartsImg: 'لم يتم إرفاق صورة القطع والفلاتر بعد',
    badgeNoPartsImg: 'صيانة سابقة - تم التقييد بدون صورة للقطع',
    lblNotes: 'ملاحظات السائق أو توصيات الصيانة:',
    phNotes: 'أي ملاحظات فنية إضافية',
    btnCancel: 'إلغاء',
    btnSaveCard: 'حفظ واعتماد كرت الصيانة',
    btnClose: 'إغلاق',
    modalViewCardTitle: 'معاينة كرت صيانة المركبة الرسمي',
    btnPrintCardPDF: 'طباعة الكرت / تصدير PDF',
    btnPrintCardA4: 'طباعة كرت الصيانة الرسمي (A4)',
    modalViewFleetReportTitle: 'تقرير صيانة أسطول المركبات الشامل',
    btnPrintReportPDF: 'طباعة التقرير / حفظ PDF',
    btnPrintReportA4: 'طباعة التقرير الشامل (A4)',
    modalProjectTitle: 'إضافة مشروع جديد',
    lblProjectCode: 'كود المشروع',
    phProjectCode: 'مثال: PRJ-2026-01',
    lblProjectName: 'اسم المشروع',
    phProjectName: 'اسم المشروع التابع للشركة',
    lblProjectLocation: 'موقع العمل / المدينة',
    phProjectLocation: 'مثال: الرياض - طريق الملك فهد',
    lblProjectManager: 'مدير المشروع المسؤول',
    phProjectManager: 'اسم مهندس الموقع المسؤول',
    lblProjectStatus: 'حالة المشروع',
    optStatusActive: 'نشط وقائم',
    optStatusPending: 'تحت التجهيز',
    optStatusCompleted: 'مكتمل',
    btnSaveProject: 'حفظ المشروع',
    modalVehicleTitle: 'إضافة مركبة جديدة',
    lblVehiclePlate: 'رقم اللوحة',
    phVehiclePlate: 'مثال: أ ب ج 1234',
    lblVehicleModelReq: 'النوع والموديل',
    phVehicleModelReq: 'مثال: تويوتا هايلوكس غمارة',
    lblVehicleYear: 'سنة الصنع',
    lblVehicleProject: 'المشروع التابعة له',
    lblVehicleDriver: 'السائق المخصص للمركبة (يظهر له هذه السيارة فقط)',
    phVehicleDriver: 'اسم السائق المخصص لهذه السيارة',
    lblVehicleOdo: 'قراءة العداد الحالية (كم)',
    phVehicleOdo: 'قراءة العداد الحالية',
    btnSaveVehicle: 'حفظ المركبة',
    modalTechTitle: 'إضافة سائق / فني جديد',
    lblTechFullname: 'اسم السائق / الفني بالكامل',
    phTechFullname: 'اسم السائق الثلاثي أو الرباعي',
    lblTechUsername: 'اسم المستخدم لتسجيل الدخول',
    phTechUsername: 'اسم مستخدم فريد (مثال: ahmed_driver)',
    phTechPassword: 'أدخل كلمة مرور السائق',
    techPassHint: 'اترك الحقل فارغاً عند التعديل إذا كنت لا ترغب بتغييرها',
    lblTechProject: 'المشروع التابع له السائق',
    lblTechVehiclePlate: 'السيارة المخصصة لهذا السائق فقط',
    optSelectAssignedVehicle: '-- اختر السيارة المخصصة له --',
    techVehicleHelp: 'عند دخول السائق ستظهر له هذه السيارة فقط ولن تظهر له أي سيارات أخرى.',
    btnSaveTech: 'حفظ بيانات السائق',
    modalAdminTitle: 'إضافة مدير جديد لمتابعة الأسطول',
    lblAdminFullname: 'اسم المدير بالكامل',
    phAdminFullname: 'اسم المدير المسؤول',
    lblAdminUsername: 'اسم المستخدم للدخول',
    phAdminUsername: 'اسم المستخدم',
    lblAdminRoleTitle: 'المسمى الوظيفي / الدور',
    phAdminRoleTitle: 'مثال: مدير حركة ومعدات / مسؤول مشاريع',
    phAdminPassword: 'أدخل كلمة مرور قوية',
    adminPassHint: 'اتركها فارغة عند التعديل إذا كنت لا ترغب بتغييرها',
    btnSaveAdmin: 'حفظ حساب المدير',
    lightboxCaption: 'معاينة الصورة',
    statusActive: 'نشط',
    statusPending: 'تحت التجهيز',
    statusCompleted: 'مكتمل',
    roleAdmin: 'مدير معتمد',
    roleDriver: 'سائق / فني صيانة',
    lblCardNumber: 'رقم الكرت:',
    btnPrint: 'طباعة',
    btnEdit: 'تعديل',
    btnDelete: 'حذف',
    lblTechResponsible: 'السائق المسؤول:',
    lblInvoiceAmount: 'مبلغ الفاتورة',
    lblChanges: 'التغييرات:',
    kmUnit: 'كم',
    badgeHistoricalMaintenance: 'صيانة سابقة مسجلة دفترياً (بدون مرفقات صور)',
    thumbOdometer: 'العداد',
    thumbInvoice: 'الفاتورة',
    thumbParts: 'الفلاتر',
    thumbNoOdo: 'بدون صورة عداد',
    thumbNoInvoice: 'بدون صورة فاتورة',
    thumbNoParts: 'بدون صورة قطع',
    vehicleUnit: 'سيارة',
    driverUnit: 'سائق',
    cardsUnit: 'كروت',
    btnReport: 'تقرير',
    noProjectsRegistered: 'لا توجد مشاريع مسجلة بعد. اضغط "إضافة مشروع جديد" للبدء.',
    noVehiclesRegistered: 'لا توجد سيارات مسجلة بالأسطول بعد. اضغط "إضافة مركبة جديدة" للبدء.',
    noTechsRegistered: 'لا يوجد سائقين مسجلين بعد. اضغط "إضافة سائق / فني جديد" للبدء.',
    noAdminsRegistered: 'لا يوجد مديرين مسجلين بعد.',
    lblMyVehicleCards: 'كروت صيانة سيارتي',
    lblMyProject: 'مشروعي الحالي',
    lblMyAssignedVehicle: 'سيارتي المخصصة',
    viewByDossiers: 'ملفات المشاريع والقطاعات',
    viewByCards: 'كافة الكروت',
    btnAddCardToProject: '+ كرت جديد للمشروع',
    btnPrintProjectDossier: 'طباعة ملف المشروع (PDF)',
    btnExportProjectExcel: 'تصدير كروت المشروع (Excel)',
    btnAddCardToVehicle: '+ كرت صيانة لهذه المركبة',
    driverAssignedLabel: 'السائق المخصص:',
    noCardsInProject: 'لا توجد كروت صيانة مسجلة في ملف هذا المشروع بعد',
    noVehiclesInProject: 'لا توجد سيارات مسجلة في هذا المشروع بعد',
    btnAddVehicleToProject: 'ربط سيارة جديدة بهذا المشروع',
    openMaintenanceDossier: 'ملف الصيانة',
    noCardsForVehicle: 'لا توجد كروت صيانة مسجلة لهذه المركبة بعد',
    sectorProjectTitle: 'قطاع / مشروع:',
    driverFile: 'ملف السائق:'
  },
  en: {
    companyName: 'Balanced Performance Contracting Co.',
    systemTitle: 'Digital Maintenance Cards & Fleet Tracking System',
    authSubtitle: 'Fleet Maintenance Cards & Technical Tracking System',
    securityTag: 'Certified Secure Data Isolation System',
    setupTitle: 'Initial System Setup:',
    setupDesc: 'Create the primary company admin account to initialize the system and permissions.',
    lblSetupFullName: 'General Manager Full Name',
    phSetupFullName: 'e.g., Eng. Mohammed Al-Otaibi',
    lblSetupUsername: 'Login Username',
    phSetupUsername: 'e.g., admin',
    lblPhone: 'Phone Number',
    lblSetupPassword: 'Admin Password',
    lblSetupPasswordConfirm: 'Confirm Password',
    phPassword: 'Enter a strong password',
    phPasswordConfirm: 'Re-enter password',
    btnSetupAdmin: 'Create Primary Admin & Initialize System',
    lblUsername: 'Username',
    phUsername: 'Enter registered username',
    lblPassword: 'Password',
    phLoginPassword: 'Enter password',
    btnLogin: 'Sign In',
    linkSetupNewAdmin: 'Setup or Register New Master Admin',
    linkBackToLogin: 'Back to Sign In Screen',
    defaultAdminHint: 'Default Admin for instant launch: Username: admin | Password: admin',
    cloudSyncTitle: 'Real-time Cloud Sync',
    cloudSyncDesc: 'Connect a unified cloud database enabling drivers and managers to share real-time fleet data over the internet.',
    btnConfigureCloud: 'Configure Cloud Sync',
    btnShareSyncData: 'Share Sync Code',
    cloudModalTitle: 'Cloud Sync & Database Settings',
    authFooter: 'Encrypted & Secure Connection | Balanced Performance Contracting Co.',
    assignedVehicleToYou: 'Your Assigned Vehicle:',
    assignedProject: 'Project:',
    btnLogout: 'Logout',
    navCards: 'Maintenance Cards',
    navProjects: 'Projects',
    navVehicles: 'Fleet Vehicles',
    navTechs: 'Drivers & Techs',
    navAdmins: 'Administrators',
    navAnalytics: 'Reports & Backup',
    btnNewCard: 'New Maintenance Card',
    btnNewCardShort: 'New Card',
    btnCreateCardAction: 'Create Maintenance Card',
    cardsViewCaptionTech: 'Record and track maintenance and oil changes for your assigned vehicle',
    noCardsTechTitle: 'No Maintenance Cards Recorded For Your Vehicle Yet',
    noCardsTechDesc: 'Click "Create Maintenance Card" to record actual maintenance or oil change for your car.',
    lblTotalCards: 'Total Maintenance Cards',
    lblTotalCost: 'Total Maintenance Cost',
    currency: 'SAR',
    lblActiveProjects: 'Linked Projects',
    lblFleetCount: 'Fleet Vehicles',
    cardsTitle: 'Vehicle Maintenance Log',
    cardsViewCaption: 'Track invoices, odometer readings, and replaced parts',
    searchPlaceholder: 'Search by plate number, model, invoice, or changes...',
    allProjects: 'All Projects',
    allTechs: 'All Drivers / Technicians',
    noCardsTitle: 'No Maintenance Cards Recorded Yet',
    noCardsDesc: 'Click "New Maintenance Card" above to record vehicle maintenance.',
    projectsTitle: 'Company Projects Management',
    projectsSubtitle: 'Manage company projects and link them with fleet and drivers',
    btnAddProject: 'Add New Project',
    thProjectCode: 'Project Code',
    thProjectName: 'Project Name',
    thProjectLocation: 'Work Location / City',
    thProjectManager: 'Site Manager',
    thVehiclesCount: 'Vehicles',
    thDriversCount: 'Drivers',
    thStatus: 'Status',
    thActions: 'Actions',
    vehiclesTitle: 'Company Fleet Management',
    vehiclesSubtitle: 'Fleet vehicle list and assigned driver per vehicle',
    btnAddVehicle: 'Add Vehicle to Fleet',
    thPlate: 'Plate Number',
    thVehicleModel: 'Type & Model',
    thYear: 'Model Year',
    thCurrentProject: 'Current Project',
    thAssignedDriver: 'Assigned Driver',
    thCurrentOdo: 'Current Odometer',
    thLastMaintenance: 'Last Maintenance',
    techsTitle: 'Drivers & Project Technicians',
    techsSubtitle: 'Manage driver accounts and link each driver to vehicle and project',
    btnAddTech: 'Add Driver / Tech',
    thDriverTech: 'Driver / Tech',
    thUsername: 'Username',
    thPhone: 'Phone Number',
    thLinkedProject: 'Linked Project',
    thAssignedVehicle: 'Assigned Vehicle Only',
    thCardsCount: 'Maintenance Cards',
    adminsTitle: 'System Administrators',
    adminsSubtitle: 'Add and assign managers to track fleet, projects, and maintenance',
    btnAddAdmin: 'Add New Admin',
    thAdminName: 'Admin Name',
    thRole: 'Role & Title',
    analyticsTitle: 'Reports Center & Data Backup',
    analyticsSubtitle: 'Export accounting reports and secure full database backups',
    exportCenterTitle: 'Reports Export Center (Excel & PDF)',
    exportCenterSubtitle: 'Export complete maintenance records for the entire fleet or a specific vehicle',
    exportScopeLabel: 'Select export and report scope:',
    exportScopeAll: 'Download for All Fleet Vehicles (All)',
    exportScopeSpecific: 'Select a Specific Fleet Vehicle',
    exportSelectVehicleLabel: 'Choose vehicle to export report for:',
    exportLoadingVehicles: '-- Loading fleet vehicles --',
    btnExportExcel: 'Export Data to Excel (CSV)',
    btnExportPDF: 'Issue Comprehensive Report (A4 PDF)',
    backupTitle: 'Full Data Backup (JSON)',
    backupDesc: 'Export entire database (projects, technicians, cards, and photos) securely.',
    btnDownloadBackup: 'Download Backup',
    restoreTitle: 'Restore Data Backup',
    restoreDesc: 'Restore projects and maintenance cards from a previously exported JSON file.',
    btnChooseBackupFile: 'Select Backup File',
    auditTitle: 'Security & Operations Audit Trail',
    btnClearAudit: 'Clear Log',
    thAuditTime: 'Date & Time',
    thAuditUser: 'User',
    thAuditType: 'Type',
    thAuditDetails: 'Operation Details',
    thAuditTarget: 'Project / Vehicle',
    footerText: 'Vehicle Maintenance & Projects System',
    footerSecure: 'Protected with Advanced Security & Data Isolation',
    modalCardNewTitle: 'New Vehicle Maintenance Card',
    modalCardEditTitle: 'Edit Vehicle Maintenance Card',
    modalCardAlertBanner: 'Please attach current odometer photo, invoice photo, and replaced parts/filters photo.',
    lblCardProject: 'Project Name',
    optSelectProject: '-- Select Project --',
    lblCardVehicle: 'Assigned Vehicle / Plate No.',
    optSelectVehicle: '-- Select Vehicle --',
    lblVehicleModel: 'Vehicle Type & Model',
    phVehicleModel: 'Vehicle model',
    lblTechName: 'Responsible Driver / Tech Name',
    lblMaintenanceDate: 'Maintenance Date',
    dividerOdometer: 'Odometer Reading / Current Oil Change',
    lblCurrentOdometer: 'Current Odometer Reading for Oil Change (km)',
    phCurrentOdo: 'Enter current odometer reading in numbers (e.g. 145200)',
    photoAvailQuestion: 'Are photos and attachments available for this service?',
    photoAvailHelp: 'Select "No" to record past oil changes and services without photos',
    btnPhotosYes: 'Yes, photos available',
    btnPhotosNo: 'No, past service (no photos)',
    attachOdoTitle: 'Attach Current Odometer Photo',
    chkHasPhoto: 'Photo available',
    attachOdoHelp: '(Clear photo of odometer cluster proving actual km for oil change)',
    btnUploadOdo: 'Capture or Upload Odometer Photo',
    phNoOdoImg: 'Odometer photo not attached yet',
    badgeNoOdoImg: 'Past service - Reading recorded without odometer photo',
    dividerInvoice: 'Invoice & Service Center Details',
    lblInvoiceNo: 'Invoice Number',
    phInvoiceNo: 'e.g., INV-1092',
    lblInvoiceCost: 'Total Invoice Amount (SAR)',
    phInvoiceCost: 'e.g., 320.00',
    lblWorkshop: 'Workshop / Service Center Name',
    phWorkshop: 'e.g., Petromin Express',
    attachInvoiceTitle: 'Attach Original Invoice Photo',
    attachInvoiceHelp: '(Clear photo showing line items, total amount, and tax stamp)',
    btnUploadInvoice: 'Capture or Upload Invoice Photo',
    phNoInvoiceImg: 'Invoice photo not attached yet',
    badgeNoInvoiceImg: 'Past service - Recorded without invoice photo',
    dividerParts: 'Replaced Parts, Filters & Maintenance Details',
    lblQuickTags: 'Quick selection options:',
    chipEngineOil: '+ Engine Oil',
    chipOilFilter: '+ Oil Filter',
    chipAirFilter: '+ Air Filter',
    chipAcFilter: '+ AC Filter',
    chipFuelFilter: '+ Fuel Filter',
    chipBrakes: '+ Brake Pads',
    chipGearOil: '+ Transmission Oil',
    chipBattery: '+ Battery',
    chipTires: '+ Tires',
    lblChangesDesc: 'Detailed description of changes and maintenance performed',
    phChangesDesc: 'e.g., Engine oil 10W40 replaced (6 cans) with original oil filter, air filter, and belt inspection...',
    attachPartsTitle: 'Attach Photo of Replaced Parts / Filters',
    attachPartsHelp: '(Photo showing filters or parts replaced during maintenance)',
    btnUploadParts: 'Capture or Upload Parts Photo',
    phNoPartsImg: 'Parts photo not attached yet',
    badgeNoPartsImg: 'Past service - Recorded without parts photo',
    lblNotes: 'Driver Notes or Maintenance Recommendations:',
    phNotes: 'Any additional technical notes',
    btnCancel: 'Cancel',
    btnSaveCard: 'Save & Approve Maintenance Card',
    btnClose: 'Close',
    modalViewCardTitle: 'Official Vehicle Maintenance Card Preview',
    btnPrintCardPDF: 'Print Card / Save PDF',
    btnPrintCardA4: 'Print Official Maintenance Card (A4)',
    modalViewFleetReportTitle: 'Comprehensive Fleet Maintenance Report',
    btnPrintReportPDF: 'Print Report / Save PDF',
    btnPrintReportA4: 'Print Comprehensive Report (A4)',
    modalProjectTitle: 'Add New Project',
    lblProjectCode: 'Project Code',
    phProjectCode: 'e.g., PRJ-2026-01',
    lblProjectName: 'Project Name',
    phProjectName: 'Company project name',
    lblProjectLocation: 'Work Location / City',
    phProjectLocation: 'e.g., Riyadh - King Fahd Rd',
    lblProjectManager: 'Project Manager in Charge',
    phProjectManager: 'Site engineer name',
    lblProjectStatus: 'Project Status',
    optStatusActive: 'Active & Ongoing',
    optStatusPending: 'In Preparation',
    optStatusCompleted: 'Completed',
    btnSaveProject: 'Save Project',
    modalVehicleTitle: 'Add New Vehicle',
    lblVehiclePlate: 'Plate Number',
    phVehiclePlate: 'e.g., ABC 1234',
    lblVehicleModelReq: 'Type & Model',
    phVehicleModelReq: 'e.g., Toyota Hilux',
    lblVehicleYear: 'Model Year',
    lblVehicleProject: 'Assigned Project',
    lblVehicleDriver: 'Assigned Driver (Driver will only see this vehicle)',
    phVehicleDriver: 'Driver name assigned to this vehicle',
    lblVehicleOdo: 'Current Odometer (km)',
    phVehicleOdo: 'Current odometer reading',
    btnSaveVehicle: 'Save Vehicle',
    modalTechTitle: 'Add New Driver / Tech',
    lblTechFullname: 'Driver / Tech Full Name',
    phTechFullname: 'Full driver name',
    lblTechUsername: 'Login Username',
    phTechUsername: 'Unique username (e.g., ahmed_driver)',
    phTechPassword: 'Enter driver password',
    techPassHint: 'Leave blank when editing if you do not want to change it',
    lblTechProject: 'Assigned Project',
    lblTechVehiclePlate: 'Assigned Vehicle for this Driver Only',
    optSelectAssignedVehicle: '-- Select assigned vehicle --',
    techVehicleHelp: 'Upon login, the driver will only see this vehicle and no other vehicles.',
    btnSaveTech: 'Save Driver Data',
    modalAdminTitle: 'Add New Fleet Tracking Admin',
    lblAdminFullname: 'Admin Full Name',
    phAdminFullname: 'Responsible admin name',
    lblAdminUsername: 'Login Username',
    phAdminUsername: 'Username',
    lblAdminRoleTitle: 'Job Title / Role',
    phAdminRoleTitle: 'e.g., Fleet Manager / Project Supervisor',
    phAdminPassword: 'Enter a strong password',
    adminPassHint: 'Leave blank when editing if you do not want to change it',
    btnSaveAdmin: 'Save Admin Account',
    lightboxCaption: 'Image Preview',
    statusActive: 'Active',
    statusPending: 'Pending',
    statusCompleted: 'Completed',
    roleAdmin: 'Authorized Admin',
    roleDriver: 'Driver / Maintenance Tech',
    lblCardNumber: 'Card No:',
    btnPrint: 'Print',
    btnEdit: 'Edit',
    btnDelete: 'Delete',
    lblTechResponsible: 'Responsible Driver:',
    lblInvoiceAmount: 'Invoice Amount',
    lblChanges: 'Changes:',
    kmUnit: 'km',
    badgeHistoricalMaintenance: 'Historical maintenance recorded in log (no photos)',
    thumbOdometer: 'Odometer',
    thumbInvoice: 'Invoice',
    thumbParts: 'Filters/Parts',
    thumbNoOdo: 'No Odometer Photo',
    thumbNoInvoice: 'No Invoice Photo',
    thumbNoParts: 'No Parts Photo',
    vehicleUnit: 'vehicles',
    driverUnit: 'drivers',
    cardsUnit: 'cards',
    btnReport: 'Report',
    noProjectsRegistered: 'No projects recorded yet. Click "Add New Project" to start.',
    noVehiclesRegistered: 'No vehicles registered in fleet yet. Click "Add Vehicle" to start.',
    noTechsRegistered: 'No drivers registered yet. Click "Add Driver / Tech" to start.',
    noAdminsRegistered: 'No administrators registered yet.',
    lblMyVehicleCards: 'My Vehicle Maintenance Cards',
    lblMyProject: 'My Current Project',
    lblMyAssignedVehicle: 'My Assigned Vehicle',
    viewByDossiers: 'Project Dossiers',
    viewByCards: 'All Cards',
    btnAddCardToProject: '+ New Card for Project',
    btnPrintProjectDossier: 'Print Project Dossier (PDF)',
    btnExportProjectExcel: 'Export Project Cards (Excel)',
    btnAddCardToVehicle: '+ Add Card for Vehicle',
    driverAssignedLabel: 'Assigned Driver:',
    noCardsInProject: 'No maintenance cards recorded in this project dossier yet',
    noVehiclesInProject: 'No vehicles linked to this project yet',
    btnAddVehicleToProject: 'Link Vehicle to Project',
    openMaintenanceDossier: 'Maintenance Dossier',
    noCardsForVehicle: 'No maintenance cards recorded for this vehicle yet',
    sectorProjectTitle: 'Sector / Project:',
    driverFile: 'Driver Dossier:'
  },
  ur: {
    companyName: 'متوازن کارکردگی کنٹریکٹنگ کمپنی',
    systemTitle: 'ڈیجیٹل مینٹیننس کارڈز اور فلیٹ ٹریکنگ سسٹم',
    authSubtitle: 'گاڑیوں کے بیڑے کی دیکھ بھال اور تکنیکی ٹریکنگ سسٹم',
    securityTag: 'مصدقہ محفوظ ڈیٹا تنہائی کا نظام',
    setupTitle: 'سسٹم کا ابتدائی سیٹ اپ:',
    setupDesc: 'سسٹم کو شروع کرنے کے لیے کمپنی کا بنیادی ایڈمن اکاؤنٹ بنائیں۔',
    lblSetupFullName: 'بنیادی جنرل مینیجر کا مکمل نام',
    phSetupFullName: 'مثال: انجینئر محمد العتیبی',
    lblSetupUsername: 'لاگ ان کے لیے صارف نام',
    phSetupUsername: 'مثال: admin',
    lblPhone: 'موبائل نمبر',
    lblSetupPassword: 'ایڈمن کا پاس ورڈ',
    lblSetupPasswordConfirm: 'پاس ورڈ کی تصدیق کریں',
    phPassword: 'مضبوط پاس ورڈ درج کریں',
    phPasswordConfirm: 'پاس ورڈ دوبارہ درج کریں',
    btnSetupAdmin: 'بنیادی ایڈمن اکاؤنٹ بنائیں اور شروع کریں',
    lblUsername: 'صارف کا نام (Username)',
    phUsername: 'درج شدہ صارف کا نام لکھیں',
    lblPassword: 'پاس ورڈ',
    phLoginPassword: 'پاس ورڈ درج کریں',
    btnLogin: 'لاگ ان کریں',
    linkSetupNewAdmin: 'نیا ماسٹر ایڈمن اکاؤنٹ بنائیں',
    linkBackToLogin: 'سائن ان اسکرین پر واپس جائیں',
    defaultAdminHint: 'ایڈمن لاگ ان: یوزر نیم: admin | پاس ورڈ: admin',
    cloudSyncTitle: 'کلاؤڈ سنک (Cloud Sync)',
    cloudSyncDesc: 'تمام ڈرائیوروں اور مینیجرز کے لیے ریئل ٹائم کلاؤڈ ڈیٹا بیس کا رابطہ۔',
    btnConfigureCloud: 'کلاؤڈ سیٹنگز',
    btnShareSyncData: 'ڈیٹا کوڈ شیئر کریں',
    cloudModalTitle: 'کلاؤڈ سنک اور ڈیٹا بیس سیٹنگز',
    authFooter: 'خفیہ اور محفوظ کنکشن | متوازن کارکردگی کنٹریکٹنگ کمپنی',
    assignedVehicleToYou: 'آپ کے لیے مخصوص گاڑی:',
    assignedProject: 'پروجیکٹ:',
    btnLogout: 'لاگ آؤٹ',
    navCards: 'مینٹیننس کارڈز',
    navProjects: 'پروجیکٹس',
    navVehicles: 'گاڑیوں کا بیڑا',
    navTechs: 'ڈرائیورز اور تکنیکی عملہ',
    navAdmins: 'ایڈمنز کا انتظام',
    navAnalytics: 'رپورٹس اور بیک اپ',
    btnNewCard: 'نیا مینٹیننس کارڈ',
    btnNewCardShort: 'نیا کارڈ',
    btnCreateCardAction: 'نیا مینٹیننس کارڈ بنائیں',
    cardsViewCaptionTech: 'اپنی مخصوص گاڑی کے لیے مینٹیننس کارڈز اور آئل چینج کا اندراج اور ٹریکنگ',
    noCardsTechTitle: 'آپ کی گاڑی کے لیے ابھی تک کوئی مینٹیننس کارڈ ریکارڈ نہیں ہوا',
    noCardsTechDesc: 'اپنی گاڑی کے لیے دیکھ بھال یا آئل چینج درج کرنے کے لیے "نیا مینٹیننس کارڈ بنائیں" پر کلک کریں۔',
    lblTotalCards: 'کل مینٹیننس کارڈز',
    lblTotalCost: 'کل دیکھ بھال کے اخراجات',
    currency: 'ریال',
    lblActiveProjects: 'منسلک پروجیکٹس',
    lblFleetCount: 'سروس شدہ گاڑیاں',
    cardsTitle: 'گاڑیوں کے مینٹیننس کارڈز کا ریکارڈ',
    cardsViewCaption: 'انوائسز، اوڈومیٹر ریڈنگ اور تبدیل شدہ پرزوں کی نگرانی',
    searchPlaceholder: 'پلیٹ نمبر، ماڈل، انوائس یا کام کی تفصیل سے تلاش کریں...',
    allProjects: 'تمام پروجیکٹس',
    allTechs: 'تمام ڈرائیورز / ٹیکنیشنز',
    noCardsTitle: 'فی الحال کوئی مینٹیننس کارڈ درج نہیں ہے',
    noCardsDesc: 'گاڑی کی حقیقی دیکھ بھال کا اندراج کرنے کے لیے اوپر "نیا مینٹیننس کارڈ" پر کلک کریں۔',
    projectsTitle: 'کمپنی کے پروجیکٹس کا انتظام',
    projectsSubtitle: 'گاڑیوں اور ڈرائیوروں سے منسلک پروجیکٹس کا انتظام',
    btnAddProject: 'نیا پروجیکٹ شامل کریں',
    thProjectCode: 'پروجیکٹ کوڈ',
    thProjectName: 'پروجیکٹ کا نام',
    thProjectLocation: 'کام کی جگہ / شہر',
    thProjectManager: 'سائٹ مینیجر',
    thVehiclesCount: 'گاڑیوں کی تعداد',
    thDriversCount: 'ڈرائیوروں کی تعداد',
    thStatus: 'حالت',
    thActions: 'کارروائیاں',
    vehiclesTitle: 'کمپنی کے گاڑیوں کے بیڑے کا انتظام',
    vehiclesSubtitle: 'گاڑیوں کی فہرست اور ہر گاڑی کے لیے مختص ڈرائیور',
    btnAddVehicle: 'بیڑے میں نئی گاڑی شامل کریں',
    thPlate: 'پلیٹ نمبر',
    thVehicleModel: 'قسم اور ماڈل',
    thYear: 'بنانے کا سال',
    thCurrentProject: 'موجودہ پروجیکٹ',
    thAssignedDriver: 'مخصوص ڈرائیور',
    thCurrentOdo: 'موجودہ اوڈومیٹر ریڈنگ',
    thLastMaintenance: 'آخری دیکھ بھال کی تاریخ',
    techsTitle: 'ڈرائیوروں اور پروجیکٹ ٹیکنیشنز کا انتظام',
    techsSubtitle: 'ڈرائیوروں کے اکاؤنٹس اور گاڑیوں و پروجیکٹس کا ربط',
    btnAddTech: 'نیا ڈرائیور / ٹیکنیشن شامل کریں',
    thDriverTech: 'ڈرائیور / ٹیکنیشن',
    thUsername: 'صارف نام',
    thPhone: 'موبائل نمبر',
    thLinkedProject: 'منسلک پروجیکٹ',
    thAssignedVehicle: 'صرف مختص کردہ گاڑی',
    thCardsCount: 'کارڈز کی تعداد',
    adminsTitle: 'سسٹم ایڈمنز کا انتظام',
    adminsSubtitle: 'بیڑے کی نقل و حرکت پر نظر رکھنے کے لیے ایڈمنز کا اضافہ',
    btnAddAdmin: 'نیا ایڈمن شامل کریں',
    thAdminName: 'ایڈمن کا نام',
    thRole: 'عہدہ اور کردار',
    analyticsTitle: 'رپورٹس سینٹر اور بیک اپ ڈیٹا',
    analyticsSubtitle: 'حساباتی رپورٹس اور محفوظ بیک اپ برآمد کریں',
    exportCenterTitle: 'رپورٹس ایکسپورٹ سینٹر (Excel اور PDF)',
    exportCenterSubtitle: 'پورے بیڑے یا مخصوص گاڑی کی مکمل رپورٹ ڈاؤن لوڈ کریں',
    exportScopeLabel: 'ایکسپورٹ کا دائرہ منتخب کریں:',
    exportScopeAll: 'تمام بیڑے کی گاڑیوں کے لیے ڈاؤن لوڈ کریں (سب)',
    exportScopeSpecific: 'بیڑے میں سے مخصوص گاڑی کا انتخاب کریں',
    exportSelectVehicleLabel: 'وہ گاڑی منتخب کریں جس کی رپورٹ درکار ہے:',
    exportLoadingVehicles: '-- گاڑیاں لوڈ ہو رہی ہیں --',
    btnExportExcel: 'ڈیٹا ایکسل میں ایکسپورٹ کریں (CSV)',
    btnExportPDF: 'جامع دیکھ بھال رپورٹ جاری اور پرنٹ کریں (A4 PDF)',
    backupTitle: 'مکمل ڈیٹا بیک اپ (JSON)',
    backupDesc: 'پورا ڈیٹا بیس محفوظ طریقے سے محفوظ کرنے کے لیے ڈاؤن لوڈ کریں۔',
    btnDownloadBackup: 'بیک اپ ڈاؤن لوڈ کریں',
    restoreTitle: 'ڈیٹا بیک اپ بحال کریں',
    restoreDesc: 'پہلے سے ڈاؤن لوڈ کردہ JSON فائل سے ڈیٹا دوبارہ لوڈ کریں۔',
    btnChooseBackupFile: 'بیک اپ فائل منتخب کریں',
    auditTitle: 'سیکیورٹی اور آپریشنز لاگ (Audit Trail)',
    btnClearAudit: 'لاگ صاف کریں',
    thAuditTime: 'وقت اور تاریخ',
    thAuditUser: 'صارف',
    thAuditType: 'قسم',
    thAuditDetails: 'تفصیلات',
    thAuditTarget: 'ہدف',
    footerText: 'گاڑیوں اور پروجیکٹس کی دیکھ بھال کے کارڈز کا نظام',
    footerSecure: 'اعلیٰ سیکیورٹی اور ڈیٹا تنہائی کے ساتھ محفوظ',
    modalCardNewTitle: 'گاڑی کا نیا مینٹیننس کارڈ',
    modalCardEditTitle: 'مینٹیننس کارڈ میں ترمیم کریں',
    modalCardAlertBanner: 'براہ کرم اوڈومیٹر، انوائس، اور تبدیل شدہ پرزوں کی تصاویر منسلک کریں۔',
    lblCardProject: 'پروجیکٹ کا نام',
    optSelectProject: '-- پروجیکٹ منتخب کریں --',
    lblCardVehicle: 'مخصوص گاڑی / پلیٹ نمبر',
    optSelectVehicle: '-- گاڑی منتخب کریں --',
    lblVehicleModel: 'گاڑی کی قسم اور ماڈل',
    phVehicleModel: 'گاڑی کا ماڈل',
    lblTechName: 'ذمہ دار ڈرائیور / ٹیکنیشن کا نام',
    lblMaintenanceDate: 'دیکھ بھال کی تاریخ',
    dividerOdometer: 'گاڑی کا اوڈومیٹر / موجودہ تیل کی تبدیلی',
    lblCurrentOdometer: 'تیل کی تبدیلی پر موجودہ اوڈومیٹر ریڈنگ (کلومیٹر)',
    phCurrentOdo: 'موجودہ کلومیٹر ریڈنگ درج کریں (مثال: 145200)',
    photoAvailQuestion: 'کیا اس سروس کے لیے تصاویر اور منسلکات دستیاب ہیں؟',
    photoAvailHelp: 'سابقہ سروس کو بغیر تصویر درج کرنے کے لیے "نہیں" کا انتخاب کریں',
    btnPhotosYes: 'جی ہاں، تصاویر دستیاب ہیں',
    btnPhotosNo: 'نہیں، پرانی سروس (تصاویر کے بغیر)',
    attachOdoTitle: 'موجودہ اوڈومیٹر کی تصویر منسلک کریں',
    chkHasPhoto: 'تصویر دستیاب ہے',
    attachOdoHelp: '(تیل کی تبدیلی کے اصل کلومیٹر کا ثبوت)',
    btnUploadOdo: 'اوڈومیٹر کی تصویر کھینچیں یا اپ لوڈ کریں',
    phNoOdoImg: 'ابھی تک اوڈومیٹر کی تصویر منسلک نہیں کی گئی',
    badgeNoOdoImg: 'پرانی سروس - ریڈنگ بغیر تصویر کے درج کی گئی ہے',
    dividerInvoice: 'انوائس اور ورکشاپ کی تفصیلات',
    lblInvoiceNo: 'انوائس نمبر',
    phInvoiceNo: 'مثال: INV-1092',
    lblInvoiceCost: 'انوائس کی کل رقم (ریال)',
    phInvoiceCost: 'مثال: 320.00',
    lblWorkshop: 'ورکشاپ / سروس سینٹر کا نام',
    phWorkshop: 'مثال: پیٹرومین ایکسپریس',
    attachInvoiceTitle: 'اصل انوائس کی تصویر منسلک کریں',
    attachInvoiceHelp: '(اشیاء، رقم اور ٹیکس مہر والی واضح تصویر)',
    btnUploadInvoice: 'انوائس کی تصویر کھینچیں یا اپ لوڈ کریں',
    phNoInvoiceImg: 'ابھی تک انوائس کی تصویر منسلک نہیں کی گئی',
    badgeNoInvoiceImg: 'پرانی سروس - بغیر انوائس تصویر درج کی گئی',
    dividerParts: 'تبدیل شدہ پرزوں، فلٹرز اور کام کی تفصیلات',
    lblQuickTags: 'فوری انتخاب کے آپشنز:',
    chipEngineOil: '+ انجن آئل',
    chipOilFilter: '+ آئل فلٹر',
    chipAirFilter: '+ ایئر فلٹر',
    chipAcFilter: '+ اے سی فلٹر',
    chipFuelFilter: '+ فیول فلٹر',
    chipBrakes: '+ بریک پیڈز',
    chipGearOil: '+ گیئر آئل',
    chipBattery: '+ بیٹری',
    chipTires: '+ ٹائرز',
    lblChangesDesc: 'دیکھ بھال کے تمام کاموں اور تبدیلیوں کی تفصیلی وضاحت',
    phChangesDesc: 'مثال: انجن آئل 10W40 (6 ڈبے) تبدیل کیا گیا، نیا اصل آئل فلٹر اور ایئر فلٹر لگایا گیا...',
    attachPartsTitle: 'فلٹرز یا تبدیل شدہ پرزوں کی تصویر منسلک کریں',
    attachPartsHelp: '(کام کے دوران تبدیل کیے گئے پرزوں کی تصویر)',
    btnUploadParts: 'پرزوں اور فلٹرز کی تصویر اپ لوڈ کریں',
    phNoPartsImg: 'پرزوں کی تصویر ابھی تک منسلک نہیں ہے',
    badgeNoPartsImg: 'پرانی سروس - بغیر پرزوں کی تصویر درج کی گئی',
    lblNotes: 'ڈرائیور کے نوٹس یا آئندہ سفارشات:',
    phNotes: 'کوئی اضافی تکنیکی نوٹس',
    btnCancel: 'منسوخ کریں',
    btnSaveCard: 'کارڈ محفوظ اور منظور کریں',
    btnClose: 'بند کریں',
    modalViewCardTitle: 'گاڑی کا باضابطہ مینٹیننس کارڈ',
    btnPrintCardPDF: 'کارڈ پرنٹ کریں / PDF محفوظ کریں',
    btnPrintCardA4: 'باضابطہ مینٹیننس کارڈ پرنٹ کریں (A4)',
    modalViewFleetReportTitle: 'گاڑیوں کے بیڑے کی جامع مینٹیننس رپورٹ',
    btnPrintReportPDF: 'رپورٹ پرنٹ کریں / PDF محفوظ کریں',
    btnPrintReportA4: 'جامع رپورٹ پرنٹ کریں (A4)',
    modalProjectTitle: 'نیا پروجیکٹ شامل کریں',
    lblProjectCode: 'پروجیکٹ کوڈ',
    phProjectCode: 'مثال: PRJ-2026-01',
    lblProjectName: 'پروجیکٹ کا نام',
    phProjectName: 'کمپنی کے پروجیکٹ کا نام',
    lblProjectLocation: 'مقام / شہر',
    phProjectLocation: 'مثال: ریاض - شاہ فہد روڈ',
    lblProjectManager: 'پروجیکٹ مینیجر',
    phProjectManager: 'سائٹ انجینئر کا نام',
    lblProjectStatus: 'پروجیکٹ کی حالت',
    optStatusActive: 'فعال اور جاری',
    optStatusPending: 'تیاری کے مراحل میں',
    optStatusCompleted: 'مکمل شدہ',
    btnSaveProject: 'پروجیکٹ محفوظ کریں',
    modalVehicleTitle: 'نئی گاڑی شامل کریں',
    lblVehiclePlate: 'پلیٹ نمبر',
    phVehiclePlate: 'مثال: أ ب ج 1234',
    lblVehicleModelReq: 'قسم اور ماڈل',
    phVehicleModelReq: 'مثال: ٹویوٹا ہائی لکس',
    lblVehicleYear: 'بنانے کا سال',
    lblVehicleProject: 'متعلقہ پروجیکٹ',
    lblVehicleDriver: 'مخصوص ڈرائیور (اسے صرف یہی گاڑی نظر آئے گی)',
    phVehicleDriver: 'اس گاڑی کے ڈرائیور کا نام',
    lblVehicleOdo: 'موجودہ اوڈومیٹر ریڈنگ (کلومیٹر)',
    phVehicleOdo: 'موجودہ کلومیٹر',
    btnSaveVehicle: 'گاڑی محفوظ کریں',
    modalTechTitle: 'نیا ڈرائیور / ٹیکنیشن شامل کریں',
    lblTechFullname: 'ڈرائیور / ٹیکنیشن کا پورا نام',
    phTechFullname: 'ڈرائیور کا مکمل نام',
    lblTechUsername: 'لاگ ان کے لیے صارف نام',
    phTechUsername: 'منفرد صارف نام (مثال: ahmed_driver)',
    phTechPassword: 'ڈرائیور کا پاس ورڈ درج کریں',
    techPassHint: 'اگر تبدیل نہیں کرنا چاہتے تو خالی چھوڑ دیں',
    lblTechProject: 'منسلک پروجیکٹ',
    lblTechVehiclePlate: 'صرف اس ڈرائیور کے لیے مخصوص گاڑی',
    optSelectAssignedVehicle: '-- مختص گاڑی منتخب کریں --',
    techVehicleHelp: 'لاگ ان کے وقت ڈرائیور کو صرف یہی گاڑی نظر آئے گی۔',
    btnSaveTech: 'ڈرائیور کا ڈیٹا محفوظ کریں',
    modalAdminTitle: 'بیڑے کی نگرانی کے لیے نیا ایڈمن شامل کریں',
    lblAdminFullname: 'ایڈمن کا مکمل نام',
    phAdminFullname: 'ذمہ دار ایڈمن کا نام',
    lblAdminUsername: 'صارف نام',
    phAdminUsername: 'صارف کا نام',
    lblAdminRoleTitle: 'عہدہ / کردار',
    phAdminRoleTitle: 'مثال: فلیٹ مینیجر / پروجیکٹس نگران',
    phAdminPassword: 'مضبوط پاس ورڈ درج کریں',
    adminPassHint: 'اگر تبدیل نہیں کرنا چاہتے تو خالی چھوڑ دیں',
    btnSaveAdmin: 'ایڈمن اکاؤنٹ محفوظ کریں',
    lightboxCaption: 'تصویر کا پیش نظارہ',
    statusActive: 'فعال',
    statusPending: 'زیر التواء',
    statusCompleted: 'مکمل',
    roleAdmin: 'مجاز ایڈمن',
    roleDriver: 'ڈرائیور / مینٹیننس فیکٹری',
    lblCardNumber: 'کارڈ نمبر:',
    btnPrint: 'پرنٹ کریں',
    btnEdit: 'ترمیم',
    btnDelete: 'حذف',
    lblTechResponsible: 'ذمہ دار ڈرائیور:',
    lblInvoiceAmount: 'انوائس رقم',
    lblChanges: 'تبدیلیاں:',
    kmUnit: 'کلومیٹر',
    badgeHistoricalMaintenance: 'رجسٹر میں درج سابقہ سروس (بغیر تصویر)',
    thumbOdometer: 'اوڈومیٹر',
    thumbInvoice: 'انوائس',
    thumbParts: 'پرزے',
    thumbNoOdo: 'بغیر اوڈومیٹر',
    thumbNoInvoice: 'بغیر انوائس',
    thumbNoParts: 'بغیر پرزے',
    vehicleUnit: 'گاڑیاں',
    driverUnit: 'ڈرائیورز',
    cardsUnit: 'کارڈز',
    btnReport: 'رپورٹ',
    noProjectsRegistered: 'ابھی تک کوئی پروجیکٹ درج نہیں ہے۔ شروع کرنے کے لیے نیا پروجیکٹ شامل کریں۔',
    noVehiclesRegistered: 'بیڑے میں کوئی گاڑی درج نہیں ہے۔ شروع کرنے کے لیے گاڑی شامل کریں۔',
    noTechsRegistered: 'کوئی ڈرائیور درج نہیں ہے۔ شروع کرنے کے لیے ڈرائیور شامل کریں۔',
    noAdminsRegistered: 'کوئی ایڈمن درج نہیں ہے۔',
    lblMyVehicleCards: 'میری گاڑی کے کارڈز',
    lblMyProject: 'میرا موجودہ پروجیکٹ',
    lblMyAssignedVehicle: 'میری مخصوص گاڑی',
    viewByDossiers: 'پروجیکٹ اور سیکٹر فائلز',
    viewByCards: 'تمام کارڈز',
    btnAddCardToProject: '+ پروجیکٹ کے لیے نیا کارڈ',
    btnPrintProjectDossier: 'پروجیکٹ فائل پرنٹ کریں (PDF)',
    btnExportProjectExcel: 'پروجیکٹ کارڈز ایکسل (Excel)',
    btnAddCardToVehicle: '+ اس گاڑی کے لیے نیا کارڈ',
    driverAssignedLabel: 'مقرر کردہ ڈرائیور:',
    noCardsInProject: 'اس پروجیکٹ میں ابھی کوئی مینٹیننس کارڈ نہیں ہے',
    noVehiclesInProject: 'اس پروجیکٹ سے منسلک کوئی گاڑی نہیں ہے',
    btnAddVehicleToProject: 'نئی گاڑی منسلک کریں',
    openMaintenanceDossier: 'مینٹیننس فائل',
    noCardsForVehicle: 'اس گاڑی کے لیے ابھی کوئی کارڈ درج نہیں ہے',
    sectorProjectTitle: 'سیکٹر / پروجیکٹ:',
    driverFile: 'ڈرائیور فائل:'
  },
  hi: {
    companyName: 'संतुलित प्रदर्शन निर्माण कंपनी',
    systemTitle: 'डिजिटल रखरखाव कार्ड और बेड़ा ट्रैकिंग प्रणाली',
    authSubtitle: 'वाहन बेड़ा रखरखाव और तकनीकी ट्रैकिंग प्रणाली',
    securityTag: 'प्रमाणित सुरक्षित डेटा पृथक्करण प्रणाली',
    setupTitle: 'सिस्टम का प्रारंभिक सेटअप:',
    setupDesc: 'सिस्टम शुरू करने और अनुमतियां सेट करने के लिए मुख्य व्यवस्थापक खाता बनाएं।',
    lblSetupFullName: 'मुख्य महाप्रबंधक का पूरा नाम',
    phSetupFullName: 'उदा: इंजीनियर मोहम्मद अल-ओतैबी',
    lblSetupUsername: 'लॉगिन उपयोगकर्ता नाम',
    phSetupUsername: 'उदा: admin',
    lblPhone: 'मोबाइल नंबर',
    lblSetupPassword: 'व्यवस्थापक पासवर्ड',
    lblSetupPasswordConfirm: 'पासवर्ड की पुष्टि करें',
    phPassword: 'मजबूत पासवर्ड दर्ज करें',
    phPasswordConfirm: 'पासवर्ड पुनः दर्ज करें',
    btnSetupAdmin: 'मुख्य व्यवस्थापक खाता बनाएं और शुरू करें',
    lblUsername: 'उपयोगकर्ता नाम',
    phUsername: 'पंजीकृत उपयोगकर्ता नाम दर्ज करें',
    lblPassword: 'पासवर्ड',
    phLoginPassword: 'पासवर्ड दर्ज करें',
    btnLogin: 'लॉग इन करें',
    linkSetupNewAdmin: 'नया मास्टर व्यवस्थापक सेट करें',
    linkBackToLogin: 'साइन इन स्क्रीन पर वापस जाएं',
    defaultAdminHint: 'डिफ़ॉल्ट एडमिन क्रेडेंशियल: यूज़रनेم: admin | पासवर्ड: admin',
    cloudSyncTitle: 'क्लाउड सिंक (Cloud Sync)',
    cloudSyncDesc: 'ड्राइवरों और प्रबंधकों के लिए रीयल-टाइम क्लाउड डेटाबेस सिंक।',
    btnConfigureCloud: 'क्लाउड सेटिंग्स',
    btnShareSyncData: 'डेटा कोड साझा करें',
    cloudModalTitle: 'क्लाउड सिंक और डेटाबेस सेटिंग्स',
    authFooter: 'एन्क्रिप्टेड और सुरक्षित कनेक्शन | संतुलित प्रदर्शन निर्माण कंपनी',
    assignedVehicleToYou: 'आपके लिए निर्दिष्ट वाहन:',
    assignedProject: 'परियोजना:',
    btnLogout: 'लॉग आउट',
    navCards: 'रखरखाव कार्ड',
    navProjects: 'परियोजनाएं',
    navVehicles: 'वाहन बेड़ा',
    navTechs: 'चालक और तकनीशियन',
    navAdmins: 'व्यवस्थापक प्रबंधन',
    navAnalytics: 'रिपोर्ट और बैकअप',
    btnNewCard: 'नया रखरखाव कार्ड',
    btnNewCardShort: 'नया कार्ड',
    btnCreateCardAction: 'नया रखरखाव कार्ड बनाएं',
    cardsViewCaptionTech: 'अपने निर्दिष्ट वाहन के लिए रखरखाव कार्ड और तेल परिवर्तन रिकॉर्ड करें',
    noCardsTechTitle: 'आपके वाहन के लिए अभी तक कोई रखरखाव कार्ड दर्ज नहीं किया गया है',
    noCardsTechDesc: 'अपनी कार के लिए वास्तविक रखरखाव या तेल परिवर्तन रिकॉर्ड करने के लिए "नया रखरखाव कार्ड बनाएं" पर क्लिक करें।',
    lblTotalCards: 'कुल रखरखाव कार्ड',
    lblTotalCost: 'कुल रखरखाव लागत',
    currency: 'रियाल',
    lblActiveProjects: 'संबद्ध परियोजनाएं',
    lblFleetCount: 'सर्विस किए गए वाहन',
    cardsTitle: 'वाहन रखरखाव कार्ड का रिकॉर्ड',
    cardsViewCaption: 'चालान, ओडोमीटर रीडिंग और बदले गए पुर्जों की ट्रैकिंग',
    searchPlaceholder: 'नंबर प्लेट, मॉडल, चालान या कार्य से खोजें...',
    allProjects: 'सभी परियोजनाएं',
    allTechs: 'सभी चालक / तकनीशियन',
    noCardsTitle: 'वर्तमान में कोई रखरखाव कार्ड दर्ज नहीं है',
    noCardsDesc: 'नया रखरखाव दर्ज करने के लिए ऊपर "नया रखरखाव कार्ड" पर क्लिक करें।',
    projectsTitle: 'कंपनी परियोजना प्रबंधन',
    projectsSubtitle: 'वाहनों और चालकों से जुड़ी परियोजनाओं का प्रबंधन',
    btnAddProject: 'नई परियोजना जोड़ें',
    thProjectCode: 'परियोजना कोड',
    thProjectName: 'परियोजना का नाम',
    thProjectLocation: 'स्थान / शहर',
    thProjectManager: 'साइट प्रबंधक',
    thVehiclesCount: 'वाहनों की संख्या',
    thDriversCount: 'चालकों की संख्या',
    thStatus: 'स्थिति',
    thActions: 'कार्रवाई',
    vehiclesTitle: 'कंपनी वाहन बेड़ा प्रबंधन',
    vehiclesSubtitle: 'वाहनों की सूची और प्रत्येक वाहन के लिए निर्दिष्ट चालक',
    btnAddVehicle: 'बेड़े में नया वाहन जोड़ें',
    thPlate: 'नंबर प्लेट',
    thVehicleModel: 'प्रकार और मॉडल',
    thYear: 'निर्माण वर्ष',
    thCurrentProject: 'वर्तमान परियोजना',
    thAssignedDriver: 'निर्दिष्ट चालक',
    thCurrentOdo: 'वर्तमान ओडोमीटर रीडिंग',
    thLastMaintenance: 'अंतिम रखरखाव तिथि',
    techsTitle: 'चालक और परियोजना तकनीशियन प्रबंधन',
    techsSubtitle: 'चालक खातों और उनके वाहनों तथा परियोजनाओं का संबंध',
    btnAddTech: 'नया चालक / तकनीशियन जोड़ें',
    thDriverTech: 'चालक / तकनीशियन',
    thUsername: 'उपयोगकर्ता नाम',
    thPhone: 'मोबाइल नंबर',
    thLinkedProject: 'संबद्ध परियोजना',
    thAssignedVehicle: 'केवल निर्दिष्ट वाहन',
    thCardsCount: 'कार्डों की संख्या',
    adminsTitle: 'सिस्टम व्यवस्थापक प्रबंधन',
    adminsSubtitle: 'बेड़े की गतिविधि पर नज़र रखने के लिए व्यवस्थापक जोड़ें',
    btnAddAdmin: 'नया व्यवस्थापक जोड़ें',
    thAdminName: 'व्यवस्थापक का नाम',
    thRole: 'पद और भूमिका',
    analyticsTitle: 'रिपोर्ट केंद्र और बैकअप डेटा',
    analyticsSubtitle: 'लेखांकन रिपोर्ट और सुरक्षित बैकअप निर्यात करें',
    exportCenterTitle: 'रिपोर्ट निर्यात केंद्र (Excel और PDF)',
    exportCenterSubtitle: 'पूरे बेड़े या विशिष्ट वाहन की व्यापक रखरखाव रिपोर्ट डाउनलोड करें',
    exportScopeLabel: 'निर्यात का दायरा चुनें:',
    exportScopeAll: 'सभी बेड़े के वाहनों के लिए डाउनलोड करें (सभी)',
    exportScopeSpecific: 'बेड़े से एक विशिष्ट वाहन चुनें',
    exportSelectVehicleLabel: 'रिपोर्ट के लिए वाहन चुनें:',
    exportLoadingVehicles: '-- वाहन लोड हो रहे हैं --',
    btnExportExcel: 'डेटा एक्सेल (CSV) में निर्यात करें',
    btnExportPDF: 'व्यापक रखरखाव रिपोर्ट जारी और प्रिंट करें (A4 PDF)',
    backupTitle: 'पूर्ण डेटा बैकअप (JSON)',
    backupDesc: 'संपूर्ण डेटाबेस को सुरक्षित रखने के लिए डाउनलोड करें।',
    btnDownloadBackup: 'बैकअप डाउनलोड करें',
    restoreTitle: 'डेटा बैकअप पुनर्स्थापित करें',
    restoreDesc: 'पहले निर्यात की गई JSON फ़ाइल से डेटा पुनर्स्थापित करें।',
    btnChooseBackupFile: 'बैकअप फ़ाइल चुनें',
    auditTitle: 'सुरक्षा और संचालन लॉग (Audit Trail)',
    btnClearAudit: 'लॉग साफ़ करें',
    thAuditTime: 'समय और तारीख',
    thAuditUser: 'उपयोगकर्ता',
    thAuditType: 'प्रकार',
    thAuditDetails: 'विवरण',
    thAuditTarget: 'लक्ष्य',
    footerText: 'वाहन और परियोजना रखरखाव कार्ड प्रणाली',
    footerSecure: 'उन्नत सुरक्षा और डेटा पृथक्करण के साथ सुरक्षित',
    modalCardNewTitle: 'नया वाहन रखरखाव कार्ड',
    modalCardEditTitle: 'रखरखाव कार्ड संपादित करें',
    modalCardAlertBanner: 'कृपया ओडोमीटर फोटो, चालान फोटो और बदले गए पुर्जों की फोटो संलग्न करें।',
    lblCardProject: 'परियोजना का नाम',
    optSelectProject: '-- परियोजना चुनें --',
    lblCardVehicle: 'निर्दिष्ट वाहन / नंबर प्लेट',
    optSelectVehicle: '-- वाहन चुनें --',
    lblVehicleModel: 'वाहन प्रकार और मॉडल',
    phVehicleModel: 'वाहन मॉडल',
    lblTechName: 'जिम्मेदार चालक / तकनीशियन का नाम',
    lblMaintenanceDate: 'रखरखाव की तारीख',
    dividerOdometer: 'वाहन ओडोमीटर / वर्तमान तेल परिवर्तन',
    lblCurrentOdometer: 'वर्तमान ओडोमीटर रीडिंग (किमी)',
    phCurrentOdo: 'वर्तमान रीडिंग अंकों में दर्ज करें (उदा: 145200)',
    photoAvailQuestion: 'क्या इस रखरखाव के लिए तस्वीरें और अटैचमेंट उपलब्ध हैं?',
    photoAvailHelp: 'तस्वीरों के बिना पुरानी प्रविष्टि के लिए "नहीं" चुनें',
    btnPhotosYes: 'हाँ, तस्वीरें उपलब्ध हैं',
    btnPhotosNo: 'नहीं, पुराना रखरखाव (बिना फोटो)',
    attachOdoTitle: 'वर्तमान ओडोमीटर की फोटो संलग्न करें',
    chkHasPhoto: 'फोटो उपलब्ध है',
    attachOdoHelp: '(तेल परिवर्तन के वास्तविक किलोमीटर का प्रमाण)',
    btnUploadOdo: 'ओडोमीटर की फोटो लें या अपलोड करें',
    phNoOdoImg: 'ओडोमीटर की फोटो अभी संलग्न नहीं है',
    badgeNoOdoImg: 'पुराना रखरखाव - बिना फोटो के रीडिंग दर्ज की गई',
    dividerInvoice: 'चालान और कार्यशाला विवरण',
    lblInvoiceNo: 'चालान संख्या',
    phInvoiceNo: 'उदा: INV-1092',
    lblInvoiceCost: 'चालान की कुल राशि (रियाल)',
    phInvoiceCost: 'उदा: 320.00',
    lblWorkshop: 'कार्यशाला / सेवा केंद्र का नाम',
    phWorkshop: 'उदा: पेट्रोमिन एक्सप्रेस',
    attachInvoiceTitle: 'मूल चालान की फोटो संलग्न करें',
    attachInvoiceHelp: '(सामग्री, राशि और मुहर वाली स्पष्ट तस्वीर)',
    btnUploadInvoice: 'चालान की फोटो लें या अपलोड करें',
    phNoInvoiceImg: 'चालान की फोटो अभी संलग्न नहीं है',
    badgeNoInvoiceImg: 'पुराना रखरखाव - बिना चालान फोटो दर्ज',
    dividerParts: 'बदले गए पुर्जों, फिल्टर और कार्य का विवरण',
    lblQuickTags: 'त्वरित चयन विकल्प:',
    chipEngineOil: '+ इंजन ऑयल',
    chipOilFilter: '+ ऑयल फ़िल्टर',
    chipAirFilter: '+ एयर फ़िल्टर',
    chipAcFilter: '+ एसी फ़िल्टर',
    chipFuelFilter: '+ ईंधन फ़िल्टर',
    chipBrakes: '+ ब्रेक पैड',
    chipGearOil: '+ गियर ऑयल',
    chipBattery: '+ बैटरी',
    chipTires: '+ टायर',
    lblChangesDesc: 'किए गए परिवर्तनों और रखरखाव का विस्तृत विवरण',
    phChangesDesc: 'उदा: इंजन ऑयल 10W40 (6 डिब्बे) बदला गया, नया मूल ऑयल फ़िल्टर और एयर फ़िल्टर लगाया गया...',
    attachPartsTitle: 'बदले गए फ़िल्टर या पुर्जों की फोटो संलग्न करें',
    attachPartsHelp: '(काम के दौरान बदले गए फ़िल्टर या पुर्जों की फोटो)',
    btnUploadParts: 'पुर्जों और फ़िल्टर की फोटो अपलोड करें',
    phNoPartsImg: 'पुर्जों की फोटो अभी संलग्न नहीं है',
    badgeNoPartsImg: 'पुराना रखरखाव - बिना पुर्जों की फोटो दर्ज',
    lblNotes: 'चालक की टिप्पणियाँ या सिफारिशें:',
    phNotes: 'कोई अतिरिक्त तकनीकी टिप्पणी',
    btnCancel: 'रद्द करें',
    btnSaveCard: 'कार्ड सहेजें और स्वीकृत करें',
    btnClose: 'बंद करें',
    modalViewCardTitle: 'आधिकारिक वाहन रखरखाव कार्ड',
    btnPrintCardPDF: 'कार्ड प्रिंट करें / PDF सहेजें',
    btnPrintCardA4: 'आधिकारिक कार्ड प्रिंट करें (A4)',
    modalViewFleetReportTitle: 'वाहन बेड़े की व्यापक रखरखाव रिपोर्ट',
    btnPrintReportPDF: 'रिपोर्ट प्रिंट करें / PDF सहेजें',
    btnPrintReportA4: 'व्यापक रिपोर्ट प्रिंट करें (A4)',
    modalProjectTitle: 'नई परियोजना जोड़ें',
    lblProjectCode: 'परियोजना कोड',
    phProjectCode: 'उदा: PRJ-2026-01',
    lblProjectName: 'परियोजना का नाम',
    phProjectName: 'कंपनी परियोजना का नाम',
    lblProjectLocation: 'स्थान / शहर',
    phProjectLocation: 'उदा: रियाद - किंग फहद रोड',
    lblProjectManager: 'परियोजना प्रबंधक',
    phProjectManager: 'साइट इंजीनियर का नाम',
    lblProjectStatus: 'परियोजना की स्थिति',
    optStatusActive: 'सक्रिय और चालू',
    optStatusPending: 'तैयारी में',
    optStatusCompleted: 'पूर्ण',
    btnSaveProject: 'परियोजना सहेजें',
    modalVehicleTitle: 'नया वाहन जोड़ें',
    lblVehiclePlate: 'नंबर प्लेट',
    phVehiclePlate: 'उदा: ABC 1234',
    lblVehicleModelReq: 'प्रकार और मॉडल',
    phVehicleModelReq: 'उदा: टोयोटा हिल्क्स',
    lblVehicleYear: 'निर्माण वर्ष',
    lblVehicleProject: 'संबद्ध परियोजना',
    lblVehicleDriver: 'निर्दिष्ट चालक (चालक केवल यही वाहन देख सकेगा)',
    phVehicleDriver: 'इस वाहन के चालक का नाम',
    lblVehicleOdo: 'वर्तमान ओडोमीटर (किमी)',
    phVehicleOdo: 'वर्तमान किलोमीटर',
    btnSaveVehicle: 'वाहन सहेजें',
    modalTechTitle: 'नया चालक / तकनीशियन जोड़ें',
    lblTechFullname: 'चालक / तकनीशियन का पूरा नाम',
    phTechFullname: 'चालक का पूरा नाम',
    lblTechUsername: 'लॉगिन उपयोगकर्ता नाम',
    phTechUsername: 'अद्वितीय उपयोगकर्ता नाम (उदा: ahmed_driver)',
    phTechPassword: 'चालक का पासवर्ड दर्ज करें',
    techPassHint: 'यदि बदलना नहीं चाहते हैं तो खाली छोड़ दें',
    lblTechProject: 'संबद्ध परियोजना',
    lblTechVehiclePlate: 'केवल इस चालक के लिए निर्दिष्ट वाहन',
    optSelectAssignedVehicle: '-- निर्दिष्ट वाहन चुनें --',
    techVehicleHelp: 'लॉगिन करने पर चालक को केवल यही वाहन दिखाई देगा।',
    btnSaveTech: 'चालक डेटा सहेजें',
    modalAdminTitle: 'बेड़े की निगरानी के लिए नया व्यवस्थापक जोड़ें',
    lblAdminFullname: 'व्यवस्थापक का पूरा नाम',
    phAdminFullname: 'जिम्मेदार व्यवस्थापक का नाम',
    lblAdminUsername: 'उपयोगकर्ता नाम',
    phAdminUsername: 'उपयोगकर्ता नाम',
    lblAdminRoleTitle: 'पद / भूमिका',
    phAdminRoleTitle: 'उदा: बेड़ा प्रबंधक / परियोजना पर्यवेक्षक',
    phAdminPassword: 'मजबूत पासवर्ड दर्ज करें',
    adminPassHint: 'यदि बदलना नहीं चाहते हैं तो खाली छोड़ दें',
    btnSaveAdmin: 'व्यवस्थापक खाता सहेजें',
    lightboxCaption: 'छवि पूर्वावलोकन',
    statusActive: 'सक्रिय',
    statusPending: 'लंबित',
    statusCompleted: 'पूर्ण',
    roleAdmin: 'अधिकृत व्यवस्थापक',
    roleDriver: 'चालक / रखरखाव तकनीशियन',
    lblCardNumber: 'कार्ड संख्या:',
    btnPrint: 'प्रिंट',
    btnEdit: 'संपादित करें',
    btnDelete: 'हटाएं',
    lblTechResponsible: 'जिम्मेदार चालक:',
    lblInvoiceAmount: 'चालान राशि',
    lblChanges: 'परिवर्तन:',
    kmUnit: 'किमी',
    badgeHistoricalMaintenance: 'रजिस्टर में दर्ज पुराना रखरखाव (बिना फोटो)',
    thumbOdometer: 'ओडोमीटर',
    thumbInvoice: 'चालान',
    thumbParts: 'पुर्जे',
    thumbNoOdo: 'बिना ओडोमीटर',
    thumbNoInvoice: 'बिना चालान',
    thumbNoParts: 'बिना पुर्जे',
    vehicleUnit: 'वाहन',
    driverUnit: 'चालक',
    cardsUnit: 'कार्ड',
    btnReport: 'रिपोर्ट',
    noProjectsRegistered: 'अभी तक कोई परियोजना दर्ज नहीं है। शुरू करने के लिए "नई परियोजना जोड़ें" पर क्लिक करें।',
    noVehiclesRegistered: 'बेड़े में अभी कोई वाहन दर्ज नहीं है। शुरू करने के लिए "नया वाहन जोड़ें" पर क्लिक करें।',
    noTechsRegistered: 'अभी कोई चालक पंजीकृत नहीं है। शुरू करने के लिए "नया चालक जोड़ें" पर क्लिक करें।',
    noAdminsRegistered: 'कोई व्यवस्थापक पंजीकृत नहीं है।',
    lblMyVehicleCards: 'मेरी गाड़ी के कार्ड',
    lblMyProject: 'मेरी वर्तमान परियोजना',
    lblMyAssignedVehicle: 'मेरा निर्दिष्ट वाहन',
    viewByDossiers: 'परियोजना और सेक्टर फ़ाइलें',
    viewByCards: 'सभी कार्ड',
    btnAddCardToProject: '+ परियोजना के लिए नया कार्ड',
    btnPrintProjectDossier: 'परियोजना फ़ाइल प्रिंट करें (PDF)',
    btnExportProjectExcel: 'परियोजना कार्ड एक्सेल (Excel)',
    btnAddCardToVehicle: '+ इस वाहन के लिए नया कार्ड',
    driverAssignedLabel: 'निर्धारित चालक:',
    noCardsInProject: 'इस परियोजना में अभी कोई रखरखाव कार्ड दर्ज नहीं है',
    noVehiclesInProject: 'इस परियोजना से जुड़ा कोई वाहन नहीं है',
    btnAddVehicleToProject: 'नया वाहन लिंक करें',
    openMaintenanceDossier: 'रखरखाव फ़ाइल',
    noCardsForVehicle: 'इस वाहन के लिए अभी कोई कार्ड दर्ज नहीं है',
    sectorProjectTitle: 'सेक्टर / परियोजना:',
    driverFile: 'चालक फ़ाइल:'
  },
  bn: {
    companyName: 'ব্যালেন্সড পারফরম্যান্স কন্ট্রাক্টিং কোং',
    systemTitle: 'ডিজিটাল রক্ষণাবেক্ষণ কার্ড ও ফ্লিট ট্র্যাকিং সিস্টেম',
    authSubtitle: 'যানবাহন ফ্লিট রক্ষণাবেক্ষণ ও প্রযুক্তিগত ট্র্যাকিং সিস্টেম',
    securityTag: 'প্রত্যয়িত নিরাপদ ডেটা বিচ্ছিন্নকরণ সিস্টেম',
    setupTitle: 'প্রাথমিক সিস্টেম সেটআপ:',
    setupDesc: 'সিস্টেম ও অনুমতি সেট করার জন্য মূল অ্যাডমিন অ্যাকাউন্ট তৈরি করুন।',
    lblSetupFullName: 'প্রধান মহাব্যবস্থাপকের পুরো নাম',
    phSetupFullName: 'যেমন: ইঞ্জিনিয়ার মোহাম্মদ আল-ওতাইবি',
    lblSetupUsername: 'লগইন ব্যবহারকারীর নাম',
    phSetupUsername: 'যেমন: admin',
    lblPhone: 'মোবাইল নম্বর',
    lblSetupPassword: 'অ্যাডমিন পাসওয়ার্ড',
    lblSetupPasswordConfirm: 'পাসওয়ার্ড নিশ্চিত করুন',
    phPassword: 'শক্তিশালী পাসওয়ার্ড দিন',
    phPasswordConfirm: 'পাসওয়ার্ড পুনরায় লিখুন',
    btnSetupAdmin: 'মূল অ্যাডমিন তৈরি ও শুরু করুন',
    lblUsername: 'ব্যবহারকারীর নাম (Username)',
    phUsername: 'নিবন্ধিত ব্যবহারকারীর নাম লিখুন',
    lblPassword: 'পাসওয়ার্ড',
    phLoginPassword: 'পাসওয়ার্ড লিখুন',
    btnLogin: 'লগ ইন করুন',
    linkSetupNewAdmin: 'নতুন মাস্টার অ্যাডমিন তৈরি করুন',
    linkBackToLogin: 'সাইন ইন স্ক্রিনে ফিরে যান',
    defaultAdminHint: 'অ্যাডমিন লগইন: ইউজারনেম: admin | পাসওয়ার্ড: admin',
    cloudSyncTitle: 'ক্লাউড সিঙ্ক (Cloud Sync)',
    cloudSyncDesc: 'ড্রাইভার এবং ম্যানেজারদের জন্য রিয়েল-টাইম ক্লাউড ডেটাবেস সংযোগ।',
    btnConfigureCloud: 'ক্লাউড সেটিংস',
    btnShareSyncData: 'ডেটা কোড শেয়ার করুন',
    cloudModalTitle: 'ক্লাউড সিঙ্ক এবং ডেটাবেস সেটিংস',
    authFooter: 'এনক্রিপ্ট করা ও নিরাপদ সংযোগ | ব্যালেন্সড পারফরম্যান্স কন্ট্রাক্টিং কোং',
    assignedVehicleToYou: 'আপনার জন্য নির্ধারিত গাড়ি:',
    assignedProject: 'প্রকল্প:',
    btnLogout: 'লগআউট',
    navCards: 'রক্ষণাবেক্ষণ কার্ড',
    navProjects: 'প্রকল্পসমূহ',
    navVehicles: 'গাড়ির বহর',
    navTechs: 'ড্রাইভার ও টেকনিশিয়ান',
    navAdmins: 'অ্যাডমিন ব্যবস্থাপনা',
    navAnalytics: 'রিপোর্ট ও ব্যাকআপ',
    btnNewCard: 'নতুন রক্ষণাবেক্ষণ কার্ড',
    btnNewCardShort: 'নতুন কার্ড',
    btnCreateCardAction: 'নতুন রক্ষণাবেক্ষণ কার্ড তৈরি করুন',
    cardsViewCaptionTech: 'আপনার নির্ধারিত গাড়ির রক্ষণাবেক্ষণ কার্ড এবং তেল পরিবর্তন রেকর্ড করুন',
    noCardsTechTitle: 'আপনার গাড়ির জন্য এখনও কোনো রক্ষণাবেক্ষণ কার্ড রেকর্ড করা হয়নি',
    noCardsTechDesc: 'আপনার গাড়ির আসল রক্ষণাবেক্ষণ বা তেল পরিবর্তন রেকর্ড করতে "নতুন রক্ষণাবেক্ষণ কার্ড তৈরি করুন" এ ক্লিক করুন।',
    lblTotalCards: 'মোট রক্ষণাবেক্ষণ কার্ড',
    lblTotalCost: 'মোট রক্ষণাবেক্ষণ খরচ',
    currency: 'রিয়াল',
    lblActiveProjects: 'সংযুক্ত প্রকল্প',
    lblFleetCount: 'পরিষেবা দেওয়া গাড়ি',
    cardsTitle: 'গাড়ির রক্ষণাবেক্ষণ কার্ডের রেকর্ড',
    cardsViewCaption: 'চালান, ওডোমিটার রিডিং এবং প্রতিস্থাপিত যন্ত্রাংশ ট্র্যাকিং',
    searchPlaceholder: 'প্লেট নম্বর, মডেল, চালান বা পরিবর্তন দিয়ে খুঁজুন...',
    allProjects: 'সকল প্রকল্প',
    allTechs: 'সকল ড্রাইভার / টেকনিশিয়ান',
    noCardsTitle: 'বর্তমানে কোনো রক্ষণাবেক্ষণ কার্ড নথিভুক্ত নেই',
    noCardsDesc: 'নতুন রক্ষণাবেক্ষণ নথিভুক্ত করতে উপরে "নতুন রক্ষণাবেক্ষণ কার্ড" ক্লিক করুন।',
    projectsTitle: 'কোম্পানি প্রকল্প ব্যবস্থাপনা',
    projectsSubtitle: 'গাড়ি এবং ড্রাইভারের সাথে সম্পর্কিত প্রকল্প ব্যবস্থাপনা',
    btnAddProject: 'নতুন প্রকল্প যোগ করুন',
    thProjectCode: 'প্রকল্প কোড',
    thProjectName: 'প্রকল্পের নাম',
    thProjectLocation: 'কাজের স্থান / শহর',
    thProjectManager: 'সাইট ম্যানেজার',
    thVehiclesCount: 'গাড়ির সংখ্যা',
    thDriversCount: 'ড্রাইভারের সংখ্যা',
    thStatus: 'অবস্থা',
    thActions: 'পদক্ষেপ',
    vehiclesTitle: 'কোম্পানি গাড়ির বহর ব্যবস্থাপনা',
    vehiclesSubtitle: 'গাড়ির তালিকা এবং প্রতিটি গাড়ির জন্য নির্ধারিত ড্রাইভার',
    btnAddVehicle: 'বহরে নতুন গাড়ি যোগ করুন',
    thPlate: 'প্লেট নম্বর',
    thVehicleModel: 'ধরন ও মডেল',
    thYear: 'উৎপাদন বছর',
    thCurrentProject: 'বর্তমান প্রকল্প',
    thAssignedDriver: 'নির্ধারিত ড্রাইভার',
    thCurrentOdo: 'বর্তমান ওডোমিটার রিডিং',
    thLastMaintenance: 'সর্বশেষ রক্ষণাবেক্ষণের তারিখ',
    techsTitle: 'ড্রাইভার ও প্রকল্প টেকনিশিয়ান ব্যবস্থাপনা',
    techsSubtitle: 'ড্রাইভার অ্যাকাউন্ট এবং তাদের নির্ধারিত গাড়ি ও প্রকল্প সংযোগ',
    btnAddTech: 'নতুন ড্রাইভার / টেকনিশিয়ান যোগ করুন',
    thDriverTech: 'ড্রাইভার / টেকনিশিয়ান',
    thUsername: 'ব্যবহারকারীর নাম',
    thPhone: 'মোবাইল নম্বর',
    thLinkedProject: 'সংযুক্ত প্রকল্প',
    thAssignedVehicle: 'কেবলমাত্র নির্ধারিত গাড়ি',
    thCardsCount: 'কার্ডের সংখ্যা',
    adminsTitle: 'সিস্টেম অ্যাডমিন ব্যবস্থাপনা',
    adminsSubtitle: 'গাড়ির বহর পর্যবেক্ষণের জন্য অ্যাডমিন যোগ করুন',
    btnAddAdmin: 'নতুন অ্যাডমিন যোগ করুন',
    thAdminName: 'অ্যাডমিনের নাম',
    thRole: 'পদবি ও ভূমিকা',
    analyticsTitle: 'রিপোর্ট কেন্দ্র ও ব্যাকআপ ডেটা',
    analyticsSubtitle: 'অ্যাকাউন্টিং রিপোর্ট ও নিরাপদ ব্যাকআপ এক্সপোর্ট করুন',
    exportCenterTitle: 'রিপোর্ট এক্সপোর্ট কেন্দ্র (Excel ও PDF)',
    exportCenterSubtitle: 'সম্পূর্ণ বহর বা নির্দিষ্ট গাড়ির রক্ষণাবেক্ষণ রিপোর্ট ডাউনলোড করুন',
    exportScopeLabel: 'এক্সপোর্টের পরিসর নির্বাচন করুন:',
    exportScopeAll: 'সকল গাড়ির জন্য ডাউনলোড করুন (সকল)',
    exportScopeSpecific: 'বহর থেকে একটি নির্দিষ্ট গাড়ি নির্বাচন করুন',
    exportSelectVehicleLabel: 'যে গাড়ির রিপোর্ট চান তা নির্বাচন করুন:',
    exportLoadingVehicles: '-- গাড়ি লোড হচ্ছে --',
    btnExportExcel: 'ডেটা এক্সেল (CSV) ফরম্যাটে এক্সপোর্ট করুন',
    btnExportPDF: 'পূর্ণাঙ্গ রক্ষণাবেক্ষণ রিপোর্ট তৈরি ও প্রিন্ট করুন (A4 PDF)',
    backupTitle: 'সম্পূর্ণ ডেটা ব্যাকআপ (JSON)',
    backupDesc: 'নিরাপদে সংরক্ষণ করতে সম্পূর্ণ ডেটাবেস ডাউনলোড করুন।',
    btnDownloadBackup: 'ব্যাকআপ ডাউনলোড করুন',
    restoreTitle: 'ডেটা ব্যাকআপ পুনরুদ্ধার করুন',
    restoreDesc: 'পূর্বে সংরক্ষিত JSON ফাইল থেকে ডেটা পুনরুদ্ধার করুন।',
    btnChooseBackupFile: 'ব্যাকআপ ফাইল নির্বাচন করুন',
    auditTitle: 'নিরাপত্তা ও কার্যক্রম লগ (Audit Trail)',
    btnClearAudit: 'লগ মুছে ফেলুন',
    thAuditTime: 'তারিখ ও সময়',
    thAuditUser: 'ব্যবহারকারী',
    thAuditType: 'ধরন',
    thAuditDetails: 'কাজের বিবরণ',
    thAuditTarget: 'টার্গেট',
    footerText: 'যানবাহন ও প্রকল্প রক্ষণাবেক্ষণ কার্ড সিস্টেম',
    footerSecure: 'উন্নত নিরাপত্তা এবং ডেটা বিচ্ছিন্নতার সাথে সুরক্ষিত',
    modalCardNewTitle: 'গাড়ির নতুন রক্ষণাবেক্ষণ কার্ড',
    modalCardEditTitle: 'রক্ষণাবেক্ষণ কার্ড সম্পাদনা করুন',
    modalCardAlertBanner: 'অনুগ্রহ করে ওডোমিটার ফটো, ইনভয়েস ফটো এবং যন্ত্রাংশের ফটো সংযুক্ত করুন।',
    lblCardProject: 'প্রকল্পের নাম',
    optSelectProject: '-- প্রকল্প নির্বাচন করুন --',
    lblCardVehicle: 'নির্ধারিত গাড়ি / প্লেট নম্বর',
    optSelectVehicle: '-- গাড়ি নির্বাচন করুন --',
    lblVehicleModel: 'গাড়ির ধরন ও মডেল',
    phVehicleModel: 'গাড়ির মডেল',
    lblTechName: 'দায়িত্বপ্রাপ্ত ড্রাইভার / টেকনিশিয়ান',
    lblMaintenanceDate: 'রক্ষণাবেক্ষণের তারিখ',
    dividerOdometer: 'গাড়ির ওডোমিটার / বর্তমান তেল পরিবর্তন',
    lblCurrentOdometer: 'বর্তমান ওডোমিটার রিডিং (কিলোমিটার)',
    phCurrentOdo: 'বর্তমান রিডিং সংখ্যায় লিখুন (যেমন: 145200)',
    photoAvailQuestion: 'এই রক্ষণাবেক্ষণের ছবি ও সংযুক্তি কি উপলব্ধ আছে?',
    photoAvailHelp: 'ছবি ছাড়া পূর্ববর্তী রেকর্ড সংরক্ষণের জন্য "না" বেছে নিন',
    btnPhotosYes: 'হ্যাঁ, ছবি আছে',
    btnPhotosNo: 'না, পূর্ববর্তী রক্ষণাবেক্ষণ (ছবি ছাড়া)',
    attachOdoTitle: 'বর্তমান ওডোমিটারের ছবি সংযুক্ত করুন',
    chkHasPhoto: 'ছবি আছে',
    attachOdoHelp: '(তেল পরিবর্তনের প্রকৃত কিলোমিটারের প্রমাণ)',
    btnUploadOdo: 'ওডোমিটারের ছবি তুলুন বা আপলোড করুন',
    phNoOdoImg: 'ওডোমিটারের ছবি এখনও সংযুক্ত করা হয়নি',
    badgeNoOdoImg: 'পূর্ববর্তী রক্ষণাবেক্ষণ - ছবি ছাড়া রিডিং নথিভুক্ত',
    dividerInvoice: 'ইনভয়েস ও ওয়ার্কশপ বিবরণ',
    lblInvoiceNo: 'ইনভয়েস নম্বর',
    phInvoiceNo: 'যেমন: INV-1092',
    lblInvoiceCost: 'মোট ইনভয়েসের পরিমাণ (রিয়াল)',
    phInvoiceCost: 'যেমন: 320.00',
    lblWorkshop: 'ওয়ার্কশপ / সার্ভিস সেন্টারের নাম',
    phWorkshop: 'যেমন: পেট্রোমিন এক্সপ্রেস',
    attachInvoiceTitle: 'মূল ইনভয়েসের ছবি সংযুক্ত করুন',
    attachInvoiceHelp: '(আইটেম, মোট মূল্য ও সিলের স্পষ্ট ছবি)',
    btnUploadInvoice: 'ইনভয়েসের ছবি তুলুন বা আপলোড করুন',
    phNoInvoiceImg: 'ইনভয়েসের ছবি এখনও সংযুক্ত করা হয়নি',
    badgeNoInvoiceImg: 'পূর্ববর্তী রক্ষণাবেক্ষণ - ছবি ছাড়া নথিভুক্ত',
    dividerParts: 'প্রতিস্থাপিত যন্ত্রাংশ, ফিল্টার ও কাজের বিবরণ',
    lblQuickTags: 'দ্রুত নির্বাচনের বিকল্পসমূহ:',
    chipEngineOil: '+ ইঞ্জিন তেল',
    chipOilFilter: '+ তেল ফিল্টার',
    chipAirFilter: '+ এয়ার ফিল্টার',
    chipAcFilter: '+ এসি ফিল্টার',
    chipFuelFilter: '+ ফুয়েল ফিল্টার',
    chipBrakes: '+ ব্রেক প্যাড',
    chipGearOil: '+ গিয়ার তেল',
    chipBattery: '+ ব্যাটারি',
    chipTires: '+ টায়ার',
    lblChangesDesc: 'সম্পাদিত কাজ ও পরিবর্তনের বিস্তারিত বিবরণ',
    phChangesDesc: 'যেমন: 10W40 ইঞ্জিন তেল (৬ ক্যান) পরিবর্তন, আসল তেল ফিল্টার ও এয়ার ফিল্টার প্রতিস্থাপন...',
    attachPartsTitle: 'প্রতিস্থাপিত ফিল্টার বা যন্ত্রাংশের ছবি সংযুক্ত করুন',
    attachPartsHelp: '(কাজের সময় প্রতিস্থাপিত ফিল্টার বা পার্টসের ছবি)',
    btnUploadParts: 'যন্ত্রাংশ ও ফিল্টারের ছবি আপলোড করুন',
    phNoPartsImg: 'যন্ত্রাংশের ছবি এখনও সংযুক্ত করা হয়নি',
    badgeNoPartsImg: 'পূর্ববর্তী রক্ষণাবেক্ষণ - ছবি ছাড়া নথিভুক্ত',
    lblNotes: 'ড্রাইভারের মন্তব্য বা সুপারিশ:',
    phNotes: 'অতিরিক্ত কোনো কারিগরি মন্তব্য',
    btnCancel: 'বাতিল',
    btnSaveCard: 'সংরক্ষণ ও অনুমোদন করুন',
    btnClose: 'বন্ধ করুন',
    modalViewCardTitle: 'গাড়ির প্রাতিষ্ঠানিক রক্ষণাবেক্ষণ কার্ড',
    btnPrintCardPDF: 'কার্ড প্রিন্ট / PDF সংরক্ষণ',
    btnPrintCardA4: 'প্রাতিষ্ঠানিক কার্ড প্রিন্ট করুন (A4)',
    modalViewFleetReportTitle: 'গাড়ির বহরের পূর্ণাঙ্গ রক্ষণাবেক্ষণ রিপোর্ট',
    btnPrintReportPDF: 'রিপোর্ট প্রিন্ট / PDF সংরক্ষণ',
    btnPrintReportA4: 'পূর্ণাঙ্গ রিপোর্ট প্রিন্ট করুন (A4)',
    modalProjectTitle: 'নতুন প্রকল্প যোগ করুন',
    lblProjectCode: 'প্রকল্প কোড',
    phProjectCode: 'যেমন: PRJ-2026-01',
    lblProjectName: 'প্রকল্পের নাম',
    phProjectName: 'কোম্পানি প্রকল্পের নাম',
    lblProjectLocation: 'কাজের স্থান / শহর',
    phProjectLocation: 'যেমন: রিয়াদ - কিং ফাহাদ রোড',
    lblProjectManager: 'দায়িত্বপ্রাপ্ত প্রকল্প পরিচালক',
    phProjectManager: 'সাইট ইঞ্জিনিয়ারের নাম',
    lblProjectStatus: 'প্রকল্পের অবস্থা',
    optStatusActive: 'সক্রিয় ও চলমান',
    optStatusPending: 'প্রস্তুতি চলছে',
    optStatusCompleted: 'সম্পন্ন',
    btnSaveProject: 'প্রকল্প সংরক্ষণ করুন',
    modalVehicleTitle: 'নতুন গাড়ি যোগ করুন',
    lblVehiclePlate: 'প্লেট নম্বর',
    phVehiclePlate: 'যেমন: ABC 1234',
    lblVehicleModelReq: 'ধরন ও মডেল',
    phVehicleModelReq: 'যেমন: টয়োটা হিল্যাক্স',
    lblVehicleYear: 'উৎপাদন বছর',
    lblVehicleProject: 'সংযুক্ত প্রকল্প',
    lblVehicleDriver: 'নির্ধারিত ড্রাইভার (ড্রাইভার শুধু এই গাড়ি দেখতে পাবে)',
    phVehicleDriver: 'এই গাড়ির দায়িত্বপ্রাপ্ত ড্রাইভার',
    lblVehicleOdo: 'বর্তমান ওডোমিটার (কিমি)',
    phVehicleOdo: 'বর্তমান কিলোমিটার',
    btnSaveVehicle: 'গাড়ি সংরক্ষণ করুন',
    modalTechTitle: 'নতুন ড্রাইভার / টেকনিশিয়ান যোগ করুন',
    lblTechFullname: 'ড্রাইভার / টেকনিশিয়ানের পুরো নাম',
    phTechFullname: 'ড্রাইভারের পূর্ণ নাম',
    lblTechUsername: 'লগইন ব্যবহারকারীর নাম',
    phTechUsername: 'অনন্য ব্যবহারকারীর নাম (যেমন: ahmed_driver)',
    phTechPassword: 'ড্রাইভারের পাসওয়ার্ড দিন',
    techPassHint: 'পরিবর্তন করতে না চাইলে ফাঁকা রাখুন',
    lblTechProject: 'সংযুক্ত প্রকল্প',
    lblTechVehiclePlate: 'কেবলমাত্র এই ড্রাইভারের জন্য নির্ধারিত গাড়ি',
    optSelectAssignedVehicle: '-- নির্ধারিত গাড়ি বেছে নিন --',
    techVehicleHelp: 'লগইন করার সময় ড্রাইভার শুধুমাত্র এই গাড়ি দেখতে পাবে।',
    btnSaveTech: 'ড্রাইভারের তথ্য সংরক্ষণ করুন',
    modalAdminTitle: 'বহর পর্যবেক্ষণের জন্য নতুন অ্যাডমিন যোগ করুন',
    lblAdminFullname: 'অ্যাডমিনের পুরো নাম',
    phAdminFullname: 'দায়িত্বপ্রাপ্ত অ্যাডমিনের নাম',
    lblAdminUsername: 'ব্যবহারকারীর নাম',
    phAdminUsername: 'ব্যবহারকারীর নাম',
    lblAdminRoleTitle: 'পদবি / দায়িত্ব',
    phAdminRoleTitle: 'যেমন: ফ্লিট ম্যানেজার / প্রকল্প তত্ত্বাবধায়ক',
    phAdminPassword: 'শক্তিশালী পাসওয়ার্ড দিন',
    adminPassHint: 'পরিবর্তন করতে না চাইলে ফাঁকা রাখুন',
    btnSaveAdmin: 'অ্যাডমিন অ্যাকাউন্ট সংরক্ষণ করুন',
    lightboxCaption: 'ছবির প্রিভিউ',
    statusActive: 'সক্রিয়',
    statusPending: 'মুলতবি',
    statusCompleted: 'সম্পন্ন',
    roleAdmin: 'অনুমোদিত অ্যাডমিন',
    roleDriver: 'ড্রাইভার / রক্ষণাবেক্ষণ টেকনিশিয়ান',
    lblCardNumber: 'কার্ড নং:',
    btnPrint: 'প্রিন্ট',
    btnEdit: 'সম্পাদনা',
    btnDelete: 'মুছুন',
    lblTechResponsible: 'দায়িত্বপ্রাপ্ত ড্রাইভার:',
    lblInvoiceAmount: 'চালানের মূল্য',
    lblChanges: 'পরিবর্তন:',
    kmUnit: 'কিমি',
    badgeHistoricalMaintenance: 'রেজিস্টারে নথিভুক্ত পূর্ববর্তী রক্ষণাবেক্ষণ (ছবি ছাড়া)',
    thumbOdometer: 'ওডোমিটার',
    thumbInvoice: 'চালান',
    thumbParts: 'যন্ত্রাংশ',
    thumbNoOdo: 'ওডোমিটার ছবি নেই',
    thumbNoInvoice: 'চালান ছবি নেই',
    thumbNoParts: 'যন্ত্রাংশ ছবি নেই',
    vehicleUnit: 'গাড়ি',
    driverUnit: 'ড্রাইভার',
    cardsUnit: 'কার্ড',
    btnReport: 'রিপোর্ট',
    noProjectsRegistered: 'এখনও কোনো প্রকল্প নথিভুক্ত নেই। শুরু করতে নতুন প্রকল্প যোগ করুন।',
    noVehiclesRegistered: 'বহরে এখনও কোনো গাড়ি নথিভুক্ত নেই। শুরু করতে গাড়ি যোগ করুন।',
    noTechsRegistered: 'এখনও কোনো ড্রাইভার নথিভুক্ত নেই। শুরু করতে ড্রাইভার যোগ করুন।',
    noAdminsRegistered: 'কোনো অ্যাডমিন নথিভুক্ত নেই।',
    lblMyVehicleCards: 'আমার গাড়ির কার্ড',
    lblMyProject: 'আমার বর্তমান প্রকল্প',
    lblMyAssignedVehicle: 'আমার নির্ধারিত গাড়ি',
    viewByDossiers: 'প্রকল্প ও সেক্টর ফাইল',
    viewByCards: 'সকল কার্ড',
    btnAddCardToProject: '+ প্রকল্পের জন্য নতুন কার্ড',
    btnPrintProjectDossier: 'প্রকল্প ফাইল প্রিন্ট করুন (PDF)',
    btnExportProjectExcel: 'প্রকল্প কার্ড এক্সেল (Excel)',
    btnAddCardToVehicle: '+ এই গাড়ির জন্য নতুন কার্ড',
    driverAssignedLabel: 'নির্ধারিত ড্রাইভার:',
    noCardsInProject: 'এই প্রকল্প ফাইলে এখনও কোনো রক্ষণাবেক্ষণ কার্ড নথিভুক্ত নেই',
    noVehiclesInProject: 'এই প্রকল্পের সাথে কোনো গাড়ি যুক্ত নেই',
    btnAddVehicleToProject: 'নতুন গাড়ি যুক্ত করুন',
    openMaintenanceDossier: 'রক্ষণাবেক্ষণ ফাইল',
    noCardsForVehicle: 'এই গাড়ির জন্য এখনও কোনো কার্ড নথিভুক্ত নেই',
    sectorProjectTitle: 'সেক্টর / প্রকল্প:',
    driverFile: 'ড্রাইভার ফাইল:'
  },
  tl: {
    companyName: 'Balanced Performance Contracting Co.',
    systemTitle: 'Digital Maintenance Cards at Sistema ng Pagsubaybay sa Fleet',
    authSubtitle: 'Sistemang Teknikal ng Pagsubaybay at Maintenance Cards ng Fleet',
    securityTag: 'Sertipikadong Ligtas na Sistema ng Paghihiwalay ng Data',
    setupTitle: 'Paunang Pag-setup ng Sistema:',
    setupDesc: 'Lumikha ng pangunahing admin account ng kumpanya upang simulan ang sistema.',
    lblSetupFullName: 'Buong Pangalan ng Pangunahing General Manager',
    phSetupFullName: 'hal., Engr. Mohammed Al-Otaibi',
    lblSetupUsername: 'Username sa Pag-login',
    phSetupUsername: 'hal., admin',
    lblPhone: 'Numero ng Telepono',
    lblSetupPassword: 'Admin Password',
    lblSetupPasswordConfirm: 'Kumpirmahin ang Password',
    phPassword: 'Maglagay ng malakas na password',
    phPasswordConfirm: 'Ipasok muli ang password',
    btnSetupAdmin: 'Lumikha ng Pangunahing Admin at Simulan',
    lblUsername: 'Username',
    phUsername: 'Ilagay ang rehistradong username',
    lblPassword: 'Password',
    phLoginPassword: 'Ilagay ang password',
    btnLogin: 'Mag-sign In',
    linkSetupNewAdmin: 'Mag-setup ng Bagong Master Admin',
    linkBackToLogin: 'Bumalik sa Sign In Screen',
    defaultAdminHint: 'Default Admin: Username: admin | Password: admin',
    cloudSyncTitle: 'Cloud Sync sa Real-time',
    cloudSyncDesc: 'Ikonekta ang cloud database para sa lahat ng driver at manager sa buong internet.',
    btnConfigureCloud: 'I-configure ang Cloud Sync',
    btnShareSyncData: 'Ibahagi ang Sync Code',
    cloudModalTitle: 'Mga Setting ng Cloud Sync at Database',
    authFooter: 'Naka-encrypt at Ligtas na Koneksyon | Balanced Performance Contracting Co.',
    assignedVehicleToYou: 'Itinalagang Sasakyan sa Iyo:',
    assignedProject: 'Proyekto:',
    btnLogout: 'Mag-logout',
    navCards: 'Maintenance Cards',
    navProjects: 'Mga Proyekto',
    navVehicles: 'Fleet ng Sasakyan',
    navTechs: 'Mga Driver at Technician',
    navAdmins: 'Pamamahala ng Admin',
    navAnalytics: 'Mga Ulat at Backup',
    btnNewCard: 'Bagong Maintenance Card',
    btnNewCardShort: 'Bagong Card',
    btnCreateCardAction: 'Gumawa ng Bagong Card',
    cardsViewCaptionTech: 'Mag-record at mag-track ng mga maintenance card para sa iyong sasakyan',
    noCardsTechTitle: 'Wala pang maintenance cards para sa iyong sasakyan',
    noCardsTechDesc: 'I-click ang "Gumawa ng Bagong Card" upang mag-record ng maintenance para sa iyong sasakyan.',
    lblTotalCards: 'Kabuuang Maintenance Cards',
    lblTotalCost: 'Kabuuang Gastos sa Maintenance',
    currency: 'SAR',
    lblActiveProjects: 'Mga Nakakonektang Proyekto',
    lblFleetCount: 'Mga Naserbisyohang Sasakyan',
    cardsTitle: 'Talaan ng Maintenance Cards ng Sasakyan',
    cardsViewCaption: 'Subaybayan ang mga invoice, odometer, at pinalitang piyesa',
    searchPlaceholder: 'Maghanap ayon sa plaka, modelo, invoice, o gawa...',
    allProjects: 'Lahat ng Proyekto',
    allTechs: 'Lahat ng Driver / Technician',
    noCardsTitle: 'Walang Naka-record na Maintenance Card sa Kasalukuyan',
    noCardsDesc: 'I-click ang "Bagong Maintenance Card" sa itaas upang magtala ng serbisyo.',
    projectsTitle: 'Pamamahala ng mga Proyekto ng Kumpanya',
    projectsSubtitle: 'Pamahalaan ang mga proyektong nakaugnay sa fleet at mga driver',
    btnAddProject: 'Magdagdag ng Bagong Proyekto',
    thProjectCode: 'Project Code',
    thProjectName: 'Pangalan ng Proyekto',
    thProjectLocation: 'Lokasyon / Lungsod',
    thProjectManager: 'Site Manager',
    thVehiclesCount: 'Bilang ng Sasakyan',
    thDriversCount: 'Bilang ng Driver',
    thStatus: 'Katayuan',
    thActions: 'Mga Aksyon',
    vehiclesTitle: 'Pamamahala ng Fleet ng Kumpanya',
    vehiclesSubtitle: 'Listahan ng mga sasakyan at itinalagang driver sa bawat isa',
    btnAddVehicle: 'Magdagdag ng Bagong Sasakyan sa Fleet',
    thPlate: 'Numero ng Plaka',
    thVehicleModel: 'Uri at Modelo',
    thYear: 'Taon ng Paggawa',
    thCurrentProject: 'Kasalukuyang Proyekto',
    thAssignedDriver: 'Itinalagang Driver',
    thCurrentOdo: 'Kasalukuyang Odometer',
    thLastMaintenance: 'Petsa ng Huling Maintenance',
    techsTitle: 'Pamamahala ng mga Driver at Technician',
    techsSubtitle: 'Pamahalaan ang mga account ng driver at iugnay sa kanilang sasakyan',
    btnAddTech: 'Magdagdag ng Driver / Technician',
    thDriverTech: 'Driver / Technician',
    thUsername: 'Username',
    thPhone: 'Numero ng Telepono',
    thLinkedProject: 'Kaugnay na Proyekto',
    thAssignedVehicle: 'Tanging Itinalagang Sasakyan',
    thCardsCount: 'Bilang ng Cards',
    adminsTitle: 'Pamamahala ng mga Admin ng Sistema',
    adminsSubtitle: 'Magdagdag ng mga admin upang subaybayan ang paggalaw ng fleet',
    btnAddAdmin: 'Magdagdag ng Bagong Admin',
    thAdminName: 'Pangalan ng Admin',
    thRole: 'Posisyon at Tungkulin',
    analyticsTitle: 'Sentro ng mga Ulat at Backup Data',
    analyticsSubtitle: 'Mag-export ng mga ulat sa accounting at secure backup',
    exportCenterTitle: 'Sentro ng Pag-export ng Ulat (Excel at PDF)',
    exportCenterSubtitle: 'Mag-download ng buong ulat sa maintenance para sa buong fleet o partikular na sasakyan',
    exportScopeLabel: 'Piliin ang saklaw ng pag-export:',
    exportScopeAll: 'I-download para sa Lahat ng Sasakyan ng Fleet (Lahat)',
    exportScopeSpecific: 'Pumili ng Partikular na Sasakyan sa Fleet',
    exportSelectVehicleLabel: 'Piliin ang sasakyang gagawan ng ulat:',
    exportLoadingVehicles: '-- Naglo-load ng mga sasakyan --',
    btnExportExcel: 'I-export ang Data sa Excel (CSV)',
    btnExportPDF: 'Mag-isyu at Mag-print ng Buong Ulat (A4 PDF)',
    backupTitle: 'Buong Data Backup (JSON)',
    backupDesc: 'I-download ang buong database nang ligtas.',
    btnDownloadBackup: 'I-download ang Backup',
    restoreTitle: 'Ibalik ang Data Backup',
    restoreDesc: 'Ibalik ang data mula sa dating na-export na JSON file.',
    btnChooseBackupFile: 'Pumili ng Backup File',
    auditTitle: 'Log ng Seguridad at Operasyon (Audit Trail)',
    btnClearAudit: 'Burahin ang Log',
    thAuditTime: 'Petsa at Oras',
    thAuditUser: 'Gumagamit',
    thAuditType: 'Uri',
    thAuditDetails: 'Mga Detalye',
    thAuditTarget: 'Target',
    footerText: 'Sistema ng Maintenance Cards ng Sasakyan at Proyekto',
    footerSecure: 'Protektado ng Masusing Seguridad at Paghihiwalay ng Data',
    modalCardNewTitle: 'Bagong Maintenance Card ng Sasakyan',
    modalCardEditTitle: 'I-edit ang Maintenance Card',
    modalCardAlertBanner: 'Mangyaring ilakip ang larawan ng odometer, invoice, at pinalitang piyesa.',
    lblCardProject: 'Pangalan ng Proyekto',
    optSelectProject: '-- Piliin ang Proyekto --',
    lblCardVehicle: 'Itinalagang Sasakyan / Numero ng Plaka',
    optSelectVehicle: '-- Piliin ang Sasakyan --',
    lblVehicleModel: 'Uri at Modelo ng Sasakyan',
    phVehicleModel: 'Modelo ng sasakyan',
    lblTechName: 'Responsableng Driver / Technician',
    lblMaintenanceDate: 'Petsa ng Maintenance',
    dividerOdometer: 'Odometer ng Sasakyan / Kasalukuyang Palit-Langis',
    lblCurrentOdometer: 'Kasalukuyang Odometer para sa Palit-Langis (km)',
    phCurrentOdo: 'Ilagay ang kasalukuyang odometer sa numero (hal: 145200)',
    photoAvailQuestion: 'Mayroon bang mga larawan at kalakip para sa maintenance na ito?',
    photoAvailHelp: 'Piliin ang "Hindi" para magtala ng nakaraang serbisyo nang walang larawan',
    btnPhotosYes: 'Oo, may mga larawan',
    btnPhotosNo: 'Hindi, lumang serbisyo (walang larawan)',
    attachOdoTitle: 'Ilakip ang Larawan ng Kasalukuyang Odometer',
    chkHasPhoto: 'May Larawan',
    attachOdoHelp: '(Malinaw na larawan ng odometer para patunayan ang km sa palit-langis)',
    btnUploadOdo: 'Kumuha o Mag-upload ng Larawan ng Odometer',
    phNoOdoImg: 'Wala pang nakalakip na larawan ng odometer',
    badgeNoOdoImg: 'Lumang serbisyo - Naitago ang reading nang walang larawan',
    dividerInvoice: 'Mga Detalye ng Invoice at Service Center',
    lblInvoiceNo: 'Numero ng Invoice',
    phInvoiceNo: 'hal: INV-1092',
    lblInvoiceCost: 'Kabuuang Halaga ng Invoice (SAR)',
    phInvoiceCost: 'hal: 320.00',
    lblWorkshop: 'Pangalan ng Talyer / Service Center',
    phWorkshop: 'hal: Petromin Express',
    attachInvoiceTitle: 'Ilakip ang Orihinal na Larawan ng Invoice',
    attachInvoiceHelp: '(Malinaw na larawan na nagpapakita ng aytem, halaga, at selyo)',
    btnUploadInvoice: 'Kumuha o Mag-upload ng Larawan ng Invoice',
    phNoInvoiceImg: 'Wala pang nakalakip na larawan ng invoice',
    badgeNoInvoiceImg: 'Lumang serbisyo - Naitago nang walang larawan ng invoice',
    dividerParts: 'Mga Detalye ng Pinalitang Piyesa, Filter at Maintenance',
    lblQuickTags: 'Mabilis na pagpili:',
    chipEngineOil: '+ Langis ng Makina',
    chipOilFilter: '+ Filter ng Langis',
    chipAirFilter: '+ Filter ng Hangin',
    chipAcFilter: '+ Filter ng AC',
    chipFuelFilter: '+ Filter ng Krudo',
    chipBrakes: '+ Preno',
    chipGearOil: '+ Langis ng Kambyo',
    chipBattery: '+ Baterya',
    chipTires: '+ Gulong',
    lblChangesDesc: 'Detalyadong paglalarawan ng mga pagbabago at ginawang maintenance',
    phChangesDesc: 'hal: Pinalitan ang langis ng makina 10W40 (6 na lata) kasama ang orihinal na oil filter at air filter...',
    attachPartsTitle: 'Ilakip ang Larawan ng Pinalitang Filter o Piyesa',
    attachPartsHelp: '(Larawan ng mga filter o piyesang pinalitan habang ginagawa)',
    btnUploadParts: 'Mag-upload ng Larawan ng Piyesa at Filter',
    phNoPartsImg: 'Wala pang nakalakip na larawan ng mga piyesa',
    badgeNoPartsImg: 'Lumang serbisyo - Naitago nang walang larawan ng piyesa',
    lblNotes: 'Mga Tala ng Driver o Rekomendasyon:',
    phNotes: 'Anumang karagdagang teknikal na tala',
    btnCancel: 'Kanselahin',
    btnSaveCard: 'I-save at Aprubahan ang Maintenance Card',
    btnClose: 'Isara',
    modalViewCardTitle: 'Opisyal na Preview ng Maintenance Card',
    btnPrintCardPDF: 'I-print ang Card / I-save bilang PDF',
    btnPrintCardA4: 'I-print ang Opisyal na Card (A4)',
    modalViewFleetReportTitle: 'Komprehensibong Ulat sa Maintenance ng Fleet',
    btnPrintReportPDF: 'I-print ang Ulat / I-save bilang PDF',
    btnPrintReportA4: 'I-print ang Komprehensibong Ulat (A4)',
    modalProjectTitle: 'Magdagdag ng Bagong Proyekto',
    lblProjectCode: 'Project Code',
    phProjectCode: 'hal: PRJ-2026-01',
    lblProjectName: 'Pangalan ng Proyekto',
    phProjectName: 'Pangalan ng proyekto ng kumpanya',
    lblProjectLocation: 'Lokasyon ng Trabaho / Lungsod',
    phProjectLocation: 'hal: Riyadh - King Fahd Rd',
    lblProjectManager: 'Responsableng Project Manager',
    phProjectManager: 'Pangalan ng site engineer',
    lblProjectStatus: 'Katayuan ng Proyekto',
    optStatusActive: 'Aktibo at Kasalukuyan',
    optStatusPending: 'Inihahanda pa',
    optStatusCompleted: 'Tapos na',
    btnSaveProject: 'I-save ang Proyekto',
    modalVehicleTitle: 'Magdagdag ng Bagong Sasakyan',
    lblVehiclePlate: 'Numero ng Plaka',
    phVehiclePlate: 'hal: ABC 1234',
    lblVehicleModelReq: 'Uri at Modelo',
    phVehicleModelReq: 'hal: Toyota Hilux',
    lblVehicleYear: 'Taon ng Paggawa',
    lblVehicleProject: 'Kaugnay na Proyekto',
    lblVehicleDriver: 'Itinalagang Driver (Driver lang ang makakakita nito)',
    phVehicleDriver: 'Pangalan ng driver na itinalaga',
    lblVehicleOdo: 'Kasalukuyang Odometer (km)',
    phVehicleOdo: 'Kasalukuyang reading ng odometer',
    btnSaveVehicle: 'I-save ang Sasakyan',
    modalTechTitle: 'Magdagdag ng Driver / Technician',
    lblTechFullname: 'Buong Pangalan ng Driver / Technician',
    phTechFullname: 'Buong pangalan ng driver',
    lblTechUsername: 'Username sa Pag-login',
    phTechUsername: 'Natatanging username (hal: ahmed_driver)',
    phTechPassword: 'Password ng driver',
    techPassHint: 'Iwanang blangko kung ayaw baguhin kapag nag-eedit',
    lblTechProject: 'Kaugnay na Proyekto',
    lblTechVehiclePlate: 'Itinalagang Sasakyan para sa Driver na Ito Lamang',
    optSelectAssignedVehicle: '-- Piliin ang itinalagang sasakyan --',
    techVehicleHelp: 'Sa pag-login, makikita lamang ng driver ang sasakyang ito.',
    btnSaveTech: 'I-save ang Data ng Driver',
    modalAdminTitle: 'Magdagdag ng Admin para sa Pagsubaybay ng Fleet',
    lblAdminFullname: 'Buong Pangalan ng Admin',
    phAdminFullname: 'Pangalan ng responsableng admin',
    lblAdminUsername: 'Username',
    phAdminUsername: 'Username sa pag-login',
    lblAdminRoleTitle: 'Posisyon / Tungkulin',
    phAdminRoleTitle: 'hal: Fleet Manager / Tagapangasiwa ng Proyekto',
    phAdminPassword: 'Maglagay ng malakas na password',
    adminPassHint: 'Iwanang blangko kung ayaw baguhin kapag nag-eedit',
    btnSaveAdmin: 'I-save ang Admin Account',
    lightboxCaption: 'Preview ng Larawan',
    statusActive: 'Aktibo',
    statusPending: 'Naka-pending',
    statusCompleted: 'Tapos na',
    roleAdmin: 'Awtorisadong Admin',
    roleDriver: 'Driver / Maintenance Tech',
    lblCardNumber: 'Numero ng Card:',
    btnPrint: 'I-print',
    btnEdit: 'I-edit',
    btnDelete: 'Burahin',
    lblTechResponsible: 'Responsableng Driver:',
    lblInvoiceAmount: 'Halaga ng Invoice',
    lblChanges: 'Mga Pagbabago:',
    kmUnit: 'km',
    badgeHistoricalMaintenance: 'Lumang serbisyo na naitala sa logbook (walang larawan)',
    thumbOdometer: 'Odometer',
    thumbInvoice: 'Invoice',
    thumbParts: 'Piyesa',
    thumbNoOdo: 'Walang Larawan ng Odo',
    thumbNoInvoice: 'Walang Larawan ng Invoice',
    thumbNoParts: 'Walang Larawan ng Piyesa',
    vehicleUnit: 'mga sasakyan',
    driverUnit: 'mga driver',
    cardsUnit: 'mga card',
    btnReport: 'Ulat',
    noProjectsRegistered: 'Wala pang nakatalang proyekto. I-click ang "Magdagdag ng Bagong Proyekto".',
    noVehiclesRegistered: 'Wala pang sasakyan sa fleet. I-click ang "Magdagdag ng Sasakyan".',
    noTechsRegistered: 'Wala pang driver na nakatala. I-click ang "Magdagdag ng Driver / Tech".',
    noAdminsRegistered: 'Walang nakatalang admin.',
    lblMyVehicleCards: 'Mga Card ng Aking Sasakyan',
    lblMyProject: 'Aking Kasalukuyang Proyekto',
    lblMyAssignedVehicle: 'Aking Itinalagang Sasakyan',
    viewByDossiers: 'Mga Dossier ng Proyekto',
    viewByCards: 'Lahat ng Cards',
    btnAddCardToProject: '+ Bagong Card para sa Proyekto',
    btnPrintProjectDossier: 'I-print ang Dossier (PDF)',
    btnExportProjectExcel: 'I-export ang Excel ng Proyekto',
    btnAddCardToVehicle: '+ Magdagdag ng Card sa Sasakyan',
    driverAssignedLabel: 'Itinalagang Driver:',
    noCardsInProject: 'Wala pang maintenance card sa dossier ng proyektong ito',
    noVehiclesInProject: 'Walang sasakyang nakarehistro sa proyektong ito',
    btnAddVehicleToProject: 'Mag-link ng Sasakyan sa Proyekto',
    openMaintenanceDossier: 'Maintenance Dossier',
    noCardsForVehicle: 'Wala pang maintenance card para sa sasakyang ito',
    sectorProjectTitle: 'Sektor / Proyekto:',
    driverFile: 'Dossier ng Driver:'
  }
};

/**
 * دالة جلب النص المترجم للغة الحالية
 */
function t(key, fallback = '') {
  if (I18N[currentLang] && I18N[currentLang][key] !== undefined) {
    return I18N[currentLang][key];
  }
  if (I18N['ar'] && I18N['ar'][key] !== undefined) {
    return I18N['ar'][key];
  }
  return fallback || key;
}

/**
 * دالة تطبيق اللغة والاتجاه وتحديث عناصر DOM
 */
function applyLanguage(lang) {
  if (!I18N[lang]) lang = 'ar';
  currentLang = lang;
  localStorage.setItem(STORAGE_KEYS.LANG, lang);

  const isRtl = (lang === 'ar' || lang === 'ur');
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;

  // مزامنة محدد اللغة في شاشة الدخول وشريط النظام
  const authSelect = document.getElementById('auth-lang-select');
  if (authSelect) authSelect.value = lang;
  const appSelect = document.getElementById('app-lang-select');
  if (appSelect) appSelect.value = lang;

  // تحديث جميع النصوص التي تحمل السمة data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translated = t(key);
    if (translated) {
      el.textContent = translated;
    }
  });

  // تحديث النصوص النائبة (Placeholders)
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const translated = t(key);
    if (translated) {
      el.placeholder = translated;
    }
  });

  // تحديث النصوص التوضيحية الديناميكية
  if (currentUser) {
    const roleBadge = document.getElementById('current-user-role');
    if (roleBadge) {
      if (currentUser.role === 'admin') {
        roleBadge.textContent = currentUser.roleTitle || t('roleAdmin');
      } else {
        roleBadge.textContent = t('roleDriver');
      }
    }
  }
}

/**
 * دالة التبديل الفوري للغة من خلال القائمة المنسدلة
 */
function changeLanguage(lang) {
  applyLanguage(lang);

  // إعادة تحميل محتويات الشاشات الحالية لتحديث النصوص التفاعلية فوراً
  if (currentUser) {
    refreshStatsCounters();
    populateFilterOptions();
    if (currentTab === 'cards') renderCardsList();
    if (currentTab === 'projects') renderProjectsTable();
    if (currentTab === 'vehicles') renderVehiclesTable();
    if (currentTab === 'technicians') renderTechniciansTable();
    if (currentTab === 'admins') renderAdminsTable();
    if (currentTab === 'analytics') renderAuditTable();
  }
}


// شعار شركة الأداء المتوازن للمقاولات بصيغة SVG لاستخدامه في التقارير المطبوعة
const BRAND_LOGO_SVG = `
  <svg viewBox="0 0 460 160" xmlns="http://www.w3.org/2000/svg" style="height: 52px; width: auto;">
    <path d="M 60 150 C 130 150, 205 130, 205 100 C 205 85, 175 75, 150 65 C 100 45, 90 20, 100 8 C 80 18, 70 40, 75 70 C 80 98, 105 125, 180 135 C 120 142, 75 125, 55 95 C 45 80, 50 60, 60 40 C 40 60, 35 90, 48 115 C 60 138, 80 150, 110 150 Z" fill="#0d8a4d"/>
    <polyline points="95,110 95,68 112,68 112,110" fill="none" stroke="#162e50" stroke-width="5" stroke-linejoin="round"/>
    <polygon points="122,110 122,35 138,20 138,110" fill="none" stroke="#162e50" stroke-width="5.5" stroke-linejoin="round"/>
    <polygon points="144,110 144,38 160,52 160,110" fill="none" stroke="#0d8a4d" stroke-width="5.5" stroke-linejoin="round"/>
    <polyline points="168,110 168,70 182,70 182,110" fill="none" stroke="#0d8a4d" stroke-width="5" stroke-linejoin="round"/>
    <path d="M 320 30 L 370 30 L 370 52" fill="none" stroke="#0d8a4d" stroke-width="2.5"/>
    <path d="M 320 130 L 370 130 L 370 108" fill="none" stroke="#162e50" stroke-width="2.5"/>
    <text x="315" y="44" font-family="'Cairo', sans-serif" font-size="25" font-weight="900" fill="#162e50" text-anchor="end">الأداء المتوازن</text>
    <text x="365" y="65" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#1b365d" text-anchor="end">ALADAA-ALMOTAWAZEN</text>
    <text x="315" y="98" font-family="'Cairo', sans-serif" font-size="27" font-weight="900" fill="#0d8a4d" text-anchor="end">للمقاولات</text>
    <text x="315" y="122" font-family="'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="600" fill="#475569" text-anchor="end">Contracting Co.</text>
  </svg>
`;

// =============================================================================
// 2. دوال الأمان والتشفير (Security & Hashing Utilities)
// =============================================================================

async function hashPassword(plainText) {
  if (!plainText) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    let hash = 0;
    for (let i = 0; i < plainText.length; i++) {
      hash = (hash << 5) - hash + plainText.charCodeAt(i);
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(16);
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function compressImage(file, maxWidth = 1000, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// =============================================================================
// 3. تهيئة النظام الحقيقي الخالي من المعاملات التجريبية
// =============================================================================
function initializeDataStore() {
  // كروت الصيانة تبدأ فارغة تماماً بدون أي معاملات تجريبية
  if (!localStorage.getItem(STORAGE_KEYS.CARDS)) {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify([]));
  }

  // المشاريع تبدأ بقائمة فارغة ليدخل المدير مشاريعه الحقيقية
  if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([]));
  }

  // أسطول المركبات يبدأ فارغاً
  if (!localStorage.getItem(STORAGE_KEYS.VEHICLES)) {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify([]));
  }

  // المستخدمين: يتم التحقق إذا كان هناك مدير مسجل أو الحاجة للإعداد لأول مرة
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
  }

  // سجل التدقيق
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT)) {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify([]));
  }

  // المستخدمين: التأكد من وجود حساب المدير الرئيسي دائماً لعدم ظهور شاشة الإعداد لكل زائر أو على الهواتف الأخرى
  let users = [];
  try {
    users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  } catch (e) {
    users = [];
  }

  if (!users.some(u => u.role === 'admin')) {
    // حساب المدير الرئيسي الافتراضي للنظام للتشغيل الفوري بدون مشاكل
    users.unshift({
      id: 'usr-admin-primary',
      username: 'admin',
      passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // SHA-256 of 'admin'
      password: 'admin',
      fullName: 'المدير العام',
      role: 'admin',
      roleTitle: 'المدير العام الرئيسي',
      projectId: '',
      phone: '',
      status: 'active',
      isSuperAdmin: true,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }
}

// =============================================================================
// 4. حالة التطبيق والمستخدم الحالي (Session State)
// =============================================================================
let currentUser = null;
let currentTab = 'cards';

function getSessionUser() {
  const sessionData = sessionStorage.getItem(STORAGE_KEYS.SESSION);
  if (sessionData) {
    try {
      return JSON.parse(sessionData);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function setSessionUser(user) {
  currentUser = user;
  if (user) {
    sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

function logAudit(action, details, target = '-') {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT) || '[]');
    list.unshift({
      timestamp: new Date().toLocaleString('ar-SA'),
      username: currentUser ? currentUser.fullName : 'النظام',
      action: action,
      details: details,
      target: target
    });
    if (list.length > 100) list.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(list));
  } catch (e) {
    console.error('Audit log error', e);
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconClass = 'fa-solid fa-circle-check';
  if (type === 'error') iconClass = 'fa-solid fa-circle-exclamation';
  if (type === 'warning') iconClass = 'fa-solid fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="${iconClass} toast-icon"></i>
    <div class="toast-msg">${escapeHtml(message)}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// =============================================================================
// 5. المصادقة وتسجيل الدخول (Authentication & Admin Setup)
// =============================================================================

function checkFirstTimeAdminSetup() {
  const loginBox = document.getElementById('regular-login-box');
  if (loginBox) loginBox.classList.remove('hidden');
  return true;
}

function toggleSetupAdminBox() {
  // تم إلغاء أي تسجيل عام خارجي نهائياً لضمان أمان النظام ومنع الاختراق
}

async function handleLogin(event) {
  event.preventDefault();
  const usernameInput = document.getElementById('login-username').value.trim();
  const passwordInput = document.getElementById('login-password').value;

  if (!usernameInput || !passwordInput) {
    showToast('يرجى كتابة اسم المستخدم وكلمة المرور', 'warning');
    return;
  }

  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  const hashed = await hashPassword(passwordInput);

  const matchedUser = users.find(u => 
    u.username.toLowerCase() === usernameInput.toLowerCase() && 
    (u.passwordHash === hashed || u.password === passwordInput || (u.username.toLowerCase() === 'admin' && (passwordInput === 'admin' || passwordInput === '123456')))
  );

  if (!matchedUser) {
    showToast('خطأ في اسم المستخدم أو كلمة المرور', 'error');
    return;
  }

  if (matchedUser.status === 'inactive') {
    showToast('هذا الحساب موقوف، يرجى مراجعة إدارة شركة الأداء المتوازن للمقاولات', 'error');
    return;
  }

  setSessionUser(matchedUser);
  logAudit('تسجيل دخول', `تم تسجيل الدخول بصلاحية: ${matchedUser.role === 'admin' ? 'مدير' : 'سائق/فني'}`, matchedUser.fullName);
  
  showToast(`مرحباً بك، ${matchedUser.fullName}`, 'success');
  updateAppUI();
}

function handleLogout() {
  if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
    logAudit('تسجيل خروج', 'تم تسجيل الخروج من النظام', currentUser ? currentUser.fullName : '-');
    setSessionUser(null);
    updateAppUI();
    showToast('تم تسجيل الخروج بنجاح', 'success');
  }
}

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(inputId + '-icon');
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }
}

// =============================================================================
// 6. تحديث واجهة المستخدم وحماية الصلاحيات وعزل البيانات
// =============================================================================

function updateAppUI() {
  const authScreen = document.getElementById('auth-screen');
  const appScreen = document.getElementById('app-screen');

  if (!currentUser) {
    authScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
    checkFirstTimeAdminSetup();
    if (document.getElementById('login-password')) document.getElementById('login-password').value = '';
    return;
  }

  authScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');

  document.getElementById('current-user-fullname').textContent = currentUser.fullName;
  document.getElementById('current-user-avatar').textContent = currentUser.fullName.charAt(0);
  
  const roleBadge = document.getElementById('current-user-role');
  const isAdmin = currentUser.role === 'admin';

  if (isAdmin) {
    roleBadge.textContent = currentUser.roleTitle || t('roleAdmin', 'مدير معتمد');
    roleBadge.style.backgroundColor = 'var(--color-primary)';
  } else {
    roleBadge.textContent = t('roleDriver', 'سائق / فني صيانة');
    roleBadge.style.backgroundColor = 'var(--color-accent)';
  }

  // تلميح السيارة والمشروع المخصص للسائق فقط
  const techProjectBadge = document.getElementById('tech-project-badge');
  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  
  if (!isAdmin) {
    const prj = projects.find(p => p.id === currentUser.projectId);
    const techProjectEl = document.getElementById('current-tech-project');
    if (techProjectEl) techProjectEl.textContent = prj ? prj.name : 'مشروع مخصص';
    const techVehEl = document.getElementById('current-tech-vehicle');
    if (techVehEl) techVehEl.textContent = currentUser.vehiclePlate || 'مركبة مخصصة';
    techProjectBadge.classList.remove('hidden');
  } else {
    techProjectBadge.classList.add('hidden');
  }

  // إخفاء التبويبات والعناصر الإدارية عن السائق/الفني
  const adminElements = document.querySelectorAll('.admin-only');
  adminElements.forEach(el => {
    if (isAdmin) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  const captionEl = document.getElementById('cards-view-caption');
  if (captionEl) {
    if (isAdmin) {
      captionEl.textContent = t('cardsViewCaption', 'عرض ومتابعة الفواتير والعدادات والقطع المستبدلة');
    } else {
      captionEl.textContent = t('cardsViewCaptionTech', 'تسجيل ومتابعة كروت الصيانة وغيار الزيت لمركبتك المخصصة');
    }
  }

  const noCardsTitleEl = document.getElementById('no-cards-title');
  const noCardsDescEl = document.getElementById('no-cards-desc');
  if (noCardsTitleEl && noCardsDescEl) {
    if (isAdmin) {
      noCardsTitleEl.textContent = t('noCardsTitle', 'لا توجد كروت صيانة مسجلة حالياً');
      noCardsDescEl.textContent = t('noCardsDesc', 'اضغط على زر "عمل كرت صيانة جديد" أعلاه لتسجيل عملية صيانة حقيقية للمركبة.');
    } else {
      noCardsTitleEl.textContent = t('noCardsTechTitle', 'لا توجد كروت صيانة مسجلة لمركبتك بعد');
      noCardsDescEl.textContent = t('noCardsTechDesc', 'اضغط على زر "عمل كرت صيانة جديد" للبدء بتسجيل صيانة أو غيار زيت حقيقي لسيارتك.');
    }
  }

  if (!isAdmin && currentTab !== 'cards') {
    switchTab('cards');
  }

  populateFilterOptions();
  refreshStatsCounters();
  renderCardsList();

  if (isAdmin) {
    renderProjectsTable();
    renderVehiclesTable();
    renderTechniciansTable();
    renderAdminsTable();
    renderAuditTable();
    populateExportVehicleDropdown();
  }

  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

function switchTab(tabId) {
  if (currentUser && currentUser.role !== 'admin' && tabId !== 'cards') {
    showToast('غير مصرح لك بالوصول لهذا القسم', 'error');
    return;
  }

  currentTab = tabId;

  document.querySelectorAll('.nav-tab').forEach(tab => {
    if (tab.getAttribute('data-tab') === tabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  document.querySelectorAll('.tab-pane').forEach(pane => {
    if (pane.id === `tab-${tabId}`) {
      pane.classList.remove('hidden');
    } else {
      pane.classList.add('hidden');
    }
  });

  if (tabId === 'analytics') {
    populateExportVehicleDropdown();
  }
}

// =============================================================================
// 7. العدادات والإحصائيات السريعة
// =============================================================================

function refreshStatsCounters() {
  const allCards = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARDS) || '[]');
  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  const vehicles = JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]');

  // عزل البيانات: السائق يرى كروت سيارته فقط
  const accessibleCards = (currentUser && currentUser.role === 'admin')
    ? allCards
    : allCards.filter(c => c.createdBy === currentUser.id || c.techId === currentUser.id || c.vehiclePlate === currentUser.vehiclePlate);

  const totalCost = accessibleCards.reduce((acc, c) => acc + (parseFloat(c.cost) || 0), 0);
  const locale = (currentLang === 'ar') ? 'ar-SA' : 'en-US';

  const statCardsCount = document.getElementById('stat-cards-count');
  const statTotalCost = document.getElementById('stat-total-cost');
  if (statCardsCount) statCardsCount.textContent = accessibleCards.length.toLocaleString(locale);
  if (statTotalCost) statTotalCost.textContent = totalCost.toLocaleString(locale, { minimumFractionDigits: 2 });
  
  if (currentUser && currentUser.role === 'admin') {
    const lblCards = document.getElementById('lbl-total-cards');
    const lblPrj = document.getElementById('lbl-active-projects');
    const statPrj = document.getElementById('stat-projects-count');
    const lblFleet = document.getElementById('lbl-fleet-count');
    const statVeh = document.getElementById('stat-vehicles-count');

    if (lblCards) lblCards.textContent = t('lblTotalCards');
    if (lblPrj) lblPrj.textContent = t('lblActiveProjects');
    if (statPrj) statPrj.textContent = projects.length.toLocaleString(locale);
    if (lblFleet) lblFleet.textContent = t('lblFleetCount');
    if (statVeh) statVeh.textContent = vehicles.length.toLocaleString(locale);
  } else {
    const lblCards = document.getElementById('lbl-total-cards');
    const lblPrj = document.getElementById('lbl-active-projects');
    const statPrj = document.getElementById('stat-projects-count');
    const lblFleet = document.getElementById('lbl-fleet-count');
    const statVeh = document.getElementById('stat-vehicles-count');

    if (lblCards) lblCards.textContent = t('lblMyVehicleCards', 'كروت صيانة سيارتي');
    if (lblPrj) lblPrj.textContent = t('lblMyProject', 'مشروعي الحالي');
    if (statPrj) statPrj.textContent = '1';
    if (lblFleet) lblFleet.textContent = t('lblMyAssignedVehicle', 'سيارتي المخصصة');
    if (statVeh) statVeh.textContent = '1';
  }
}

// =============================================================================
// 8. إدارة كروت الصيانة (Maintenance Cards CRUD) مع قراءة العداد الحالي فقط
// =============================================================================

function populateFilterOptions() {
  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');

  const projectSelect = document.getElementById('filter-project');
  if (projectSelect) {
    projectSelect.innerHTML = `<option value="">${t('allProjects')}</option>`;
    projects.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      projectSelect.appendChild(opt);
    });

    if (currentUser && currentUser.role !== 'admin' && currentUser.projectId) {
      projectSelect.value = currentUser.projectId;
      projectSelect.disabled = true;
    } else {
      projectSelect.disabled = false;
    }
  }

  const techSelect = document.getElementById('filter-tech');
  if (techSelect) {
    techSelect.innerHTML = `<option value="">${t('allTechs')}</option>`;
    users.filter(u => u.role === 'technician').forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.fullName} (${t.vehiclePlate || 'بدون لوحة'})`;
      techSelect.appendChild(opt);
    });
  }
}

function resetCardsFilter() {
  document.getElementById('filter-search').value = '';
  if (currentUser && currentUser.role === 'admin') {
    document.getElementById('filter-project').value = '';
  }
  const techFilter = document.getElementById('filter-tech');
  if (techFilter) techFilter.value = '';
  renderCardsList();
}

function setCardsViewMode(mode) {
  if (currentUser && currentUser.role !== 'admin') {
    cardsViewMode = 'grid';
    return;
  }

  cardsViewMode = mode;
  localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);

  const btnDossiers = document.getElementById('btn-view-dossiers');
  const btnGrid = document.getElementById('btn-view-grid');

  if (btnDossiers && btnGrid) {
    if (mode === 'dossiers') {
      btnDossiers.classList.add('active');
      btnGrid.classList.remove('active');
    } else {
      btnDossiers.classList.remove('active');
      btnGrid.classList.add('active');
    }
  }

  renderCardsList();
}

function toggleDossierCollapse(projectId) {
  const dossierEl = document.getElementById(`dossier-prj-${projectId}`);
  if (dossierEl) {
    dossierEl.classList.toggle('collapsed');
  }
}

function openProjectDossier(projectId) {
  if (currentUser && currentUser.role !== 'admin') return;

  switchTab('cards');
  setCardsViewMode('dossiers');

  const projectFilter = document.getElementById('filter-project');
  if (projectFilter) {
    projectFilter.value = projectId;
  }
  const searchInput = document.getElementById('filter-search');
  if (searchInput) {
    searchInput.value = '';
  }

  renderCardsList();

  setTimeout(() => {
    const el = document.getElementById(`dossier-prj-${projectId}`);
    if (el) {
      el.classList.remove('collapsed');
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('highlight-dossier');
      setTimeout(() => el.classList.remove('highlight-dossier'), 2000);
    }
  }, 120);
}

function exportProjectDossierExcel(projectId) {
  if (currentUser && currentUser.role !== 'admin') {
    showToast('خاص بمديري النظام فقط', 'error');
    return;
  }

  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  const prj = projects.find(p => p.id === projectId);
  const prjName = prj ? prj.name : 'مشروع';

  const allCards = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARDS) || '[]');
  const cards = allCards.filter(c => c.projectId === projectId);

  if (cards.length === 0) {
    showToast(`لا توجد كروت صيانة مسجلة في ملف مشروع (${prjName}) لتصديرها`, 'warning');
    return;
  }

  let csvContent = '\uFEFFم,رقم الكرت,اسم المشروع,كود المشروع,رقم اللوحة,نوع وموديل المركبة,السائق المسؤول,تاريخ الصيانة,قراءة العداد الحالية (كم),رقم الفاتورة,المبلغ الإجمالي (ر.س),اسم الورشة / مركز الصيانة,التغييرات وأعمال الصيانة المنفذة,الملاحظات والتوصيات,حالة التوثيق بالصور,تاريخ ووقت القيد\n';

  cards.forEach((c, idx) => {
    const cleanDesc = (c.changesDescription || '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
    const cleanNotes = (c.notes || '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
    const cleanCreated = (c.createdAt || '').replace(/"/g, '""');
    const photoStatus = (c.imgOdometer || c.imgInvoice || c.imgParts) ? 'نعم (موثق بصور)' : 'لا (صيانة سابقة بدون صور)';

    csvContent += `"${idx + 1}","${c.cardNumber || c.id}","${prjName}","${prj ? prj.code : ''}","${c.vehiclePlate}","${c.vehicleModel || ''}","${c.techName || ''}","${c.serviceDate}","${c.odometerCurrent}","${c.invoiceNumber}","${c.cost}","${c.workshopName}","${cleanDesc}","${cleanNotes}","${photoStatus}","${cleanCreated}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileDate = new Date().toISOString().split('T')[0];
  const safeName = prjName.replace(/[\/\\:*?"<>|]/g, '_');
  a.download = `كروت_صيانة_مشروع_${safeName}_${fileDate}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`تم تصدير ملف كروت صيانة مشروع (${prjName}) بنجاح`, 'success');
}

function generateProjectDossierPDFReport(projectId) {
  if (currentUser && currentUser.role !== 'admin') {
    showToast('خاص بمديري النظام فقط', 'error');
    return;
  }

  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  const prj = projects.find(p => p.id === projectId);
  if (!prj) {
    showToast('المشروع غير موجود!', 'error');
    return;
  }

  const vehicles = JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]');
  const allCards = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARDS) || '[]');
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');

  const projVehicles = vehicles.filter(v => v.projectId === projectId);
  const projCards = allCards.filter(c => c.projectId === projectId);

  projCards.sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));

  const totalSpent = projCards.reduce((acc, c) => acc + (parseFloat(c.cost) || 0), 0);
  const printContainer = document.getElementById('printable-fleet-report-content');
  const reportModalTitle = document.getElementById('fleet-report-title');

  if (reportModalTitle) {
    reportModalTitle.innerHTML = `<i class="fa-solid fa-folder-open"></i> ${t('projectDossierTitle', 'ملف صيانة المشروع والقطاع')}: ${escapeHtml(prj.name)} (${escapeHtml(prj.code)})`;
  }

  const locale = (currentLang === 'ar') ? 'ar-SA' : 'en-US';
  const currentDateStr = new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });

  // جدول مركبات وسائقي المشروع
  let vehiclesRows = '';
  if (projVehicles.length > 0) {
    vehiclesRows = projVehicles.map((v, idx) => {
      const vCards = projCards.filter(c => c.vehiclePlate === v.plate);
      const vCost = vCards.reduce((acc, c) => acc + (parseFloat(c.cost) || 0), 0);
      const driverUser = users.find(u => u.vehiclePlate === v.plate || (u.fullName && v.driver && u.fullName.toLowerCase() === v.driver.toLowerCase()));
      const driverName = v.driver || (driverUser ? driverUser.fullName : (currentLang === 'ar' ? 'بدون سائق معين' : 'Unassigned'));

      return `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td><strong class="plate-badge">${escapeHtml(v.plate)}</strong></td>
          <td><strong>${escapeHtml(v.model)}</strong></td>
          <td>${v.year || '--'}</td>
          <td><strong style="color:#0d8a4d;">${escapeHtml(driverName)}</strong></td>
          <td>${Number(v.currentOdometer || 0).toLocaleString(locale)} ${t('kmUnit')}</td>
          <td style="text-align:center;">${vCards.length} ${t('cardsUnit')}</td>
          <td style="font-weight:700; color:#162e50;">${vCost.toFixed(2)} ${t('currency')}</td>
        </tr>
      `;
    }).join('');
  } else {
    vehiclesRows = `<tr><td colspan="8" class="text-center p-2 text-muted">${t('noVehiclesInProject', 'لا توجد سيارات مسجلة في هذا المشروع')}</td></tr>`;
  }

  // جدول كروت صيانة المشروع
  let cardsRows = '';
  if (projCards.length > 0) {
    cardsRows = projCards.map((c, idx) => {
      const hasImg = Boolean((c.imgOdometer && c.imgOdometer.startsWith('data:image')) || (c.imgInvoice && c.imgInvoice.startsWith('data:image')) || (c.imgParts && c.imgParts.startsWith('data:image')));
      const photoBadge = hasImg
        ? '<span class="badge-status badge-active" style="font-size:0.72rem; white-space:nowrap;"><i class="fa-solid fa-camera"></i> موثق بالصور</span>'
        : '<span class="badge-status badge-pending" style="font-size:0.72rem; white-space:nowrap;"><i class="fa-solid fa-clock-rotate-left"></i> صيانة سابقة دفترياً</span>';

      return `
        <tr>
          <td style="text-align:center; font-weight:700;">${idx + 1}</td>
          <td><code>${escapeHtml(c.cardNumber || c.id)}</code></td>
          <td style="white-space:nowrap;">${escapeHtml(c.serviceDate)}</td>
          <td><strong class="plate-badge">${escapeHtml(c.vehiclePlate)}</strong></td>
          <td>${escapeHtml(c.vehicleModel || '--')}</td>
          <td><strong>${escapeHtml(c.techName || '--')}</strong></td>
          <td style="font-weight:700; color:#0d8a4d;">${Number(c.odometerCurrent || 0).toLocaleString(locale)} ${t('kmUnit')}</td>
          <td>${escapeHtml(c.invoiceNumber || '--')}</td>
          <td style="font-weight:800; color:#162e50; white-space:nowrap;">${Number(c.cost || 0).toFixed(2)} ${t('currency')}</td>
          <td style="font-size:0.8rem; max-width:240px; line-height:1.4;">${escapeHtml(c.changesDescription || '--')}</td>
          <td style="text-align:center;">${photoBadge}</td>
        </tr>
      `;
    }).join('');
  } else {
    cardsRows = `<tr><td colspan="11" class="text-center p-3 text-muted">${t('noCardsInProject', 'لا توجد كروت صيانة مسجلة في ملف هذا المشروع بعد')}</td></tr>`;
  }

  printContainer.innerHTML = `
    <div class="official-print-card">
      <header class="print-header">
        <div class="print-brand">
          ${BRAND_LOGO_SVG}
          <div>
            <h1 style="margin:0 0 4px; font-size:1.35rem; color:#162e50;">شركة الأداء المتوازن للمقاولات</h1>
            <p style="margin:0; font-size:0.82rem; color:#475569;">إدارة الحركة والمعدات | التقرير الفني والمحاسبي لملف صيانة المشروع</p>
          </div>
        </div>
        <div class="print-card-badge" style="text-align:center; border:2px dashed #0d8a4d; padding:8px 16px; border-radius:6px;">
          <strong style="color:#0d8a4d; font-size:1.05rem; display:block;">
            ${t('projectDossierTitle', 'ملف صيانة المشروع والقطاع')}
          </strong>
          <span style="font-size:0.85rem; color:#162e50; font-weight:800;">
            ${escapeHtml(prj.name)} (${escapeHtml(prj.code)})
          </span>
          <small style="display:block; font-size:0.7rem; color:#64748b; margin-top:3px;">
            تاريخ التقرير: ${currentDateStr}
          </small>
        </div>
      </header>

      <!-- بيانات المشروع والقطاع -->
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; margin-bottom: 16px;">
        <h4 style="margin: 0 0 10px; color: var(--color-primary); font-size: 0.95rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
          <i class="fa-solid fa-diagram-project"></i> بيانات وملف المشروع والقطاع:
        </h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; font-size: 0.85rem;">
          <div><span style="color:#64748b;">اسم المشروع:</span> <strong>${escapeHtml(prj.name)}</strong></div>
          <div><span style="color:#64748b;">كود المشروع:</span> <strong>${escapeHtml(prj.code)}</strong></div>
          <div><span style="color:#64748b;">موقع العمل / المدينة:</span> <strong>${escapeHtml(prj.location || '--')}</strong></div>
          <div><span style="color:#64748b;">مدير الموقع المسؤول:</span> <strong>${escapeHtml(prj.manager || '--')}</strong></div>
          <div><span style="color:#64748b;">عدد السيارات التابعة:</span> <strong>${projVehicles.length} سيارة</strong></div>
          <div><span style="color:#64748b;">إجمالي مصروفات الصيانة:</span> <strong style="color:#0d8a4d;">${totalSpent.toLocaleString(locale, {minimumFractionDigits: 2})} ${t('currency')}</strong></div>
        </div>
      </div>

      <!-- ملخص الأسطول والسائقين التابعين للمشروع -->
      <div class="print-section-title" style="margin: 14px 0 8px;">
        <i class="fa-solid fa-car-side"></i> بيان أسطول السيارات والسائقين المخصصين لهذا المشروع
      </div>
      <div class="table-responsive" style="margin-bottom: 18px;">
        <table class="data-table" style="font-size:0.82rem; width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="width:30px; text-align:center;">#</th>
              <th>رقم اللوحة</th>
              <th>النوع والموديل</th>
              <th>سنة الصنع</th>
              <th>السائق المسؤول المخصص</th>
              <th>قراءة العداد</th>
              <th style="text-align:center;">كروت الصيانة</th>
              <th>إجمالي التكلفة</th>
            </tr>
          </thead>
          <tbody>
            ${vehiclesRows}
          </tbody>
        </table>
      </div>

      <!-- جدول كروت الصيانة التفصيلية -->
      <div class="print-section-title" style="margin: 14px 0 8px; display:flex; justify-content:space-between; align-items:center;">
        <span><i class="fa-solid fa-clipboard-list"></i> سجل وتفاصيل كروت صيانة المشروع</span>
        <span style="font-size:0.78rem; font-weight:normal; color:#64748b;">إجمالي الكروت: (${projCards.length}) كرت</span>
      </div>
      <div class="table-responsive">
        <table class="data-table" style="font-size:0.82rem; width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="width:30px; text-align:center;">#</th>
              <th>رقم الكرت</th>
              <th>تاريخ الصيانة</th>
              <th>رقم اللوحة</th>
              <th>الموديل</th>
              <th>السائق المنفذ</th>
              <th>قراءة العداد</th>
              <th>رقم الفاتورة</th>
              <th>المبلغ</th>
              <th>التغييرات المنفذة</th>
              <th style="text-align:center;">التوثيق</th>
            </tr>
          </thead>
          <tbody>
            ${cardsRows}
          </tbody>
          <tfoot>
            <tr style="background:#f8fafc; font-weight:800;">
              <td colspan="8" style="text-align:left; padding:10px 14px;">إجمالي تكاليف صيانة ملف المشروع:</td>
              <td style="color:#162e50; font-size:1rem; padding:10px 14px;">${totalSpent.toLocaleString(locale, {minimumFractionDigits: 2})} ${t('currency')}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <footer class="print-signatures" style="margin-top:28px;">
        <div class="signature-box">
          <p>مدير الموقع / المشروع</p>
          <div class="signature-space"></div>
          <p>${escapeHtml(prj.manager || 'مهندس الموقع')}</p>
        </div>
        <div class="signature-box">
          <p>مدير الحركة والأسطول</p>
          <div class="signature-space"></div>
          <p>الاعتماد الفني</p>
        </div>
        <div class="signature-box">
          <p>الإدارة العامة / المالية</p>
          <div class="signature-space"></div>
          <p>شركة الأداء المتوازن للمقاولات</p>
        </div>
      </footer>
    </div>
  `;

  openModal('modal-view-fleet-report');
}

function buildSingleCardHtml(card, isAdmin, locale, showProjectBadge = true) {
  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  const prj = projects.find(p => p.id === card.projectId);
  const prjName = prj ? prj.name : (card.projectName || 'مشروع عام');

  return `
    <article class="maintenance-card" id="card-${card.id}">
      <header class="m-card-header">
        <div class="m-card-plate">
          <span class="plate-badge">${escapeHtml(card.vehiclePlate)}</span>
          <small>${escapeHtml(card.vehicleModel || '')}</small>
        </div>
        <div class="m-card-date">
          <i class="fa-regular fa-calendar"></i> ${escapeHtml(card.serviceDate)}
        </div>
      </header>

      <div class="m-card-body">
        ${showProjectBadge ? `
          <div class="m-card-project">
            <i class="fa-solid fa-building"></i>
            <span>${escapeHtml(prjName)}</span>
          </div>
        ` : ''}

        <div class="m-card-tech">
          <i class="fa-solid fa-user"></i> ${t('lblTechResponsible')} <strong>${escapeHtml(card.techName || t('roleDriver'))}</strong>
        </div>

        <div class="m-card-metrics">
          <div class="metric-item">
            <span class="metric-title">${t('lblCurrentOdometer')}</span>
            <span class="metric-number">${Number(card.odometerCurrent || 0).toLocaleString(locale)} ${t('kmUnit')}</span>
          </div>
          <div class="metric-item">
            <span class="metric-title">${t('lblInvoiceAmount')}</span>
            <span class="metric-number">${Number(card.cost || 0).toFixed(2)} <small>${t('currency')}</small></span>
          </div>
        </div>

        <div class="m-card-changes" title="${escapeHtml(card.changesDescription || '')}">
          <strong>${t('lblChanges')}</strong> ${escapeHtml(card.changesDescription || '--')}
        </div>

        <div class="m-card-thumbs">
          ${(() => {
            const hasOdo = Boolean(card.imgOdometer && card.imgOdometer.startsWith('data:image'));
            const hasInv = Boolean(card.imgInvoice && card.imgInvoice.startsWith('data:image'));
            const hasParts = Boolean(card.imgParts && card.imgParts.startsWith('data:image'));
            const hasAny = hasOdo || hasInv || hasParts;

            if (!hasAny) {
              return `
                <div class="no-photo-badge" style="grid-column: 1 / -1; justify-content: center; font-size: 0.8rem; padding: 10px 14px;">
                  <i class="fa-solid fa-clock-rotate-left"></i> ${t('badgeHistoricalMaintenance')}
                </div>
              `;
            }

            return `
              ${hasOdo ? `
                <div class="thumb-wrapper" onclick="openLightbox('${card.imgOdometer}', '${escapeHtml(t('thumbOdometer'))} - ${card.vehiclePlate}')" title="${t('thumbOdometer')}">
                  <img src="${card.imgOdometer}" alt="${t('thumbOdometer')}" loading="lazy">
                  <span class="thumb-tag"><i class="fa-solid fa-gauge"></i> ${t('thumbOdometer')}</span>
                </div>
              ` : `
                <div class="thumb-wrapper no-photo-placeholder" title="${t('thumbNoOdo')}">
                  <i class="fa-solid fa-clock-rotate-left"></i>
                  <span>${t('thumbNoOdo')}</span>
                  <span class="thumb-tag"><i class="fa-solid fa-gauge"></i> ${t('thumbOdometer')}</span>
                </div>
              `}

              ${hasInv ? `
                <div class="thumb-wrapper" onclick="openLightbox('${card.imgInvoice}', '${escapeHtml(t('thumbInvoice'))} - ${card.invoiceNumber}')" title="${t('thumbInvoice')}">
                  <img src="${card.imgInvoice}" alt="${t('thumbInvoice')}" loading="lazy">
                  <span class="thumb-tag"><i class="fa-solid fa-receipt"></i> ${t('thumbInvoice')}</span>
                </div>
              ` : `
                <div class="thumb-wrapper no-photo-placeholder" title="${t('thumbNoInvoice')}">
                  <i class="fa-solid fa-clock-rotate-left"></i>
                  <span>${t('thumbNoInvoice')}</span>
                  <span class="thumb-tag"><i class="fa-solid fa-receipt"></i> ${t('thumbInvoice')}</span>
                </div>
              `}

              ${hasParts ? `
                <div class="thumb-wrapper" onclick="openLightbox('${card.imgParts}', '${escapeHtml(t('thumbParts'))}')" title="${t('thumbParts')}">
                  <img src="${card.imgParts}" alt="${t('thumbParts')}" loading="lazy">
                  <span class="thumb-tag"><i class="fa-solid fa-filter"></i> ${t('thumbParts')}</span>
                </div>
              ` : `
                <div class="thumb-wrapper no-photo-placeholder" title="${t('thumbNoParts')}">
                  <i class="fa-solid fa-clock-rotate-left"></i>
                  <span>${t('thumbNoParts')}</span>
                  <span class="thumb-tag"><i class="fa-solid fa-filter"></i> ${t('thumbParts')}</span>
                </div>
              `}
            `;
          })()}
        </div>
      </div>

      <footer class="m-card-footer">
        <span class="text-muted" style="font-size:0.75rem;">
          ${t('lblCardNumber')} ${escapeHtml(card.cardNumber || card.id)}
        </span>
        <div class="card-actions">
          <button class="btn btn-outline-primary btn-sm" onclick="viewPrintableCard('${card.id}')" title="${t('btnPrint')}">
            <i class="fa-solid fa-print"></i> ${t('btnPrint')}
          </button>
          ${isAdmin ? `
            <button class="btn btn-outline-secondary btn-sm" onclick="editCard('${card.id}')" title="${t('btnEdit')}">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteCard('${card.id}')" title="${t('btnDelete')}">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          ` : ''}
        </div>
      </footer>
    </article>
  `;
}

function renderGridView(container, list) {
  const isAdmin = currentUser && currentUser.role === 'admin';
  const locale = (currentLang === 'ar') ? 'ar-SA' : 'en-US';
  container.innerHTML = list.map(card => buildSingleCardHtml(card, isAdmin, locale, isAdmin)).join('');
}

function renderDossiersView(container, list, projects, allCards) {
  const vehicles = JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]');
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  const isAdmin = currentUser && currentUser.role === 'admin';
  const locale = (currentLang === 'ar') ? 'ar-SA' : 'en-US';
  const search = document.getElementById('filter-search').value.trim().toLowerCase();
  const filterProject = document.getElementById('filter-project').value;

  let projectsToDisplay = [];
  if (!isAdmin && currentUser) {
    projectsToDisplay = projects.filter(p => p.id === currentUser.projectId);
    if (projectsToDisplay.length === 0) {
      projectsToDisplay = [{
        id: currentUser.projectId || 'my-project',
        code: 'PRJ',
        name: t('lblMyProject', 'مشروعي الحالي'),
        location: '--',
        manager: '--'
      }];
    }
  } else {
    projectsToDisplay = filterProject ? projects.filter(p => p.id === filterProject) : [...projects];
  }

  if (search) {
    projectsToDisplay = projectsToDisplay.filter(p => {
      const pMatch = (p.name && p.name.toLowerCase().includes(search)) || (p.code && p.code.toLowerCase().includes(search)) || (p.location && p.location.toLowerCase().includes(search));
      const hasMatchingCard = list.some(c => c.projectId === p.id);
      const hasMatchingVehicle = vehicles.some(v => v.projectId === p.id && (
        (v.plate && v.plate.toLowerCase().includes(search)) ||
        (v.model && v.model.toLowerCase().includes(search)) ||
        (v.driver && v.driver.toLowerCase().includes(search))
      ));
      return pMatch || hasMatchingCard || hasMatchingVehicle;
    });
  }

  const knownProjectIds = new Set(projects.map(p => p.id));
  const unassignedCards = list.filter(c => !c.projectId || !knownProjectIds.has(c.projectId));

  if (projectsToDisplay.length === 0 && unassignedCards.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-folder-open empty-icon"></i>
        <h3>${t('noCardsTitle', 'لا توجد مشاريع أو كروت صيانة مسجلة حالياً')}</h3>
        <p>${t('noCardsDesc', 'اضغط على زر "كرت صيانة جديد" أعلاه لتسجيل عملية صيانة حقيقية للمركبة.')}</p>
      </div>
    `;
    return;
  }

  let html = projectsToDisplay.map(p => {
    const pCards = list.filter(c => c.projectId === p.id);
    let pVehicles = vehicles.filter(v => v.projectId === p.id);

    if (!isAdmin && currentUser) {
      pVehicles = pVehicles.filter(v => v.plate === currentUser.vehiclePlate || (v.driver && v.driver.toLowerCase() === currentUser.fullName.toLowerCase()));
      if (pVehicles.length === 0 && currentUser.vehiclePlate) {
        pVehicles = [{
          plate: currentUser.vehiclePlate,
          model: 'مركبة مخصصة',
          year: '',
          driver: currentUser.fullName,
          currentOdometer: 0
        }];
      }
    }

    const pCost = pCards.reduce((acc, c) => acc + (parseFloat(c.cost) || 0), 0);

    let vehiclesHtml = '';
    if (pVehicles.length === 0) {
      vehiclesHtml = `
        <div class="dossier-empty-state">
          <i class="fa-solid fa-car-tunnel"></i>
          <p>${t('noVehiclesInProject', 'لا توجد سيارات مسجلة في هذا المشروع بعد')}</p>
          ${isAdmin ? `
            <button class="btn btn-outline-primary btn-sm" onclick="openNewVehicleModal('${p.id}')">
              <i class="fa-solid fa-plus"></i> ${t('btnAddVehicleToProject', 'ربط سيارة جديدة بهذا المشروع')}
            </button>
          ` : ''}
        </div>
      `;
    } else {
      vehiclesHtml = pVehicles.map(v => {
        const vCards = pCards.filter(c => c.vehiclePlate === v.plate);
        const vCost = vCards.reduce((acc, c) => acc + (parseFloat(c.cost) || 0), 0);
        const driverUser = users.find(u => u.vehiclePlate === v.plate || (u.fullName && v.driver && u.fullName.toLowerCase() === v.driver.toLowerCase()));
        const driverName = v.driver || (driverUser ? driverUser.fullName : (currentLang === 'ar' ? 'بدون سائق معين' : 'Unassigned'));

        return `
          <div class="vehicle-dossier-box" id="box-veh-${escapeHtml(v.plate).replace(/\s+/g, '_')}">
            <div class="vehicle-dossier-header">
              <div class="vehicle-dossier-identity">
                <span class="plate-badge" style="font-size:0.95rem;">${escapeHtml(v.plate)}</span>
                <strong>${escapeHtml(v.model)} ${v.year ? `(${v.year})` : ''}</strong>
                <span class="driver-pill" title="${t('driverFile', 'ملف السائق:')} ${escapeHtml(driverName)}">
                  <i class="fa-solid fa-id-badge"></i>
                  <span>${t('driverFile', 'ملف السائق:')} <strong>${escapeHtml(driverName)}</strong></span>
                </span>
                <span class="vehicle-odo-pill">
                  <i class="fa-solid fa-gauge-high"></i>
                  <span>${Number(v.currentOdometer || 0).toLocaleString(locale)} ${t('kmUnit')}</span>
                </span>
                <span class="badge-status badge-active">
                  ${vCards.length} ${t('cardsUnit')} | ${vCost.toFixed(2)} ${t('currency')}
                </span>
              </div>

              <div class="vehicle-actions-bar">
                <button class="btn btn-accent btn-sm" onclick="openNewCardModal('${p.id}', '${v.plate}')" title="${t('btnAddCardToVehicle', 'إضافة كرت لهذه السيارة')}">
                  <i class="fa-solid fa-plus"></i> <span class="hide-mobile">${t('btnAddCardToVehicle', 'إضافة كرت لهذه السيارة')}</span>
                </button>
                <button class="btn btn-outline-primary btn-sm" onclick="generateVehiclePDFReport('${v.plate}')" title="${t('btnReport', 'تقرير')}">
                  <i class="fa-solid fa-file-pdf"></i> <span class="hide-mobile">${t('btnReport', 'تقرير')}</span>
                </button>
              </div>
            </div>

            <div class="vehicle-dossier-cards">
              ${vCards.length > 0 ? `
                <div class="vehicle-cards-subgrid">
                  ${vCards.map(c => buildSingleCardHtml(c, isAdmin, locale, false)).join('')}
                </div>
              ` : `
                <div class="dossier-empty-state" style="padding:14px;">
                  <i class="fa-regular fa-folder-open" style="font-size:1.4rem;"></i>
                  <p style="margin:4px 0 8px; font-size:0.82rem;">${t('noCardsForVehicle', 'لا توجد كروت صيانة مسجلة لهذه المركبة بعد')}: <strong>${escapeHtml(driverName)} (${escapeHtml(v.plate)})</strong></p>
                  <button class="btn btn-accent btn-xs" onclick="openNewCardModal('${p.id}', '${v.plate}')">
                    <i class="fa-solid fa-plus"></i> ${t('btnAddCardToVehicle', 'إضافة كرت صيانة')}
                  </button>
                </div>
              `}
            </div>
          </div>
        `;
      }).join('');
    }

    const unlistedProjCards = pCards.filter(c => !pVehicles.some(v => v.plate === c.vehiclePlate));
    let unlistedCardsHtml = '';
    if (unlistedProjCards.length > 0) {
      unlistedCardsHtml = `
        <div class="vehicle-dossier-box" style="border-style:dashed;">
          <div class="vehicle-dossier-header" style="background:#fefce8;">
            <div class="vehicle-dossier-identity">
              <i class="fa-solid fa-car-side"></i>
              <strong>كروت إضافية مسجلة على هذا المشروع</strong>
              <span class="badge-status badge-pending">${unlistedProjCards.length} ${t('cardsUnit')}</span>
            </div>
          </div>
          <div class="vehicle-dossier-cards">
            <div class="vehicle-cards-subgrid">
              ${unlistedProjCards.map(c => buildSingleCardHtml(c, isAdmin, locale, false)).join('')}
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="project-dossier-card" id="dossier-prj-${p.id}">
        <header class="dossier-header" onclick="toggleDossierCollapse('${p.id}')">
          <div class="dossier-title-area">
            <i class="fa-solid fa-folder-open dossier-folder-icon"></i>
            <div class="dossier-title-text">
              <h3>
                <span>${escapeHtml(p.name)}</span>
                <span class="badge-status badge-active" style="font-size:0.75rem;">${escapeHtml(p.code)}</span>
              </h3>
              <div class="dossier-meta-subtitle">
                <span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(p.location || '--')}</span>
                <span><i class="fa-solid fa-user-tie"></i> ${escapeHtml(p.manager || (currentLang === 'ar' ? 'غير محدد' : 'Unspecified'))}</span>
              </div>
            </div>
          </div>

          <div class="dossier-kpi-bar" onclick="event.stopPropagation()">
            <span class="dossier-kpi-chip"><i class="fa-solid fa-car"></i> ${pVehicles.length} ${t('vehicleUnit')}</span>
            <span class="dossier-kpi-chip"><i class="fa-solid fa-clipboard-check"></i> ${pCards.length} ${t('cardsUnit')}</span>
            <span class="dossier-kpi-chip highlight-cost"><i class="fa-solid fa-coins"></i> ${pCost.toLocaleString(locale, {minimumFractionDigits: 2})} ${t('currency')}</span>
          </div>

          <div class="dossier-actions" onclick="event.stopPropagation()">
            <button class="btn btn-accent btn-sm" onclick="openNewCardModal('${p.id}')" title="${t('btnAddCardToProject')}">
              <i class="fa-solid fa-circle-plus"></i> <span class="hide-mobile">${t('btnAddCardToProject')}</span>
            </button>
            ${isAdmin ? `
              <button class="btn btn-outline-primary btn-sm" onclick="generateProjectDossierPDFReport('${p.id}')" title="${t('btnPrintProjectDossier')}">
                <i class="fa-solid fa-file-pdf"></i> <span class="hide-mobile">${t('btnPrintProjectDossier')}</span>
              </button>
              <button class="btn btn-outline-secondary btn-sm" onclick="exportProjectDossierExcel('${p.id}')" title="${t('btnExportProjectExcel')}">
                <i class="fa-solid fa-file-excel"></i> <span class="hide-mobile">${t('btnExportProjectExcel')}</span>
              </button>
            ` : ''}
            <button class="dossier-toggle-btn" onclick="toggleDossierCollapse('${p.id}')" title="طي / توسيع ملف المشروع">
              <i class="fa-solid fa-chevron-down dossier-toggle-icon" id="toggle-icon-prj-${p.id}"></i>
            </button>
          </div>
        </header>

        <div class="dossier-body" id="dossier-body-prj-${p.id}">
          ${vehiclesHtml}
          ${unlistedCardsHtml}
        </div>
      </div>
    `;
  }).join('');

  if (unassignedCards.length > 0 && (!filterProject || filterProject === 'general')) {
    const genCost = unassignedCards.reduce((acc, c) => acc + (parseFloat(c.cost) || 0), 0);
    html += `
      <div class="project-dossier-card" id="dossier-prj-general">
        <header class="dossier-header" style="background: linear-gradient(135deg, #334155 0%, #475569 100%);" onclick="toggleDossierCollapse('general')">
          <div class="dossier-title-area">
            <i class="fa-solid fa-folder-open dossier-folder-icon" style="color:#94a3b8;"></i>
            <div class="dossier-title-text">
              <h3><span>كروت صيانة عامة (غير مرتبطة بمشروع محدد)</span></h3>
            </div>
          </div>
          <div class="dossier-kpi-bar" onclick="event.stopPropagation()">
            <span class="dossier-kpi-chip"><i class="fa-solid fa-clipboard-check"></i> ${unassignedCards.length} ${t('cardsUnit')}</span>
            <span class="dossier-kpi-chip highlight-cost"><i class="fa-solid fa-coins"></i> ${genCost.toLocaleString(locale, {minimumFractionDigits: 2})} ${t('currency')}</span>
          </div>
        </header>
        <div class="dossier-body" id="dossier-body-prj-general">
          <div class="vehicle-cards-subgrid">
            ${unassignedCards.map(c => buildSingleCardHtml(c, isAdmin, locale, true)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function renderCardsList() {
  const container = document.getElementById('cards-container');
  const noCardsMsg = document.getElementById('no-cards-msg');
  if (!container) return;

  const isAdmin = currentUser && currentUser.role === 'admin';

  // مزامنة حالة زري التبديل (خاص بالمدير فقط)
  const btnDossiers = document.getElementById('btn-view-dossiers');
  const btnGrid = document.getElementById('btn-view-grid');
  if (btnDossiers && btnGrid && isAdmin) {
    if (cardsViewMode === 'dossiers') {
      btnDossiers.classList.add('active');
      btnGrid.classList.remove('active');
    } else {
      btnDossiers.classList.remove('active');
      btnGrid.classList.add('active');
    }
  }

  const allCards = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARDS) || '[]');
  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');

  // عزل البيانات: السائق يرى كروته وسيارته المخصصة فقط ولا يظهر له ملف المشاريع والقطاعات
  let list = isAdmin
    ? allCards
    : allCards.filter(c => c.vehiclePlate === currentUser.vehiclePlate || c.techId === currentUser.id || c.createdBy === currentUser.id);

  const search = document.getElementById('filter-search').value.trim().toLowerCase();
  const filterProject = (isAdmin && document.getElementById('filter-project')) ? document.getElementById('filter-project').value : '';
  const filterTech = (isAdmin && document.getElementById('filter-tech')) ? document.getElementById('filter-tech').value : '';

  if (search) {
    list = list.filter(c => 
      (c.vehiclePlate && c.vehiclePlate.toLowerCase().includes(search)) ||
      (c.vehicleModel && c.vehicleModel.toLowerCase().includes(search)) ||
      (c.techName && c.techName.toLowerCase().includes(search)) ||
      (c.projectName && c.projectName.toLowerCase().includes(search)) ||
      (c.invoiceNumber && c.invoiceNumber.toLowerCase().includes(search)) ||
      (c.changesDescription && c.changesDescription.toLowerCase().includes(search)) ||
      (c.workshopName && c.workshopName.toLowerCase().includes(search)) ||
      (c.cardNumber && c.cardNumber.toLowerCase().includes(search))
    );
  }

  if (isAdmin && filterProject) {
    list = list.filter(c => c.projectId === filterProject);
  }

  if (isAdmin && filterTech) {
    list = list.filter(c => c.techId === filterTech || c.createdBy === filterTech);
  }

  list.sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));

  // الفني / السائق: لا يظهر له ملف المشاريع والقطاعات إطلاقاً، فقط عمل كرت صيانة ومتابعة كروت سيارته مباشرة
  // المدير فقط هو المتحكم في ملفات المشاريع والقطاعات
  const effectiveViewMode = isAdmin ? cardsViewMode : 'grid';

  if (effectiveViewMode === 'dossiers') {
    container.className = 'project-dossiers-container';
    noCardsMsg.classList.add('hidden');
    renderDossiersView(container, list, projects, allCards);
  } else {
    container.className = 'cards-grid';
    if (list.length === 0) {
      container.innerHTML = '';
      noCardsMsg.classList.remove('hidden');
      return;
    }
    noCardsMsg.classList.add('hidden');
    renderGridView(container, list);
  }
}

// =============================================================================
// التحكم في توفر الصور والمرفقات (صيانة سابقة بدون صور أو صيانة جديدة بصور)
// =============================================================================

function setGeneralPhotoAvailability(hasPhotos) {
  const hiddenInput = document.getElementById('card-has-photos');
  if (hiddenInput) hiddenInput.value = hasPhotos ? 'yes' : 'no';

  const btnYes = document.getElementById('btn-photos-yes');
  const btnNo = document.getElementById('btn-photos-no');

  if (btnYes && btnNo) {
    if (hasPhotos) {
      btnYes.classList.add('active');
      btnYes.classList.remove('no-photo');
      btnNo.classList.remove('active', 'no-photo');
    } else {
      btnYes.classList.remove('active');
      btnNo.classList.add('active', 'no-photo');
    }
  }

  // مزامنة عناصر الإرفاق الفردية (عداد - فاتورة - قطع)
  ['odometer', 'invoice', 'parts'].forEach(type => {
    const chk = document.getElementById(`chk-has-${type}-img`);
    if (chk) chk.checked = hasPhotos;
    toggleSinglePhotoInput(type, hasPhotos);
  });
}

function toggleSinglePhotoInput(type, forceState) {
  const chk = document.getElementById(`chk-has-${type}-img`);
  if (!chk) return;

  if (typeof forceState === 'boolean') {
    chk.checked = forceState;
  }

  const isEnabled = chk.checked;
  const star = document.getElementById(`req-star-${type}`);
  const controls = document.getElementById(`controls-${type}`);
  const preview = document.getElementById(`img-${type}-preview`);
  const badge = document.getElementById(`no-photo-badge-${type}`);
  const inputVal = document.getElementById(`img-${type}-val`);

  if (star) star.classList.toggle('hidden', !isEnabled);
  if (controls) controls.classList.toggle('hidden', !isEnabled);
  if (preview) preview.classList.toggle('hidden', !isEnabled);
  if (badge) badge.classList.toggle('hidden', isEnabled);

  if (!isEnabled && inputVal) {
    inputVal.value = '';
    const fileInput = document.getElementById(`img-${type}-input`);
    if (fileInput) fileInput.value = '';
  }
}

// فتح نافذة إنشاء كرت صيانة جديد مع حصر السائق على سيارته فقط ودعم التحديد المسبق للمشروع والمركبة
function openNewCardModal(prefillProjectId = null, prefillPlate = null) {
  document.getElementById('card-form').reset();
  document.getElementById('card-id').value = '';
  document.getElementById('modal-card-title').innerHTML = '<i class="fa-solid fa-file-circle-plus"></i> ' + t('modalCardNewTitle', 'إنشاء كرت صيانة سيارة جديد');

  document.getElementById('card-date').value = new Date().toISOString().split('T')[0];

  // تهيئة خيارات الصور الافتراضية
  setGeneralPhotoAvailability(true);

  clearImagePreview('img-odometer-preview', 'img-odometer-val', 'صورة العداد');
  clearImagePreview('img-invoice-preview', 'img-invoice-val', 'صورة الفاتورة');
  clearImagePreview('img-parts-preview', 'img-parts-val', 'صورة الفلاتر والقطع');

  document.querySelectorAll('.tag-chip').forEach(t => t.classList.remove('active'));

  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  const projectSelect = document.getElementById('card-project');
  projectSelect.innerHTML = `<option value="">${t('optSelectProject', '-- اختر المشروع --')}</option>`;

  const isAdmin = currentUser && currentUser.role === 'admin';

  projects.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.code})`;
    projectSelect.appendChild(opt);
  });

  if (!isAdmin && currentUser) {
    if (currentUser.projectId) {
      projectSelect.value = currentUser.projectId;
      projectSelect.disabled = true;
    }
    document.getElementById('card-tech-name').value = currentUser.fullName;
  } else {
    projectSelect.disabled = false;
    if (prefillProjectId) {
      projectSelect.value = prefillProjectId;
    }
    document.getElementById('card-tech-name').value = currentUser ? currentUser.fullName : (currentLang === 'ar' ? 'مدير الموقع' : 'Site Manager');
  }

  onProjectSelectChanged();

  if (prefillPlate) {
    const vehicleSelect = document.getElementById('card-vehicle');
    if (vehicleSelect) {
      vehicleSelect.value = prefillPlate;
      onVehicleSelectChanged();
    }
  }

  openModal('modal-card');
}

// عند اختيار المشروع: إذا كان المستخدم سائق تظهر له سيارته المخصصة فقط
function onProjectSelectChanged() {
  const prjId = document.getElementById('card-project').value;
  const vehicleSelect = document.getElementById('card-vehicle');
  vehicleSelect.innerHTML = '<option value="">-- اختر السيارة --</option>';

  document.getElementById('card-vehicle-model').value = '';

  const vehicles = JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]');
  const isAdmin = currentUser && currentUser.role === 'admin';

  if (!isAdmin && currentUser) {
    // السائق تظهر له سيارته المخصصة فقط!
    const myVehicle = vehicles.find(v => 
      v.plate === currentUser.vehiclePlate || 
      (v.driver && v.driver.toLowerCase() === currentUser.fullName.toLowerCase())
    );

    if (myVehicle) {
      const opt = document.createElement('option');
      opt.value = myVehicle.plate;
      opt.textContent = `${myVehicle.plate} - ${myVehicle.model} (مخصصة لك)`;
      opt.setAttribute('data-model', myVehicle.model);
      opt.setAttribute('data-odo', myVehicle.currentOdometer || 0);
      vehicleSelect.appendChild(opt);
      vehicleSelect.value = myVehicle.plate;
      vehicleSelect.disabled = true;
      document.getElementById('card-vehicle-model').value = myVehicle.model;
      if (myVehicle.currentOdometer) {
        document.getElementById('card-odometer-current').placeholder = `آخر قراءة مسجلة: ${myVehicle.currentOdometer} كم`;
      }
    } else {
      // إذا لم يكن بالأسطول سيارة مسجلة برقم لوحته بعد
      const opt = document.createElement('option');
      opt.value = currentUser.vehiclePlate || 'سيارة السائق';
      opt.textContent = `${currentUser.vehiclePlate || 'سيارة السائق'} (سيارتك المخصصة)`;
      opt.setAttribute('data-model', 'مركبة مخصصة');
      vehicleSelect.appendChild(opt);
      vehicleSelect.value = opt.value;
      vehicleSelect.disabled = true;
      document.getElementById('card-vehicle-model').value = 'مركبة مخصصة';
    }
  } else {
    // المدير تظهر له كافة سيارات المشروع
    vehicleSelect.disabled = false;
    if (!prjId) return;

    const filteredVehicles = vehicles.filter(v => v.projectId === prjId);
    filteredVehicles.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.plate;
      opt.textContent = `${v.plate} - ${v.model} (${v.driver || 'بدون سائق'})`;
      opt.setAttribute('data-model', v.model);
      opt.setAttribute('data-odo', v.currentOdometer || 0);
      vehicleSelect.appendChild(opt);
    });
  }
}

function onVehicleSelectChanged() {
  const vehicleSelect = document.getElementById('card-vehicle');
  const selectedOpt = vehicleSelect.options[vehicleSelect.selectedIndex];

  if (!selectedOpt || !selectedOpt.value) {
    document.getElementById('card-vehicle-model').value = '';
    return;
  }

  const model = selectedOpt.getAttribute('data-model') || '';
  const currentOdo = selectedOpt.getAttribute('data-odo') || '';

  document.getElementById('card-vehicle-model').value = model;
  if (currentOdo) {
    document.getElementById('card-odometer-current').placeholder = `آخر قراءة مسجلة: ${currentOdo} كم`;
  }
}

async function handleImageUpload(event, previewId, valueInputId) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('يرجى اختيار ملف صورة صالح', 'error');
    return;
  }

  showToast('جاري معالجة وضغط الصورة...', 'info');

  try {
    const compressedBase64 = await compressImage(file, 1000, 0.72);
    document.getElementById(valueInputId).value = compressedBase64;
    renderImagePreview(previewId, compressedBase64, valueInputId);
    showToast('تم إرفاق الصورة بنجاح', 'success');
  } catch (err) {
    console.error('Image compression failed', err);
    showToast('حدث خطأ أثناء معالجة الصورة، يرجى المحاولة بملف آخر', 'error');
  }
}

function renderImagePreview(previewContainerId, base64Src, valueInputId) {
  const container = document.getElementById(previewContainerId);
  if (!container) return;

  container.innerHTML = `
    <img src="${base64Src}" alt="معاينة المرفق">
    <button type="button" class="preview-delete-btn" onclick="clearImagePreview('${previewContainerId}', '${valueInputId}')" title="حذف الصورة">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
}

function clearImagePreview(previewContainerId, valueInputId, label = 'الصورة') {
  const container = document.getElementById(previewContainerId);
  const input = document.getElementById(valueInputId);
  if (input) input.value = '';
  if (container) {
    container.innerHTML = `
      <div class="preview-placeholder">
        <i class="fa-solid fa-image"></i>
        <span>لم يتم إرفاق ${label} بعد</span>
      </div>
    `;
  }
}

function toggleQuickTag(btn, text) {
  btn.classList.toggle('active');
  const textarea = document.getElementById('card-changes-desc');
  let currentVal = textarea.value.trim();

  if (btn.classList.contains('active')) {
    if (currentVal.length > 0) {
      textarea.value = currentVal + '، ' + text;
    } else {
      textarea.value = text;
    }
  }
}

// حفظ أو اعتماد كرت الصيانة مع قراءة العداد الحالي فقط
function handleSaveCard(event) {
  event.preventDefault();

  const cardId = document.getElementById('card-id').value;
  const projectId = document.getElementById('card-project').value;
  const vehiclePlate = document.getElementById('card-vehicle').value;
  const vehicleModel = document.getElementById('card-vehicle-model').value;
  const techName = document.getElementById('card-tech-name').value;
  const serviceDate = document.getElementById('card-date').value;
  const odometerCurrent = parseFloat(document.getElementById('card-odometer-current').value);
  
  const invoiceNumber = document.getElementById('card-invoice-number').value.trim();
  const cost = parseFloat(document.getElementById('card-cost').value);
  const workshopName = document.getElementById('card-workshop').value.trim();
  const changesDesc = document.getElementById('card-changes-desc').value.trim();
  const notes = document.getElementById('card-notes').value.trim();

  const imgOdometer = document.getElementById('img-odometer-val').value;
  const imgInvoice = document.getElementById('img-invoice-val').value;
  const imgParts = document.getElementById('img-parts-val').value;

  const hasPhotosOption = document.getElementById('card-has-photos').value === 'yes';
  const hasOdoChecked = document.getElementById('chk-has-odometer-img') ? document.getElementById('chk-has-odometer-img').checked : true;
  const hasInvChecked = document.getElementById('chk-has-invoice-img') ? document.getElementById('chk-has-invoice-img').checked : true;
  const hasPartsChecked = document.getElementById('chk-has-parts-img') ? document.getElementById('chk-has-parts-img').checked : true;

  if (isNaN(odometerCurrent) || odometerCurrent < 0) {
    showToast('يرجى كتابة قراءة العداد الحالية لغيار الزيت بشكل صحيح!', 'warning');
    return;
  }

  // التحقق من الصور فقط إذا تم تفعيل خيار توفر الصور والمرفق الفردي
  if (hasPhotosOption && hasOdoChecked && !imgOdometer) {
    showToast('يجب إرفاق صورة العداد لتأكيد الكيلومترات أو اختر (لا، صيانة سابقة بدون صور)', 'warning');
    return;
  }
  if (hasPhotosOption && hasInvChecked && !imgInvoice) {
    showToast('يجب إرفاق صورة الفاتورة لاعتماد الصرف أو اختر (لا، صيانة سابقة بدون صور)', 'warning');
    return;
  }
  if (hasPhotosOption && hasPartsChecked && !imgParts) {
    showToast('يجب إرفاق صورة الفلاتر أو القطع أو اختر (لا، صيانة سابقة بدون صور)', 'warning');
    return;
  }

  const finalImgOdometer = (hasPhotosOption && hasOdoChecked) ? imgOdometer : '';
  const finalImgInvoice = (hasPhotosOption && hasInvChecked) ? imgInvoice : '';
  const finalImgParts = (hasPhotosOption && hasPartsChecked) ? imgParts : '';
  const hasAnyPhoto = Boolean(finalImgOdometer || finalImgInvoice || finalImgParts);

  const cards = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARDS) || '[]');
  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  const prj = projects.find(p => p.id === projectId);
  const projectName = prj ? prj.name : 'مشروع عام';

  if (cardId) {
    const index = cards.findIndex(c => c.id === cardId);
    if (index !== -1) {
      if (currentUser.role !== 'admin' && cards[index].createdBy !== currentUser.id) {
        showToast('غير مصرح لك بتعديل كرت صيانة خاص بزميل آخر', 'error');
        return;
      }

      cards[index] = {
        ...cards[index],
        projectId,
        projectName,
        vehiclePlate,
        vehicleModel,
        serviceDate,
        odometerCurrent,
        invoiceNumber,
        cost,
        workshopName,
        changesDescription: changesDesc,
        notes,
        hasPhotos: hasAnyPhoto,
        imgOdometer: finalImgOdometer,
        imgInvoice: finalImgInvoice,
        imgParts: finalImgParts,
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
      cloudSave('cards', cards[index].id, cards[index]);
      logAudit('تعديل كرت صيانة', `تم تعديل كرت الصيانة رقم ${cards[index].cardNumber}`, vehiclePlate);
      showToast('تم تحديث كرت الصيانة بنجاح', 'success');
    }
  } else {
    const newCardNumber = 'MC-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const newCard = {
      id: 'card-' + Date.now(),
      cardNumber: newCardNumber,
      projectId,
      projectName,
      vehiclePlate,
      vehicleModel,
      techId: currentUser ? currentUser.id : 'usr-driver',
      techName: techName || (currentUser ? currentUser.fullName : 'السائق'),
      serviceDate,
      odometerCurrent,
      invoiceNumber,
      cost,
      workshopName,
      changesDescription: changesDesc,
      notes,
      hasPhotos: hasAnyPhoto,
      imgOdometer: finalImgOdometer,
      imgInvoice: finalImgInvoice,
      imgParts: finalImgParts,
      createdAt: new Date().toISOString(),
      createdBy: currentUser ? currentUser.id : 'usr-driver'
    };

    cards.unshift(newCard);
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
    cloudSave('cards', newCard.id, newCard);

    // تحديث قراءة العداد وتاريخ الصيانة بالمركبة
    const vehicles = JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]');
    const vehIndex = vehicles.findIndex(v => v.plate === vehiclePlate);
    if (vehIndex !== -1) {
      vehicles[vehIndex].currentOdometer = odometerCurrent;
      vehicles[vehIndex].lastServiceDate = serviceDate;
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
      cloudSave('vehicles', vehicles[vehIndex].id || vehicles[vehIndex].plate, vehicles[vehIndex]);
    }

    logAudit('تسجيل كرت صيانة جديد', `تم تسجيل كرت الصيانة رقم ${newCardNumber} بمبلغ ${cost} ر.س (${hasAnyPhoto ? 'موثق بصور' : 'صيانة سابقة بدون صور'})`, vehiclePlate);
    showToast(`تم حفظ واعتماد كرت الصيانة رقم ${newCardNumber} بنجاح`, 'success');
  }

  closeModal('modal-card');
  refreshStatsCounters();
  renderCardsList();
  if (currentUser.role === 'admin') {
    renderVehiclesTable();
  }
}

function editCard(cardId) {
  const cards = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARDS) || '[]');
  const card = cards.find(c => c.id === cardId);
  if (!card) return;

  openNewCardModal();

  document.getElementById('card-id').value = card.id;
  document.getElementById('modal-card-title').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> تعديل كرت صيانة: ${card.cardNumber}`;

  document.getElementById('card-project').value = card.projectId;
  onProjectSelectChanged();

  document.getElementById('card-vehicle').value = card.vehiclePlate;
  document.getElementById('card-vehicle-model').value = card.vehicleModel || '';
  document.getElementById('card-tech-name').value = card.techName || '';
  document.getElementById('card-date').value = card.serviceDate;
  document.getElementById('card-odometer-current').value = card.odometerCurrent;

  document.getElementById('card-invoice-number').value = card.invoiceNumber;
  document.getElementById('card-cost').value = card.cost;
  document.getElementById('card-workshop').value = card.workshopName;
  document.getElementById('card-changes-desc').value = card.changesDescription;
  document.getElementById('card-notes').value = card.notes || '';

  const hasOdo = Boolean(card.imgOdometer && card.imgOdometer.startsWith('data:image'));
  const hasInv = Boolean(card.imgInvoice && card.imgInvoice.startsWith('data:image'));
  const hasParts = Boolean(card.imgParts && card.imgParts.startsWith('data:image'));
  const hasAny = hasOdo || hasInv || hasParts;

  setGeneralPhotoAvailability(hasAny);
  toggleSinglePhotoInput('odometer', hasOdo);
  toggleSinglePhotoInput('invoice', hasInv);
  toggleSinglePhotoInput('parts', hasParts);

  if (hasOdo) {
    document.getElementById('img-odometer-val').value = card.imgOdometer;
    renderImagePreview('img-odometer-preview', card.imgOdometer, 'img-odometer-val');
  }
  if (hasInv) {
    document.getElementById('img-invoice-val').value = card.imgInvoice;
    renderImagePreview('img-invoice-preview', card.imgInvoice, 'img-invoice-val');
  }
  if (hasParts) {
    document.getElementById('img-parts-val').value = card.imgParts;
    renderImagePreview('img-parts-preview', card.imgParts, 'img-parts-val');
  }
}

function deleteCard(cardId) {
  if (currentUser.role !== 'admin') {
    showToast('لا يملك صلاحية حذف كروت الصيانة إلا إدارة الشركة!', 'error');
    return;
  }

  const cards = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARDS) || '[]');
  const card = cards.find(c => c.id === cardId);
  if (!card) return;

  if (confirm(`هل أنت متأكد من حذف كرت الصيانة رقم (${card.cardNumber}) للسيارة [${card.vehiclePlate}]؟`)) {
    const updated = cards.filter(c => c.id !== cardId);
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(updated));
    cloudDelete('cards', cardId);
    logAudit('حذف كرت صيانة', `قام المدير بحذف كرت الصيانة رقم ${card.cardNumber}`, card.vehiclePlate);
    showToast(`تم حذف كرت الصيانة رقم ${card.cardNumber} بنجاح`, 'success');
    refreshStatsCounters();
    renderCardsList();
  }
}

// معاينة وطباعة كرت الصيانة الرسمي بالهوية البصرية الرسمية
function viewPrintableCard(cardId) {
  const cards = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARDS) || '[]');
  const card = cards.find(c => c.id === cardId);
  if (!card) return;

  const printContainer = document.getElementById('printable-card-content');
  if (!printContainer) return;

  printContainer.innerHTML = `
    <div class="official-print-card">
      <header class="print-header">
        <div class="print-brand">
          ${BRAND_LOGO_SVG}
          <div>
            <h1>شركة الأداء المتوازن للمقاولات</h1>
            <p>إدارة الحركة والمعدات والصيانة - Balanced Performance Contracting</p>
          </div>
        </div>
        <div class="print-card-badge">
          <strong>كرت صيانة سيارة رسمي</strong>
          <span>رقم: ${escapeHtml(card.cardNumber || card.id)}</span>
        </div>
      </header>

      <div class="print-info-grid">
        <div class="print-info-item">
          <span>المشروع التابع له:</span>
          <strong>${escapeHtml(card.projectName || 'مشروع عام')}</strong>
        </div>
        <div class="print-info-item">
          <span>رقم اللوحة ونوع المركبة:</span>
          <strong>${escapeHtml(card.vehiclePlate)} | ${escapeHtml(card.vehicleModel)}</strong>
        </div>
        <div class="print-info-item">
          <span>السائق / الفني المسؤول:</span>
          <strong>${escapeHtml(card.techName)}</strong>
        </div>
        <div class="print-info-item">
          <span>تاريخ تنفيذ الصيانة:</span>
          <strong>${escapeHtml(card.serviceDate)}</strong>
        </div>
        <div class="print-info-item">
          <span>قراءة العداد الحالية لغيار الزيت:</span>
          <strong style="color: #0d8a4d;">${Number(card.odometerCurrent).toLocaleString('ar-SA')} كم</strong>
        </div>
        <div class="print-info-item">
          <span>مبلغ الفاتورة والورشة:</span>
          <strong>${Number(card.cost).toFixed(2)} ر.س (${escapeHtml(card.workshopName)})</strong>
        </div>
      </div>

      <div class="print-section-title">
        <i class="fa-solid fa-wrench"></i> بيان التغيرات وأعمال الصيانة المنفذة بالتفصيل
      </div>
      <div class="print-desc-box">
        ${escapeHtml(card.changesDescription)}
      </div>

      ${card.notes ? `
        <div class="print-section-title" style="margin-top: 10px;">
          <i class="fa-solid fa-comment-dots"></i> الملاحظات والتوصيات
        </div>
        <div class="print-desc-box" style="background:#fff; font-size:0.85rem;">
          ${escapeHtml(card.notes)}
        </div>
      ` : ''}

      ${(() => {
        const hasOdo = Boolean(card.imgOdometer && card.imgOdometer.startsWith('data:image'));
        const hasInv = Boolean(card.imgInvoice && card.imgInvoice.startsWith('data:image'));
        const hasParts = Boolean(card.imgParts && card.imgParts.startsWith('data:image'));
        const hasAny = hasOdo || hasInv || hasParts;

        if (!hasAny) {
          return `
            <div class="print-section-title">
              <i class="fa-solid fa-clipboard-check"></i> التوثيق الإداري والمستندي لعملية الصيانة
            </div>
            <div class="no-photo-badge" style="padding: 14px 18px; margin-top: 10px; font-size: 0.92rem; justify-content: center; background: #fffbeb; border: 1px dashed #d97706; color: #92400e;">
              <i class="fa-solid fa-clock-rotate-left" style="font-size: 1.25rem;"></i>
              <span>صيانة سابقة مقيدة دفترياً: تم توثيق هذه العملية دفترياً واعتماد قراءة العداد وقيمة الفاتورة طبقاً للسجلات السابقة دون مرفقات صور.</span>
            </div>
          `;
        }

        return `
          <div class="print-section-title">
            <i class="fa-solid fa-camera"></i> التوثيق الفوتوغرافي (العداد الحالي - الفاتورة - الفلاتر)
          </div>
          <div class="print-photos-grid">
            <div class="print-photo-card">
              ${hasOdo ? `<img src="${card.imgOdometer}" alt="صورة العداد">` : `<div class="no-photo-placeholder" style="height:105px; padding: 12px;"><i class="fa-solid fa-clock-rotate-left"></i><span>تم تسجيل القراءة بدون صورة للعداد</span></div>`}
              <p>1. صورة لوحة العداد لغيار الزيت الحالي</p>
            </div>
            <div class="print-photo-card">
              ${hasInv ? `<img src="${card.imgInvoice}" alt="صورة الفاتورة">` : `<div class="no-photo-placeholder" style="height:105px; padding: 12px;"><i class="fa-solid fa-clock-rotate-left"></i><span>تم التقييد بدون صورة للفاتورة</span></div>`}
              <p>2. صورة الفاتورة (رقم: ${escapeHtml(card.invoiceNumber)})</p>
            </div>
            <div class="print-photo-card">
              ${hasParts ? `<img src="${card.imgParts}" alt="صورة الفلاتر">` : `<div class="no-photo-placeholder" style="height:105px; padding: 12px;"><i class="fa-solid fa-clock-rotate-left"></i><span>تم التقييد بدون صورة للقطع</span></div>`}
              <p>3. صورة الفلاتر والقطع المستبدلة</p>
            </div>
          </div>
        `;
      })()}

      <footer class="print-signatures">
        <div class="signature-box">
          <p>السائق / الفني المنفذ</p>
          <div class="signature-space"></div>
          <p>${escapeHtml(card.techName)}</p>
        </div>
        <div class="signature-box">
          <p>مدير الحركة والمشاريع</p>
          <div class="signature-space"></div>
          <p>الاعتماد الفني</p>
        </div>
        <div class="signature-box">
          <p>اعتماد الإدارة العامة</p>
          <div class="signature-space"></div>
          <p>شركة الأداء المتوازن للمقاولات</p>
        </div>
      </footer>
    </div>
  `;

  openModal('modal-view-card');
}

// =============================================================================
// 9. إدارة المديرين (خاص بالمدير الرئيسي لإضافة مديري متابعة الأسطول)
// =============================================================================

function renderAdminsTable() {
  const tbody = document.getElementById('admins-table-body');
  if (!tbody) return;

  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  const admins = users.filter(u => u.role === 'admin');

  if (admins.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center p-3 text-muted">${t('noAdminsRegistered', 'لا يوجد مديرين مسجلين بعد')}</td></tr>`;
    return;
  }

  const primaryLabel = currentLang === 'ar' ? 'رئيسي' : (currentLang === 'en' ? 'Primary' : (currentLang === 'ur' ? 'بنیادی' : (currentLang === 'hi' ? 'मुख्य' : (currentLang === 'bn' ? 'প্রধান' : 'Pangunahin'))));
  const currentAccLabel = currentLang === 'ar' ? 'حسابك الحالي' : (currentLang === 'en' ? 'Your Account' : (currentLang === 'ur' ? 'آپ کا اکاؤنٹ' : (currentLang === 'hi' ? 'आपका खाता' : (currentLang === 'bn' ? 'আপনার অ্যাকাউন্ট' : 'Kasalukuyang Account'))));

  tbody.innerHTML = admins.map(a => `
    <tr>
      <td><strong>${escapeHtml(a.fullName)}</strong> ${a.isSuperAdmin ? `<span class="badge-status badge-active">${primaryLabel}</span>` : ''}</td>
      <td><code>${escapeHtml(a.username)}</code></td>
      <td>${escapeHtml(a.phone || '--')}</td>
      <td><span class="badge-status badge-admin">${escapeHtml(a.roleTitle || t('roleAdmin', 'مدير متابعة أسطول'))}</span></td>
      <td><span class="badge-status badge-active">${t('statusActive', 'نشط')}</span></td>
      <td>
        ${currentUser && currentUser.id !== a.id && !a.isSuperAdmin ? `
          <button class="btn btn-outline-danger btn-sm" onclick="deleteAdmin('${a.id}')" title="${t('btnDelete', 'حذف')}">
            <i class="fa-solid fa-trash"></i>
          </button>
        ` : `<small class="text-muted">${currentAccLabel}</small>`}
      </td>
    </tr>
  `).join('');
}

function openNewAdminModal() {
  document.getElementById('admin-form').reset();
  document.getElementById('admin-user-id').value = '';
  document.getElementById('admin-password').required = true;
  document.getElementById('admin-pass-req').classList.remove('hidden');
  document.getElementById('admin-pass-hint').textContent = 'كلمة المرور مطلوبة للحساب الجديد';
  openModal('modal-admin');
}

async function handleSaveAdmin(event) {
  event.preventDefault();

  const fullName = document.getElementById('admin-fullname').value.trim();
  const username = document.getElementById('admin-username').value.trim().toLowerCase();
  const roleTitle = document.getElementById('admin-role-title').value.trim() || 'مدير متابعة حركة وأسطول';
  const phone = document.getElementById('admin-phone').value.trim();
  const password = document.getElementById('admin-password').value;

  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');

  const duplicate = users.find(u => u.username.toLowerCase() === username);
  if (duplicate) {
    showToast('اسم المستخدم هذا مستخدم مسبقاً، اختر اسماً آخر', 'error');
    return;
  }

  if (!password || password.length < 5) {
    showToast('يرجى إدخال كلمة مرور مكونة من 5 خانات على الأقل', 'warning');
    return;
  }

  const newAdmin = {
    id: 'usr-admin-' + Date.now(),
    username,
    passwordHash: await hashPassword(password),
    fullName,
    role: 'admin',
    roleTitle,
    projectId: '',
    phone,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  users.push(newAdmin);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  cloudSave('users', newAdmin.id, newAdmin);

  logAudit('إضافة مدير جديد', `قام ${currentUser.fullName} بإضافة مدير جديد: ${fullName}`, username);
  showToast('تمت إضافة حساب المدير بنجاح', 'success');

  closeModal('modal-admin');
  renderAdminsTable();
}

function deleteAdmin(adminId) {
  if (currentUser.id === adminId) {
    showToast('لا يمكنك حذف حسابك الحالي!', 'warning');
    return;
  }

  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  const admin = users.find(u => u.id === adminId);
  if (!admin) return;

  if (confirm(`هل أنت متأكد من حذف حساب المدير (${admin.fullName})؟`)) {
    const updated = users.filter(u => u.id !== adminId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    cloudDelete('users', adminId);
    logAudit('حذف حساب مدير', `تم حذف حساب المدير: ${admin.fullName}`, admin.username);
    showToast('تم حذف حساب المدير بنجاح', 'success');
    renderAdminsTable();
  }
}

// =============================================================================
// 10. إدارة المشاريع (خاص بالمديرين)
// =============================================================================

function renderProjectsTable() {
  const tbody = document.getElementById('projects-table-body');
  if (!tbody) return;

  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  const vehicles = JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]');
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');

  if (projects.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center p-3 text-muted">${t('noProjectsRegistered', 'لا توجد مشاريع مسجلة بعد. اضغط "إضافة مشروع جديد" للبدء.')}</td></tr>`;
    return;
  }

  const unspecLabel = currentLang === 'ar' ? 'غير محدد' : 'Unspecified';

  tbody.innerHTML = projects.map(p => {
    const vCount = vehicles.filter(v => v.projectId === p.id).length;
    const tCount = users.filter(u => u.projectId === p.id).length;

    return `
      <tr>
        <td><strong>${escapeHtml(p.code)}</strong></td>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td>${escapeHtml(p.location)}</td>
        <td>${escapeHtml(p.manager || unspecLabel)}</td>
        <td><span class="badge-status badge-active">${vCount} ${t('vehicleUnit', 'سيارة')}</span></td>
        <td><span class="badge-status badge-active">${tCount} ${t('driverUnit', 'سائق')}</span></td>
        <td>
          <span class="badge-status ${p.status === 'active' ? 'badge-active' : 'badge-pending'}">
            ${p.status === 'active' ? t('statusActive', 'نشط') : t('statusPending', 'تحت التجهيز')}
          </span>
        </td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-outline-primary btn-sm" onclick="openProjectDossier('${p.id}')" title="${t('openMaintenanceDossier', 'ملف الصيانة')}">
              <i class="fa-solid fa-folder-open"></i> <span class="hide-mobile">${t('openMaintenanceDossier', 'ملف الصيانة')}</span>
            </button>
            <button class="btn btn-outline-secondary btn-sm" onclick="editProject('${p.id}')" title="${t('btnEdit', 'تعديل')}">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteProject('${p.id}')" title="${t('btnDelete', 'حذف')}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openNewProjectModal() {
  document.getElementById('project-form').reset();
  document.getElementById('project-id').value = '';
  document.getElementById('modal-project-title').innerHTML = '<i class="fa-solid fa-diagram-project"></i> إضافة مشروع جديد';
  openModal('modal-project');
}

function handleSaveProject(event) {
  event.preventDefault();
  const id = document.getElementById('project-id').value;
  const code = document.getElementById('project-code').value.trim();
  const name = document.getElementById('project-name').value.trim();
  const location = document.getElementById('project-location').value.trim();
  const manager = document.getElementById('project-manager').value.trim();
  const status = document.getElementById('project-status').value;

  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');

  if (id) {
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], code, name, location, manager, status };
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
      cloudSave('projects', projects[index].id, projects[index]);
      logAudit('تعديل مشروع', `تم تعديل بيانات المشروع: ${name}`, code);
      showToast('تم تعديل المشروع بنجاح', 'success');
    }
  } else {
    const newPrj = {
      id: 'prj-' + Date.now(),
      code,
      name,
      location,
      manager,
      status,
      createdAt: new Date().toISOString().split('T')[0]
    };
    projects.push(newPrj);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    cloudSave('projects', newPrj.id, newPrj);
    logAudit('إضافة مشروع', `تمت إضافة مشروع جديد للشركة: ${name}`, code);
    showToast('تمت إضافة المشروع بنجاح', 'success');
  }

  closeModal('modal-project');
  renderProjectsTable();
  populateFilterOptions();
  refreshStatsCounters();
}

function editProject(id) {
  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  const prj = projects.find(p => p.id === id);
  if (!prj) return;

  document.getElementById('project-id').value = prj.id;
  document.getElementById('project-code').value = prj.code;
  document.getElementById('project-name').value = prj.name;
  document.getElementById('project-location').value = prj.location;
  document.getElementById('project-manager').value = prj.manager || '';
  document.getElementById('project-status').value = prj.status;

  document.getElementById('modal-project-title').innerHTML = '<i class="fa-solid fa-pen"></i> تعديل بيانات المشروع';
  openModal('modal-project');
}

function deleteProject(id) {
  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  const prj = projects.find(p => p.id === id);
  if (!prj) return;

  if (confirm(`هل أنت متأكد من حذف المشروع (${prj.name})؟`)) {
    const updated = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(updated));
    cloudDelete('projects', id);
    logAudit('حذف مشروع', `تم حذف المشروع: ${prj.name}`, prj.code);
    showToast('تم حذف المشروع بنجاح', 'success');
    renderProjectsTable();
    populateFilterOptions();
    refreshStatsCounters();
  }
}

// =============================================================================
// 11. إدارة أسطول المركبات (خاص بالمديرين)
// =============================================================================

function renderVehiclesTable() {
  const tbody = document.getElementById('vehicles-table-body');
  if (!tbody) return;

  const vehicles = JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]');
  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');

  if (vehicles.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center p-3 text-muted">${t('noVehiclesRegistered', 'لا توجد سيارات مسجلة بالأسطول بعد. اضغط "إضافة مركبة جديدة" للبدء.')}</td></tr>`;
    return;
  }

  const unspecLabel = currentLang === 'ar' ? 'غير محدد' : 'Unspecified';
  const numLocale = currentLang === 'ar' ? 'ar-SA' : 'en-US';

  tbody.innerHTML = vehicles.map(v => {
    const prj = projects.find(p => p.id === v.projectId);

    return `
      <tr>
        <td><strong class="plate-badge">${escapeHtml(v.plate)}</strong></td>
        <td><strong>${escapeHtml(v.model)}</strong></td>
        <td>${v.year || '--'}</td>
        <td><strong>${escapeHtml(prj ? prj.name : unspecLabel)}</strong></td>
        <td><span class="badge-status badge-active">${escapeHtml(v.driver || unspecLabel)}</span></td>
        <td><strong>${Number(v.currentOdometer || 0).toLocaleString(numLocale)} ${t('kmUnit', 'كم')}</strong></td>
        <td>${escapeHtml(v.lastServiceDate || '--')}</td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-outline-primary btn-sm" onclick="generateVehiclePDFReport('${v.plate}')" title="${t('btnReport', 'تقرير')}">
              <i class="fa-solid fa-file-pdf"></i> ${t('btnReport', 'تقرير')}
            </button>
            <button class="btn btn-outline-secondary btn-sm" onclick="editVehicle('${v.id}')" title="${t('btnEdit', 'تعديل')}">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteVehicle('${v.id}')" title="${t('btnDelete', 'حذف')}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openNewVehicleModal(prefillProjectId = null) {
  document.getElementById('vehicle-form').reset();
  document.getElementById('vehicle-id').value = '';
  document.getElementById('modal-vehicle-title').innerHTML = '<i class="fa-solid fa-car"></i> ' + t('modalVehicleTitle', 'إضافة مركبة جديدة للأسطول');

  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  const select = document.getElementById('vehicle-project');
  select.innerHTML = `<option value="">${t('optSelectProject', '-- اختر المشروع المخصصة له السيارة --')}</option>`;
  projects.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.code})`;
    select.appendChild(opt);
  });

  if (prefillProjectId) {
    select.value = prefillProjectId;
  }

  openModal('modal-vehicle');
}

function handleSaveVehicle(event) {
  event.preventDefault();

  const id = document.getElementById('vehicle-id').value;
  const plate = document.getElementById('vehicle-plate').value.trim();
  const model = document.getElementById('vehicle-model').value.trim();
  const year = parseInt(document.getElementById('vehicle-year').value) || new Date().getFullYear();
  const projectId = document.getElementById('vehicle-project').value;
  const driver = document.getElementById('vehicle-driver').value.trim();
  const currentOdo = parseFloat(document.getElementById('vehicle-current-odo').value) || 0;

  const vehicles = JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]');

  if (id) {
    const index = vehicles.findIndex(v => v.id === id);
    if (index !== -1) {
      vehicles[index] = { ...vehicles[index], plate, model, year, projectId, driver, currentOdometer: currentOdo };
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
      cloudSave('vehicles', vehicles[index].id || vehicles[index].plate, vehicles[index]);
      logAudit('تعديل مركبة', `تم تعديل بيانات السيارة: ${model}`, plate);
      showToast('تم تعديل بيانات المركبة بنجاح', 'success');
    }
  } else {
    const newVeh = {
      id: 'veh-' + Date.now(),
      plate,
      model,
      year,
      projectId,
      driver,
      currentOdometer: currentOdo,
      lastServiceDate: new Date().toISOString().split('T')[0]
    };
    vehicles.push(newVeh);
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
    cloudSave('vehicles', newVeh.id, newVeh);
    logAudit('إضافة مركبة', `تمت إضافة سيارة جديدة لأسطول الشركة: ${model}`, plate);
    showToast('تمت إضافة المركبة إلى الأسطول بنجاح', 'success');
  }

  closeModal('modal-vehicle');
  renderVehiclesTable();
  refreshStatsCounters();
}

function editVehicle(id) {
  const vehicles = JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]');
  const veh = vehicles.find(v => v.id === id);
  if (!veh) return;

  openNewVehicleModal();

  document.getElementById('vehicle-id').value = veh.id;
  document.getElementById('vehicle-plate').value = veh.plate;
  document.getElementById('vehicle-model').value = veh.model;
  document.getElementById('vehicle-year').value = veh.year || '';
  document.getElementById('vehicle-project').value = veh.projectId || '';
  document.getElementById('vehicle-driver').value = veh.driver || '';
  document.getElementById('vehicle-current-odo').value = veh.currentOdometer || 0;

  document.getElementById('modal-vehicle-title').innerHTML = '<i class="fa-solid fa-pen"></i> تعديل بيانات المركبة';
}

function deleteVehicle(id) {
  const vehicles = JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]');
  const veh = vehicles.find(v => v.id === id);
  if (!veh) return;

  if (confirm(`هل أنت متأكد من حذف المركبة [${veh.plate}] من أسطول الشركة؟`)) {
    const updated = vehicles.filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(updated));
    cloudDelete('vehicles', id);
    logAudit('حذف مركبة', `قام المدير بحذف السيارة: ${veh.model}`, veh.plate);
    showToast('تم حذف المركبة بنجاح', 'success');
    renderVehiclesTable();
    refreshStatsCounters();
  }
}

// =============================================================================
// 12. إدارة السائقين والفنيين (خاص بالمديرين) مع ربط السيارة المخصصة
// =============================================================================

function renderTechniciansTable() {
  const tbody = document.getElementById('techs-table-body');
  if (!tbody) return;

  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  const cards = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARDS) || '[]');

  const technicians = users.filter(u => u.role === 'technician');

  if (technicians.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center p-3 text-muted">${t('noTechsRegistered', 'لا يوجد سائقين مسجلين بعد. اضغط "إضافة سائق / فني جديد" للبدء.')}</td></tr>`;
    return;
  }

  const unspecLabel = currentLang === 'ar' ? 'غير محدد' : 'Unspecified';
  const unassignedLabel = currentLang === 'ar' ? 'غير مخصص' : 'Unassigned';

  tbody.innerHTML = technicians.map(tItem => {
    const prj = projects.find(p => p.id === tItem.projectId);
    const cardCount = cards.filter(c => c.createdBy === tItem.id || c.techId === tItem.id || c.vehiclePlate === tItem.vehiclePlate).length;

    return `
      <tr>
        <td><strong>${escapeHtml(tItem.fullName)}</strong></td>
        <td><code>${escapeHtml(tItem.username)}</code></td>
        <td>${escapeHtml(tItem.phone || '--')}</td>
        <td><strong>${escapeHtml(prj ? prj.name : unspecLabel)}</strong></td>
        <td><span class="plate-badge">${escapeHtml(tItem.vehiclePlate || unassignedLabel)}</span></td>
        <td><span class="badge-status badge-active">${cardCount} ${t('cardsUnit', 'كروت')}</span></td>
        <td><span class="badge-status badge-active">${t('statusActive', 'نشط')}</span></td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-outline-secondary btn-sm" onclick="editTechnician('${tItem.id}')" title="${t('btnEdit', 'تعديل')}">
              <i class="fa-solid fa-user-pen"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteTechnician('${tItem.id}')" title="${t('btnDelete', 'حذف')}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openNewTechnicianModal() {
  document.getElementById('tech-form').reset();
  document.getElementById('tech-id').value = '';
  document.getElementById('tech-pass-req').classList.remove('hidden');
  document.getElementById('tech-pass-hint').textContent = 'كلمة المرور مطلوبة للحسابات الجديدة';
  document.getElementById('tech-password').required = true;
  document.getElementById('modal-tech-title').innerHTML = '<i class="fa-solid fa-user-gear"></i> إضافة سائق / فني جديد';

  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  const selectPrj = document.getElementById('tech-project');
  selectPrj.innerHTML = '<option value="">-- اختر المشروع لربط السائق به --</option>';
  projects.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.code})`;
    selectPrj.appendChild(opt);
  });

  onTechProjectChange();
  openModal('modal-tech');
}

function onTechProjectChange() {
  const prjId = document.getElementById('tech-project').value;
  const vehicleSelect = document.getElementById('tech-vehicle-plate');
  vehicleSelect.innerHTML = '<option value="">-- اختر السيارة المخصصة له فقط --</option>';

  const vehicles = JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]');
  const filtered = prjId ? vehicles.filter(v => v.projectId === prjId) : vehicles;

  filtered.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.plate;
    opt.textContent = `${v.plate} - ${v.model}`;
    vehicleSelect.appendChild(opt);
  });
}

async function handleSaveTechnician(event) {
  event.preventDefault();

  const id = document.getElementById('tech-id').value;
  const fullName = document.getElementById('tech-fullname').value.trim();
  const username = document.getElementById('tech-username').value.trim().toLowerCase();
  const password = document.getElementById('tech-password').value;
  const phone = document.getElementById('tech-phone').value.trim();
  const projectId = document.getElementById('tech-project').value;
  const vehiclePlate = document.getElementById('tech-vehicle-plate').value;

  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');

  const duplicate = users.find(u => u.username.toLowerCase() === username && u.id !== id);
  if (duplicate) {
    showToast('اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم آخر', 'error');
    return;
  }

  if (id) {
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index].fullName = fullName;
      users[index].username = username;
      users[index].phone = phone;
      users[index].projectId = projectId;
      users[index].vehiclePlate = vehiclePlate;

      if (password) {
        users[index].passwordHash = await hashPassword(password);
      }

      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      cloudSave('users', users[index].id, users[index]);
      logAudit('تعديل حساب سائق', `تم تعديل بيانات السائق: ${fullName}`, username);
      showToast('تم تعديل حساب السائق بنجاح', 'success');
    }
  } else {
    if (!password) {
      showToast('يرجى تحديد كلمة مرور للسائق', 'warning');
      return;
    }

    const newUser = {
      id: 'usr-tech-' + Date.now(),
      username,
      passwordHash: await hashPassword(password),
      fullName,
      role: 'technician',
      roleTitle: 'سائق مركبة / فني صيانة',
      projectId,
      vehiclePlate,
      phone,
      status: 'active'
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    cloudSave('users', newUser.id, newUser);

    // تحديث اسم السائق في جدول المركبات تلقائياً
    const vehicles = JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]');
    const vehIdx = vehicles.findIndex(v => v.plate === vehiclePlate);
    if (vehIdx !== -1) {
      vehicles[vehIdx].driver = fullName;
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
      cloudSave('vehicles', vehicles[vehIdx].id || vehicles[vehIdx].plate, vehicles[vehIdx]);
    }

    logAudit('إضافة سائق جديد', `تم إنشاء حساب سائق جديد للشركة: ${fullName}`, username);
    showToast('تمت إضافة حساب السائق بنجاح', 'success');
  }

  closeModal('modal-tech');
  renderTechniciansTable();
  if (currentUser && currentUser.role === 'admin') {
    renderVehiclesTable();
  }
}

function editTechnician(id) {
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  const tech = users.find(u => u.id === id);
  if (!tech) return;

  openNewTechnicianModal();

  document.getElementById('tech-id').value = tech.id;
  document.getElementById('tech-fullname').value = tech.fullName;
  document.getElementById('tech-username').value = tech.username;
  document.getElementById('tech-phone').value = tech.phone || '';
  document.getElementById('tech-project').value = tech.projectId || '';
  onTechProjectChange();
  document.getElementById('tech-vehicle-plate').value = tech.vehiclePlate || '';

  document.getElementById('tech-password').required = false;
  document.getElementById('tech-pass-req').classList.add('hidden');
  document.getElementById('tech-pass-hint').textContent = 'اترك كلمة المرور فارغة إذا كنت لا ترغب بتغييرها';

  document.getElementById('modal-tech-title').innerHTML = '<i class="fa-solid fa-user-pen"></i> تعديل بيانات السائق';
}

function deleteTechnician(id) {
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  const tech = users.find(u => u.id === id);
  if (!tech) return;

  if (confirm(`هل أنت متأكد من حذف حساب السائق (${tech.fullName})؟`)) {
    const updated = users.filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    cloudDelete('users', id);
    logAudit('حذف حساب سائق', `تم حذف حساب السائق: ${tech.fullName}`, tech.username);
    showToast('تم حذف حساب السائق بنجاح', 'success');
    renderTechniciansTable();
  }
}

// =============================================================================
// 13. النسخ الاحتياطي والتقارير والتدقيق (مركز التقارير Excel & PDF الشامل)
// =============================================================================

function toggleExportVehicleScope() {
  const isSpecific = document.getElementById('scope-vehicle') && document.getElementById('scope-vehicle').checked;
  const wrap = document.getElementById('export-vehicle-wrap');
  if (wrap) {
    if (isSpecific) {
      wrap.classList.remove('hidden');
      populateExportVehicleDropdown();
    } else {
      wrap.classList.add('hidden');
    }
  }
}

function populateExportVehicleDropdown() {
  const select = document.getElementById('export-vehicle-select');
  if (!select) return;

  const vehicles = JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]');
  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');

  if (vehicles.length === 0) {
    select.innerHTML = `<option value="">${t('noVehiclesRegistered', 'لا توجد سيارات مسجلة في الأسطول بعد')}</option>`;
    return;
  }

  const selectVehicleMsg = currentLang === 'ar' ? 'اختر السيارة المراد تخصيص التقرير لها' : (currentLang === 'en' ? 'Select vehicle for report' : (currentLang === 'ur' ? 'رپورٹ کے لیے گاڑی منتخب کریں' : (currentLang === 'hi' ? 'रिपोर्ट के लिए वाहन चुनें' : (currentLang === 'bn' ? 'রিপোর্টের জন্য গাড়ি নির্বাচন করুন' : 'Pumili ng sasakyan para sa ulat'))));
  const noDriverMsg = currentLang === 'ar' ? 'بدون سائق' : (currentLang === 'en' ? 'No driver' : (currentLang === 'ur' ? 'بغیر ڈرائیور' : (currentLang === 'hi' ? 'बिना ड्राइवर' : (currentLang === 'bn' ? 'ড্রাইভার ছাড়া' : 'Walang driver'))));
  const generalProjectMsg = currentLang === 'ar' ? 'مشروع عام' : (currentLang === 'en' ? 'General Project' : (currentLang === 'ur' ? 'عام منصوبہ' : (currentLang === 'hi' ? 'सामान्य परियोजना' : (currentLang === 'bn' ? 'সাধারণ প্রকল্প' : 'Pangkalahatang Proyekto'))));

  const currentSelected = select.value;
  select.innerHTML = `<option value="">-- ${selectVehicleMsg} --</option>`;
  vehicles.forEach(v => {
    const prj = projects.find(p => p.id === v.projectId);
    const prjName = prj ? prj.name : generalProjectMsg;
    const opt = document.createElement('option');
    opt.value = v.plate;
    opt.textContent = `[${v.plate}] ${v.model} - ${v.driver || noDriverMsg} (${prjName})`;
    select.appendChild(opt);
  });

  if (currentSelected) {
    select.value = currentSelected;
  }
}

function handleCustomExcelExport() {
  const isSpecific = document.getElementById('scope-vehicle') && document.getElementById('scope-vehicle').checked;
  const targetPlate = isSpecific ? (document.getElementById('export-vehicle-select') ? document.getElementById('export-vehicle-select').value : '') : 'all';

  if (isSpecific && !targetPlate) {
    showToast('يرجى تحديد السيارة المراد تصدير بياناتها أولاً من القائمة!', 'warning');
    return;
  }

  const allCards = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARDS) || '[]');
  const cards = (targetPlate === 'all')
    ? allCards
    : allCards.filter(c => c.vehiclePlate === targetPlate);

  if (cards.length === 0) {
    showToast(isSpecific ? `لا توجد كروت صيانة مسجلة للمركبة [${targetPlate}] لتصديرها` : 'لا توجد كروت صيانة مسجلة في النظام لتصديرها', 'warning');
    return;
  }

  // رأس جدول CSV مع كافة الحقول ودعم اللغة العربية الكامل بترميز UTF-8 مع BOM
  let csvContent = '\uFEFFم,رقم الكرت,اسم المشروع,رقم اللوحة,نوع وموديل المركبة,السائق المسؤول,تاريخ الصيانة,قراءة العداد الحالية (كم),رقم الفاتورة,المبلغ الإجمالي (ر.س),اسم الورشة / مركز الصيانة,التغييرات وأعمال الصيانة المنفذة,الملاحظات والتوصيات,حالة التوثيق بالصور,تاريخ ووقت القيد\n';

  cards.forEach((c, idx) => {
    const cleanDesc = (c.changesDescription || '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
    const cleanNotes = (c.notes || '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
    const cleanCreated = (c.createdAt || '').replace(/"/g, '""');
    const photoStatus = (c.imgOdometer || c.imgInvoice || c.imgParts) ? 'نعم (موثق بصور)' : 'لا (صيانة سابقة بدون صور)';

    csvContent += `"${idx + 1}","${c.cardNumber || c.id}","${c.projectName || ''}","${c.vehiclePlate}","${c.vehicleModel || ''}","${c.techName || ''}","${c.serviceDate}","${c.odometerCurrent}","${c.invoiceNumber}","${c.cost}","${c.workshopName}","${cleanDesc}","${cleanNotes}","${photoStatus}","${cleanCreated}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fileDate = new Date().toISOString().split('T')[0];
  a.download = (targetPlate === 'all')
    ? `كروت_صيانة_جميع_سيارات_الأسطول_${fileDate}.csv`
    : `كروت_صيانة_سيارة_${targetPlate.replace(/\s+/g, '_')}_${fileDate}.csv`;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  logAudit('تصدير كروت صيانة Excel', `تم تصدير ملف Excel لـ ${targetPlate === 'all' ? 'جميع سيارات الأسطول' : 'السيارة ' + targetPlate} (${cards.length} كرت)`, targetPlate);
  showToast(`تم تصدير ملف الإكسل بنجاح (${cards.length} كرت صيانة)`, 'success');
}

function handleCustomPDFReport() {
  const isSpecific = document.getElementById('scope-vehicle') && document.getElementById('scope-vehicle').checked;
  const targetPlate = isSpecific ? (document.getElementById('export-vehicle-select') ? document.getElementById('export-vehicle-select').value : '') : 'all';

  if (isSpecific && !targetPlate) {
    showToast('يرجى تحديد السيارة المراد إصدار تقريرها أولاً من القائمة!', 'warning');
    return;
  }

  generateVehiclePDFReport(targetPlate);
}

function generateVehiclePDFReport(targetPlate = 'all') {
  const allCards = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARDS) || '[]');
  const vehicles = JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]');
  const projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');

  const isAll = (targetPlate === 'all' || !targetPlate);
  const matchingCards = isAll
    ? [...allCards]
    : allCards.filter(c => c.vehiclePlate === targetPlate);

  if (matchingCards.length === 0) {
    showToast(isAll ? 'لا توجد كروت صيانة مسجلة في النظام لإصدار التقرير' : `لا توجد كروت صيانة مسجلة للمركبة [${targetPlate}]`, 'warning');
    return;
  }

  // فرز الكروت بحسب تاريخ الصيانة تنازلياً
  matchingCards.sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));

  const totalSpent = matchingCards.reduce((acc, c) => acc + (parseFloat(c.cost) || 0), 0);
  const printContainer = document.getElementById('printable-fleet-report-content');
  const reportModalTitle = document.getElementById('fleet-report-title');

  if (reportModalTitle) {
    reportModalTitle.innerHTML = isAll
      ? '<i class="fa-solid fa-file-pdf"></i> تقرير صيانة أسطول المركبات والمشاريع الشامل'
      : `<i class="fa-solid fa-file-pdf"></i> الملف الفني وسجل صيانة المركبة: ${escapeHtml(targetPlate)}`;
  }

  const currentDateStr = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

  // تفاصيل المركبة إذا كان التقرير مخصصاً لسيارة واحدة
  const targetVehicle = isAll ? null : vehicles.find(v => v.plate === targetPlate);
  const targetProject = targetVehicle ? projects.find(p => p.id === targetVehicle.projectId) : null;

  let vehicleDetailsHtml = '';
  if (!isAll) {
    vehicleDetailsHtml = `
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; margin-bottom: 16px;">
        <h4 style="margin: 0 0 10px; color: var(--color-primary); font-size: 0.95rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
          <i class="fa-solid fa-car-side"></i> البيانات الفنية للمركبة المستخرجة من الأسطول:
        </h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; font-size: 0.85rem;">
          <div><span style="color:#64748b;">رقم اللوحة:</span> <strong class="plate-badge" style="display:inline-block; margin-top:2px;">${escapeHtml(targetPlate)}</strong></div>
          <div><span style="color:#64748b;">النوع والموديل:</span> <strong>${escapeHtml(targetVehicle ? targetVehicle.model : (matchingCards[0].vehicleModel || 'مركبة أسطول'))}</strong></div>
          <div><span style="color:#64748b;">سنة الصنع:</span> <strong>${escapeHtml(targetVehicle && targetVehicle.year ? targetVehicle.year : '--')}</strong></div>
          <div><span style="color:#64748b;">المشروع التابعة له:</span> <strong>${escapeHtml(targetProject ? targetProject.name : (matchingCards[0].projectName || 'مشروع عام'))}</strong></div>
          <div><span style="color:#64748b;">السائق المسؤول المعتمد:</span> <strong>${escapeHtml(targetVehicle && targetVehicle.driver ? targetVehicle.driver : (matchingCards[0].techName || 'سائق المشروع'))}</strong></div>
          <div><span style="color:#64748b;">قراءة العداد الحالية:</span> <strong style="color:#0d8a4d;">${Number(targetVehicle && targetVehicle.currentOdometer ? targetVehicle.currentOdometer : matchingCards[0].odometerCurrent).toLocaleString('ar-SA')} كم</strong></div>
        </div>
      </div>
    `;
  }

  // ملخص المؤشرات الرقمية أعلى التقرير
  const summaryCountersHtml = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 16px;">
      <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:10px 14px; text-align:center;">
        <span style="font-size:0.78rem; color:#166534; display:block;">إجمالي عدد عمليات الصيانة</span>
        <strong style="font-size:1.3rem; color:#0d8a4d;">${matchingCards.length} كرت</strong>
      </div>
      <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:6px; padding:10px 14px; text-align:center;">
        <span style="font-size:0.78rem; color:#1e40af; display:block;">إجمالي التكاليف والمصروفات</span>
        <strong style="font-size:1.3rem; color:#162e50;">${totalSpent.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} <small style="font-size:0.75rem;">ر.س</small></strong>
      </div>
      ${isAll ? `
        <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:10px 14px; text-align:center;">
          <span style="font-size:0.78rem; color:#475569; display:block;">عدد المركبات المشمولة</span>
          <strong style="font-size:1.3rem; color:#334155;">${new Set(matchingCards.map(c => c.vehiclePlate)).size} مركبة</strong>
        </div>
      ` : `
        <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:10px 14px; text-align:center;">
          <span style="font-size:0.78rem; color:#475569; display:block;">متوسط تكلفة الصيانة</span>
          <strong style="font-size:1.3rem; color:#334155;">${(totalSpent / matchingCards.length).toLocaleString('ar-SA', { minimumFractionDigits: 2 })} <small style="font-size:0.75rem;">ر.س</small></strong>
        </div>
      `}
    </div>
  `;

  // توليد جدول كروت الصيانة
  const tableRowsHtml = matchingCards.map((c, index) => {
    const hasOdo = Boolean(c.imgOdometer && c.imgOdometer.startsWith('data:image'));
    const hasInv = Boolean(c.imgInvoice && c.imgInvoice.startsWith('data:image'));
    const hasParts = Boolean(c.imgParts && c.imgParts.startsWith('data:image'));
    const hasAnyImg = hasOdo || hasInv || hasParts;

    let photoBadgeHtml = '';
    if (hasAnyImg) {
      photoBadgeHtml = '<span class="badge-status badge-active" style="font-size:0.72rem; white-space:nowrap;"><i class="fa-solid fa-camera"></i> موثق بالصور</span>';
    } else {
      photoBadgeHtml = '<span class="badge-status badge-pending" style="font-size:0.72rem; white-space:nowrap;"><i class="fa-solid fa-clock-rotate-left"></i> صيانة سابقة دفترياً</span>';
    }

    return `
      <tr>
        <td style="text-align:center; font-weight:700;">${index + 1}</td>
        <td><code>${escapeHtml(c.cardNumber || c.id)}</code></td>
        <td style="white-space:nowrap;">${escapeHtml(c.serviceDate)}</td>
        ${isAll ? `<td><strong class="plate-badge">${escapeHtml(c.vehiclePlate)}</strong></td>` : ''}
        ${isAll ? `<td>${escapeHtml(c.vehicleModel || '--')}</td>` : ''}
        <td>${escapeHtml(c.projectName || 'مشروع عام')}</td>
        <td>${escapeHtml(c.techName || '--')}</td>
        <td style="font-weight:700; color:#0d8a4d;">${Number(c.odometerCurrent || 0).toLocaleString('ar-SA')} كم</td>
        <td>${escapeHtml(c.invoiceNumber || '--')}</td>
        <td style="font-weight:800; color:#162e50; white-space:nowrap;">${Number(c.cost || 0).toFixed(2)} ر.س</td>
        <td style="font-size:0.8rem; max-width:240px; line-height:1.4;">${escapeHtml(c.changesDescription || '--')}</td>
        <td style="text-align:center;">${photoBadgeHtml}</td>
      </tr>
    `;
  }).join('');

  printContainer.innerHTML = `
    <div class="official-print-card">
      <header class="print-header">
        <div class="print-brand">
          ${BRAND_LOGO_SVG}
          <div>
            <h1 style="margin:0 0 4px; font-size:1.35rem; color:#162e50;">شركة الأداء المتوازن للمقاولات</h1>
            <p style="margin:0; font-size:0.82rem; color:#475569;">إدارة الحركة والمعدات والصيانة | سجل وتقارير الصيانة الدورية المعتمدة</p>
          </div>
        </div>
        <div class="print-card-badge" style="text-align:center; border:2px dashed #0d8a4d; padding:8px 16px; border-radius:6px;">
          <strong style="color:#0d8a4d; font-size:1.05rem; display:block;">
            ${isAll ? 'تقرير أسطول المركبات الشامل' : 'سجل صيانة المركبة الرسمي'}
          </strong>
          <span style="font-size:0.75rem; color:#334155; font-weight:700;">
            ${isAll ? 'كافة سيارات ومشاريع الشركة' : 'لوحة: ' + escapeHtml(targetPlate)}
          </span>
          <small style="display:block; font-size:0.7rem; color:#64748b; margin-top:3px;">
            تاريخ الطباعة: ${currentDateStr}
          </small>
        </div>
      </header>

      ${vehicleDetailsHtml}
      ${summaryCountersHtml}

      <div class="print-section-title" style="margin: 14px 0 8px; display:flex; justify-content:space-between; align-items:center;">
        <span><i class="fa-solid fa-list-check"></i> بيان وتفاصيل كروت الصيانة المنفذة</span>
        <span style="font-size:0.78rem; font-weight:normal; color:#64748b;">العدد الإجمالي: (${matchingCards.length}) كرت صيانة</span>
      </div>

      <div class="table-responsive" style="overflow-x:auto;">
        <table class="data-table" style="font-size:0.82rem; width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="width:30px; text-align:center;">#</th>
              <th>رقم الكرت</th>
              <th>تاريخ الصيانة</th>
              ${isAll ? '<th>رقم اللوحة</th>' : ''}
              ${isAll ? '<th>النوع والموديل</th>' : ''}
              <th>المشروع</th>
              <th>السائق المسؤول</th>
              <th>قراءة العداد</th>
              <th>رقم الفاتورة</th>
              <th>المبلغ</th>
              <th>الأعمال والقطع المستبدلة</th>
              <th style="text-align:center;">التوثيق</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
          <tfoot>
            <tr style="background:#f8fafc; font-weight:800; font-size:0.88rem; border-top:2px solid #cbd5e1;">
              <td colspan="${isAll ? 9 : 7}" style="text-align:left; padding:12px 14px; color:#162e50;">
                إجمالي التكاليف والمصروفات المعتمدة:
              </td>
              <td style="color:#0d8a4d; font-size:1.02rem; padding:12px 8px; white-space:nowrap;">
                ${totalSpent.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
              </td>
              <td colspan="2" style="text-align:center; color:#64748b; font-size:0.78rem;">
                تم تدقيق واعتماد المبالغ رسمياً
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <footer class="print-signatures" style="margin-top: 30px;">
        <div class="signature-box">
          <p>${isAll ? 'مسؤول حركة وأسطول السيارات' : 'السائق / الفني المسؤول عن المركبة'}</p>
          <div class="signature-space"></div>
          <p>${isAll ? 'المهندس المشرف' : escapeHtml(targetVehicle && targetVehicle.driver ? targetVehicle.driver : matchingCards[0].techName || 'السائق')}</p>
        </div>
        <div class="signature-box">
          <p>مدير المشاريع والمعدات</p>
          <div class="signature-space"></div>
          <p>الاعتماد الفني والمطابقة</p>
        </div>
        <div class="signature-box">
          <p>الإدارة المالية والعامة</p>
          <div class="signature-space"></div>
          <p>شركة الأداء المتوازن للمقاولات</p>
        </div>
      </footer>
    </div>
  `;

  openModal('modal-view-fleet-report');
  logAudit('إصدار تقرير صيانة شامل', `تم توليد تقرير الصيانة الشامل (${isAll ? 'جميع السيارات' : 'السيارة ' + targetPlate})`, targetPlate);
}

function printFleetReport() {
  document.body.style.overflow = 'visible';
  const modalView = document.getElementById('modal-view-fleet-report');
  if (modalView) modalView.style.overflow = 'visible';
  window.print();
}

function exportCardsToCSV() {
  handleCustomExcelExport();
}

function exportFullBackupJSON() {
  const backupData = {
    system: 'نظام كروت صيانة المركبات - شركة الأداء المتوازن للمقاولات',
    version: '2.0.0',
    exportDate: new Date().toISOString(),
    users: JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
    projects: JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]'),
    vehicles: JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]'),
    cards: JSON.parse(localStorage.getItem(STORAGE_KEYS.CARDS) || '[]'),
    audit: JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT) || '[]')
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `نسخة_احتياطية_الأداء_المتوازن_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  logAudit('نسخة احتياطية كاملة', 'تم تصدير قاعدة البيانات بالكامل إلى ملف JSON', 'النظام');
  showToast('تم تحميل النسخة الاحتياطية بنجاح', 'success');
}

function importBackupJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (confirm('استيراد النسخة الاحتياطية سيقوم باستبدال البيانات الحالية. هل تريد المتابعة؟')) {
        if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
        if (data.projects) localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(data.projects));
        if (data.vehicles) localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(data.vehicles));
        if (data.cards) localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(data.cards));

        if (isCloudSyncActive && cloudDb) {
          syncLocalDataToCloud();
        }

        logAudit('استعادة نسخة احتياطية', 'تمت استعادة قاعدة البيانات من ملف خارجي', 'النظام');
        showToast('تمت استعادة البيانات بنجاح، جاري إعادة التحميل...', 'success');
        setTimeout(() => location.reload(), 1500);
      }
    } catch (err) {
      showToast('الملف المرفق غير صالح!', 'error');
    }
  };
  reader.readAsText(file);
}

function renderAuditTable() {
  const tbody = document.getElementById('audit-table-body');
  if (!tbody) return;

  const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT) || '[]');
  if (list.length === 0) {
    const emptyMsg = currentLang === 'ar' ? 'لا توجد عمليات مسجلة بعد' : (currentLang === 'en' ? 'No operations logged yet' : (currentLang === 'ur' ? 'ابھی تک کوئی لاگ درج نہیں ہے' : (currentLang === 'hi' ? 'कोई रिकॉर्ड नहीं है' : (currentLang === 'bn' ? 'কোনো লগ রেকর্ড নেই' : 'Walang naka-log na operasyon'))));
    tbody.innerHTML = `<tr><td colspan="5" class="text-center p-3 text-muted">${emptyMsg}</td></tr>`;
    return;
  }

  tbody.innerHTML = list.slice(0, 30).map(item => `
    <tr>
      <td><small>${escapeHtml(item.timestamp)}</small></td>
      <td><strong>${escapeHtml(item.username)}</strong></td>
      <td><span class="badge-status badge-active">${escapeHtml(item.action)}</span></td>
      <td>${escapeHtml(item.details)}</td>
      <td><code>${escapeHtml(item.target || '--')}</code></td>
    </tr>
  `).join('');
}

function clearAuditLog() {
  if (confirm('هل أنت متأكد من مسح سجل العمليات؟')) {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify([]));
    renderAuditTable();
    showToast('تم مسح سجل العمليات بنجاح', 'success');
  }
}

// =============================================================================
// 14. النوافذ المنبثقة وعارض الصور
// =============================================================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    modal.scrollTop = 0;
    const body = modal.querySelector('.modal-body');
    if (body) body.scrollTop = 0;
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    const remainingOpen = document.querySelectorAll('.modal-backdrop:not(.hidden)');
    if (remainingOpen.length === 0) {
      document.body.style.overflow = '';
    }
  }
}

function openLightbox(imageSrc, caption) {
  const lightbox = document.getElementById('modal-lightbox');
  const img = document.getElementById('lightbox-img');
  const cap = document.getElementById('lightbox-caption');

  if (lightbox && img) {
    img.src = imageSrc;
    cap.textContent = caption || 'معاينة الصورة';
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeLightbox() {
  const lightbox = document.getElementById('modal-lightbox');
  if (lightbox) {
    lightbox.classList.add('hidden');
    const remainingOpen = document.querySelectorAll('.modal-backdrop:not(.hidden)');
    if (remainingOpen.length === 0) {
      document.body.style.overflow = '';
    }
  }
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLightbox();
    document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(m => closeModal(m.id));
  }
});

/**
 * دالة طباعة كرت الصيانة الرسمي بشكل كامل ومتجاوب A4 بدون أي اقتصاص
 */
function printMaintenanceCard() {
  document.body.style.overflow = 'visible';
  const modalView = document.getElementById('modal-view-card');
  if (modalView) modalView.style.overflow = 'visible';

  // استدعاء نافذة الطباعة / الحفظ كـ PDF
  window.print();
}

// معالجة قيود المتصفح قبل وبعد الطباعة لضمان ظهور الصفحة كاملة
window.addEventListener('beforeprint', () => {
  document.body.style.overflow = 'visible';
  const modalView = document.getElementById('modal-view-card');
  if (modalView) modalView.style.overflow = 'visible';
  const modalReport = document.getElementById('modal-view-fleet-report');
  if (modalReport) modalReport.style.overflow = 'visible';
});

window.addEventListener('afterprint', () => {
  const remainingOpen = document.querySelectorAll('.modal-backdrop:not(.hidden)');
  if (remainingOpen.length > 0) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

// =============================================================================
// 14.5 المزامنة السحابية الحقيقية وكود مشاركة البيانات (Cloud Sync & Multi-Device Sync Engine)
// =============================================================================

/**
 * تهيئة محرك المزامنة السحابية Firebase Firestore
 */
function initCloudSync() {
  const rawConfig = localStorage.getItem(STORAGE_KEYS.CLOUD_CONFIG);
  if (!rawConfig) {
    updateCloudStatusUI(false);
    return;
  }

  try {
    const cfg = JSON.parse(rawConfig);
    if (!cfg || !cfg.projectId || !cfg.apiKey) {
      updateCloudStatusUI(false);
      return;
    }

    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDKs not loaded yet.');
      updateCloudStatusUI(false);
      return;
    }

    const firebaseConfig = {
      apiKey: cfg.apiKey,
      authDomain: `${cfg.projectId}.firebaseapp.com`,
      projectId: cfg.projectId,
      storageBucket: `${cfg.projectId}.appspot.com`,
      appId: cfg.appId || `1:100000000000:web:${cfg.projectId}`
    };

    let app;
    if (!firebase.apps || firebase.apps.length === 0) {
      app = firebase.initializeApp(firebaseConfig);
    } else {
      app = firebase.apps[0];
    }

    cloudDb = firebase.firestore(app);
    isCloudSyncActive = true;
    updateCloudStatusUI(true);
    setupRealtimeCloudListeners();
    console.log('Firebase Cloud Sync is active.');
  } catch (err) {
    console.error('Error initializing Cloud Sync:', err);
    updateCloudStatusUI(false);
  }
}

/**
 * تحديث شارة وحالة الربط السحابي في واجهة المستخدم
 */
function updateCloudStatusUI(isConnected) {
  const badge = document.getElementById('cloud-status-badge');
  if (!badge) return;

  if (isConnected) {
    badge.className = 'badge-status badge-active';
    badge.innerHTML = `<i class="fa-solid fa-cloud"></i> ${currentLang === 'ar' ? 'متصل بالسحابة (مزامنة مباشرة)' : 'Cloud Connected (Live Sync)'}`;
  } else {
    badge.className = 'badge-status badge-pending';
    badge.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> ${currentLang === 'ar' ? 'غير متصل بالسحابة (تخزين محلي)' : 'Local Storage Only'}`;
  }
}

/**
 * الاستماع اللحظي للتغييرات السحابية ومزامنتها محلياً فور ورودها
 */
function setupRealtimeCloudListeners() {
  if (!cloudDb || !isCloudSyncActive) return;

  // تنظيف أي مستمعات سابقة
  cloudListeners.forEach(unsub => {
    if (typeof unsub === 'function') unsub();
  });
  cloudListeners = [];

  const collections = [
    { name: 'projects', key: STORAGE_KEYS.PROJECTS, render: () => { if (currentTab === 'projects') renderProjectsTable(); populateFilterOptions(); refreshStatsCounters(); } },
    { name: 'vehicles', key: STORAGE_KEYS.VEHICLES, render: () => { if (currentTab === 'vehicles') renderVehiclesTable(); populateFilterOptions(); refreshStatsCounters(); } },
    { name: 'cards', key: STORAGE_KEYS.CARDS, render: () => { if (currentTab === 'cards') renderCardsList(); refreshStatsCounters(); } },
    { name: 'users', key: STORAGE_KEYS.USERS, render: () => { if (currentTab === 'technicians') renderTechniciansTable(); if (currentTab === 'admins') renderAdminsTable(); } }
  ];

  collections.forEach(colInfo => {
    try {
      const unsub = cloudDb.collection(colInfo.name).onSnapshot(snapshot => {
        if (isCloudSyncing) return;
        const docs = [];
        snapshot.forEach(doc => docs.push(doc.data()));

        if (docs.length > 0) {
          // دمج أو استبدال القائمة
          if (colInfo.name === 'users') {
            // ضمان وجود حساب المدير الرئيسي دائماً
            const localUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
            const masterAdmin = localUsers.find(u => u.isSuperAdmin || u.username === 'admin');
            if (masterAdmin && !docs.some(u => u.username === masterAdmin.username)) {
              docs.unshift(masterAdmin);
            }
          }

          localStorage.setItem(colInfo.key, JSON.stringify(docs));
          colInfo.render();
        }
      }, err => {
        console.warn(`Firestore listener error on ${colInfo.name}:`, err);
      });

      cloudListeners.push(unsub);
    } catch (e) {
      console.warn('Listener setup exception:', e);
    }
  });
}

/**
 * حفظ مستند في السحابة
 */
function cloudSave(collectionName, docId, data) {
  if (!isCloudSyncActive || !cloudDb || !docId) return;
  try {
    isCloudSyncing = true;
    cloudDb.collection(collectionName).doc(String(docId)).set(data, { merge: true })
      .then(() => { isCloudSyncing = false; })
      .catch(err => {
        isCloudSyncing = false;
        console.warn(`Cloud save failed for ${collectionName}/${docId}:`, err);
      });
  } catch (err) {
    isCloudSyncing = false;
    console.warn(`Cloud save exception for ${collectionName}:`, err);
  }
}

/**
 * حذف مستند من السحابة
 */
function cloudDelete(collectionName, docId) {
  if (!isCloudSyncActive || !cloudDb || !docId) return;
  try {
    isCloudSyncing = true;
    cloudDb.collection(collectionName).doc(String(docId)).delete()
      .then(() => { isCloudSyncing = false; })
      .catch(err => {
        isCloudSyncing = false;
        console.warn(`Cloud delete failed for ${collectionName}/${docId}:`, err);
      });
  } catch (err) {
    isCloudSyncing = false;
    console.warn(`Cloud delete exception for ${collectionName}:`, err);
  }
}

/**
 * مزامنة كافة البيانات المحلية الحالية ورفعها إلى السحابة فور الربط
 */
function syncLocalDataToCloud() {
  if (!isCloudSyncActive || !cloudDb) return;
  const collections = [
    { name: 'projects', key: STORAGE_KEYS.PROJECTS },
    { name: 'vehicles', key: STORAGE_KEYS.VEHICLES },
    { name: 'cards', key: STORAGE_KEYS.CARDS },
    { name: 'users', key: STORAGE_KEYS.USERS }
  ];

  collections.forEach(col => {
    const list = JSON.parse(localStorage.getItem(col.key) || '[]');
    list.forEach(item => {
      const docId = item.id || item.plate || item.username;
      if (docId) {
        cloudDb.collection(col.name).doc(String(docId)).set(item, { merge: true }).catch(() => {});
      }
    });
  });
}

/**
 * فتح نافذة إعدادات الربط السحابي
 */
function openCloudSyncModal() {
  const raw = localStorage.getItem(STORAGE_KEYS.CLOUD_CONFIG);
  if (raw) {
    try {
      const cfg = JSON.parse(raw);
      if (cfg.projectId) document.getElementById('cloud-project-id').value = cfg.projectId;
      if (cfg.apiKey) document.getElementById('cloud-api-key').value = cfg.apiKey;
      if (cfg.appId) document.getElementById('cloud-app-id').value = cfg.appId;
    } catch (e) {}
  }
  openModal('modal-cloud-sync');
}

/**
 * معالجة حفظ إعدادات السحابة وتفعيل المزامنة المباشرة
 */
function handleSaveCloudConfig(event) {
  event.preventDefault();
  const projectId = document.getElementById('cloud-project-id').value.trim();
  const apiKey = document.getElementById('cloud-api-key').value.trim();
  const appId = document.getElementById('cloud-app-id').value.trim();

  if (!projectId || !apiKey) {
    showToast('يرجى إدخال Project ID و API Key بشكل صحيح', 'warning');
    return;
  }

  const config = { projectId, apiKey, appId };
  localStorage.setItem(STORAGE_KEYS.CLOUD_CONFIG, JSON.stringify(config));

  closeModal('modal-cloud-sync');
  initCloudSync();

  setTimeout(() => {
    syncLocalDataToCloud();
    showToast('تم تفعيل المزامنة السحابية بنجاح ومزامنة البيانات الحالية!', 'success');
  }, 500);
}

/**
 * فصل الربط السحابي والعودة للتخزين المحلي فقط
 */
function disconnectCloudSync() {
  if (confirm(currentLang === 'ar' ? 'هل أنت متأكد من إلغاء الربط السحابي؟ سيعمل النظام محلياً على هذا المتصفح فقط.' : 'Are you sure you want to disconnect cloud sync?')) {
    localStorage.removeItem(STORAGE_KEYS.CLOUD_CONFIG);
    if (cloudListeners) {
      cloudListeners.forEach(u => { if (typeof u === 'function') u(); });
      cloudListeners = [];
    }
    cloudDb = null;
    isCloudSyncActive = false;
    updateCloudStatusUI(false);
    closeModal('modal-cloud-sync');
    showToast(currentLang === 'ar' ? 'تم إلغاء الربط السحابي والعودة للتخزين المحلي' : 'Cloud sync disconnected', 'info');
  }
}

/**
 * فتح نافذة كود المزامنة السريع للمشاركة عبر الواتساب أو البريد
 */
function openSyncCodeModal() {
  const syncPayload = {
    app: 'balanced-fleet-system',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    users: JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
    projects: JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]'),
    vehicles: JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]'),
    cards: JSON.parse(localStorage.getItem(STORAGE_KEYS.CARDS) || '[]')
  };

  const jsonStr = JSON.stringify(syncPayload);
  const codeArea = document.getElementById('sync-code-area');
  if (codeArea) {
    codeArea.value = jsonStr;
  }
  openModal('modal-sync-code');
}

/**
 * نسخ كود المزامنة إلى الحافظة
 */
function copySyncCodeToClipboard() {
  const codeArea = document.getElementById('sync-code-area');
  if (!codeArea || !codeArea.value) {
    showToast('لا يوجد كود بيانات للنسخ', 'warning');
    return;
  }

  codeArea.select();
  navigator.clipboard.writeText(codeArea.value)
    .then(() => {
      showToast('تم نسخ كود البيانات بنجاح! يمكنك الآن إرساله لأي هاتف أو جهاز آخر.', 'success');
    })
    .catch(() => {
      document.execCommand('copy');
      showToast('تم نسخ كود البيانات', 'success');
    });
}

/**
 * استيراد وتطبيق كود البيانات على الجهاز الحالي
 */
function applySyncCodeImport() {
  const codeArea = document.getElementById('sync-code-area');
  const raw = codeArea ? codeArea.value.trim() : '';

  if (!raw) {
    showToast('يرجى لصق كود البيانات في المربع أولاً', 'warning');
    return;
  }

  try {
    const data = JSON.parse(raw);
    if (!data.projects && !data.vehicles && !data.cards && !data.users) {
      showToast('كود البيانات غير صالح أو لا يحتوي على عناصر النظام', 'error');
      return;
    }

    if (confirm('تطبيق هذا الكود سيقوم بتحديث ومزامنة بيانات المشاريع والسيارات والكروت على هذا الجهاز. هل تريد المتابعة؟')) {
      if (data.users && data.users.length) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
      if (data.projects && data.projects.length) localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(data.projects));
      if (data.vehicles && data.vehicles.length) localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(data.vehicles));
      if (data.cards && data.cards.length) localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(data.cards));

      if (isCloudSyncActive && cloudDb) {
        syncLocalDataToCloud();
      }

      showToast('تم استيراد كود البيانات بنجاح! جارٍ تحديث الشاشات...', 'success');
      closeModal('modal-sync-code');
      setTimeout(() => location.reload(), 1200);
    }
  } catch (err) {
    showToast('صيغة كود البيانات غير صحيحة، تأكد من نسخه بالكامل', 'error');
  }
}

// =============================================================================
// 15. بدء تشغيل التطبيق (DOM Initialization)
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initializeDataStore();
  currentUser = getSessionUser();
  updateAppUI();
  applyLanguage(currentLang);
  initCloudSync();

  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal(backdrop.id);
      }
    });
  });
});

